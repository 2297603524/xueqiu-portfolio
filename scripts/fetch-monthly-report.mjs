#!/usr/bin/env node
/**
 * 每月最后一个交易日 17:00（北京时间）由 GitHub Actions 自动触发：
 *
 * 1. 判定「今天」是否为当月最后一个交易日（工作日 + 法定节假日表）
 *    - 不是 → 直接退出（0），不产生任何改动
 *    - 是   → 继续
 * 2. 从雪球 API 拉取当前持仓（需要登录 Cookie + 组合 ID）
 * 3. 与 data.json 最新月份 diff：生成当月快照（summary / categories / aShares / hShares）
 * 4. 幂等写入：当月已有快照则覆盖，否则追加
 * 5. 提交后由现有 monthly-update.yml（push: public/data.json）自动刷新行情并部署
 *
 * 环境变量：
 *   XUEQIU_COOKIE  雪球登录 Cookie（含 xq_a_token= 与 u= 等，完整复制）
 *   XUEQIU_PID     雪球组合/持仓 ID（网页地址栏 pid= 后面的数字）
 *   TZ             默认 Asia/Shanghai（GitHub Actions 需显式设置）
 *
 * 用法：
 *   node scripts/fetch-monthly-report.mjs            # 正常执行（内部判断交易日）
 *   node scripts/fetch-monthly-report.mjs --force    # 跳过交易日判断，强制抓取
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "public", "data.json");

// ---------- 交易日判定 ----------

/**
 * A 股法定休市日（YYYY-MM-DD，含周末由周几判定自动排除）。
 * 每年按国务院安排更新即可；补班日（周末上班）不处理，误差可接受。
 */
const HOLIDAYS = new Set([
  // 2026 年法定节假日（收盘休市日）
  "2026-01-01", // 元旦
  "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", // 春节
  "2026-04-06", // 清明
  "2026-05-01", "2026-05-04", "2026-05-05", // 劳动节
  "2026-06-19", // 端午
  "2026-09-25", // 中秋
  "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07", // 国庆
  // 2027 年（示例，保持脚本可用）
  "2027-01-01",
]);

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isTradingDay(d) {
  const day = d.getDay();
  if (day === 0 || day === 6) return false; // 周末
  if (HOLIDAYS.has(dateKey(d))) return false; // 法定节假日
  return true;
}

/**
 * 今天是否为当月最后一个交易日：
 * 今天必须本身是交易日，且从明天到月底不再有交易日
 */
function isLastTradingDayOfMonth(today) {
  if (!isTradingDay(today)) return false;
  const probe = new Date(today);
  for (;;) {
    probe.setDate(probe.getDate() + 1);
    if (probe.getMonth() !== today.getMonth()) return true; // 跨月 → 今天之后本月无交易日
    if (isTradingDay(probe)) return false; // 本月后续仍有交易日
  }
}

// ---------- 雪球 API ----------

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function xueqiuGet(url, cookie) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Cookie: cookie,
      Referer: "https://xueqiu.com/",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`雪球接口 HTTP ${res.status}: ${url.slice(0, 100)}`);
  const json = await res.json();
  if (json.error_code !== 0) {
    throw new Error(`雪球接口返回错误 error_code=${json.error_code}: ${json.error_description || ""}`);
  }
  return json;
}

/** 雪球代码 -> 我们的代码：SH600900 -> 600900.SH；HK01898 -> 01898.HK */
function ourCode(symbol) {
  const m = String(symbol).match(/^(SH|SZ|HK)(\d+)$/i);
  if (!m) return null;
  const [, market, num] = m;
  if (market.toUpperCase() === "SH") return num + ".SH";
  if (market.toUpperCase() === "SZ") return num + ".SZ";
  if (market.toUpperCase() === "HK") return num + ".HK";
  return null;
}

/**
 * 拉取当前持仓
 * @returns { holdings: [{code,name,shares,costPrice,currentPrice,marketValue,profitAmount,profitRatio}], totalAssets, cash, hkdCny }
 */
async function fetchPortfolio(cookie, pid) {
  // 1. 持仓列表
  const listUrl =
    `https://stock.xueqiu.com/v5/stock/portfolio/stock/list.json` +
    `?pid=${pid}&category=1&size=1000&page=1`;
  const listJson = await xueqiuGet(listUrl, cookie);
  const stocks = listJson?.data?.stocks || [];
  if (stocks.length === 0) {
    throw new Error("雪球返回持仓为空（组合 ID 可能不对或该组合无持仓）");
  }

  const holdings = stocks.map((s) => {
    const code = ourCode(s.code || s.symbol || "");
    if (!code) return null;
    const h = s.holding || {};
    const shares = Math.round(Number(h.current_amount ?? h.amount ?? 0));
    const costPrice = Number(h.avg_cost ?? 0);
    const currentPrice = Number(s.current ?? 0);
    const marketValue = Number(s.market_value ?? 0);
    const profitAmount = Number(s.profit ?? 0);
    const profitRatio = Number(s.profit_ratio ?? 0) / 100; // 雪球返回百分比数值
    return {
      code,
      name: String(s.name || code),
      shares,
      costPrice,
      currentPrice,
      marketValue,
      profitAmount,
      profitRatio,
    };
  }).filter(Boolean);

  // 2. 账户总资产 / 现金（接口失败时按持仓市值估算）
  let totalAssets = 0;
  let cash = 0;
  try {
    const infoUrl = `https://stock.xueqiu.com/v5/stock/portfolio/hold_info.json?pid=${pid}`;
    const infoJson = await xueqiuGet(infoUrl, cookie);
    const info = infoJson?.data || {};
    totalAssets = Number(info.total_assets ?? 0);
    cash = Number(info.cash ?? 0);
  } catch (e) {
    console.warn("⚠️ 总资产接口失败，按持仓市值估算:", e.message);
    totalAssets = holdings.reduce((a, h) => a + h.marketValue, 0);
    cash = 0;
  }

  // 3. HKD/CNY 汇率（尝试新浪，失败兜底 0.92）
  let hkdCny = 0.92;
  try {
    const fxRes = await fetch("https://hq.sinajs.cn/list=fx_susdcny,fx_susdhkd", {
      headers: { Referer: "https://finance.sina.com.cn", "User-Agent": UA },
    });
    const fx = await fxRes.text();
    const usdCny = fx.match(/fx_susdcny="([^"]*)/)?.[1]?.split(",")[1];
    const usdHkd = fx.match(/fx_susdhkd="([^"]*)/)?.[1]?.split(",")[1];
    if (usdCny && usdHkd && Number(usdCny) > 0 && Number(usdHkd) > 0) {
      hkdCny = Number(usdCny) / Number(usdHkd);
    }
  } catch {
    /* 兜底 0.92 */
  }

  return { holdings, totalAssets, cash, hkdCny };
}

// ---------- 月报快照构造 ----------

function buildSnapshot(prev, cur, hkdCny) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM（本地时区注意）
  const label = `${month.slice(0, 4)} 年 ${Number(month.slice(5))} 月`;

  // 分类：与上月 diff
  const prevByCode = new Map((prev?.aShares?.holdings ?? []).map((h) => [h.code, h]));
  for (const h of prev?.hShares?.holdings ?? []) prevByCode.set(h.code, h);

  const categories = [
    { type: "open", label: "新开仓", count: 0, stocks: [] },
    { type: "close", label: "清仓", count: 0, stocks: [] },
    { type: "add", label: "加仓", count: 0, stocks: [] },
    { type: "reduce", label: "减仓", count: 0, stocks: [] },
  ];
  const catMap = Object.fromEntries(categories.map((c) => [c.type, c]));

  for (const h of cur.holdings) {
    const p = prevByCode.get(h.code);
    if (!p || !p.shares || p.shares <= 0) {
      if (h.shares > 0) catMap.open.stocks.push({ code: h.code, name: h.name, delta: h.shares });
    } else if (!h.shares || h.shares <= 0) {
      catMap.close.stocks.push({ code: h.code, name: h.name, delta: -p.shares });
    } else if (h.shares > p.shares) {
      catMap.add.stocks.push({ code: h.code, name: h.name, delta: h.shares - p.shares });
    } else if (h.shares < p.shares) {
      catMap.reduce.stocks.push({ code: h.code, name: h.name, delta: h.shares - p.shares });
    }
  }
  for (const p of prevByCode.values()) {
    if (p.shares > 0 && !cur.holdings.some((h) => h.code === p.code)) {
      catMap.close.stocks.push({ code: p.code, name: p.name, delta: -p.shares });
    }
  }
  for (const c of categories) c.count = c.stocks.length;

  // A/H 股拆分
  const aShares = [];
  const hShares = [];
  for (const h of cur.holdings) {
    const op = h.shares > 0 ? "hold" : "closed";
    if (h.code.endsWith(".HK")) {
      hShares.push({
        code: h.code,
        name: h.name,
        shares: h.shares,
        delta: prevByCode.get(h.code)?.delta ?? 0,
        op,
        costPriceHKD: h.costPrice,
        marketValueCNY: Math.round(h.marketValue * hkdCny),
        weight: 0,
        profitAmountCNY: Math.round(h.profitAmount * hkdCny),
        profitRatio: h.profitRatio,
      });
    } else {
      aShares.push({
        code: h.code,
        name: h.name,
        shares: h.shares,
        delta: prevByCode.get(h.code)?.delta ?? 0,
        op,
        costPrice: h.costPrice,
        currentPrice: h.currentPrice,
        marketValue: h.marketValue,
        weight: 0,
        profitAmount: h.profitAmount,
        profitRatio: h.profitRatio,
      });
    }
  }

  // 仓位重算
  const total = cur.totalAssets;
  for (const s of aShares) s.weight = total > 0 ? s.marketValue / total : 0;
  for (const s of hShares) s.weight = total > 0 ? s.marketValueCNY / total : 0;

  return {
    month,
    label,
    summary: {
      totalAssets: total,
      availableCash: cur.cash,
      cashRatio: total > 0 ? cur.cash / total : 0,
    },
    categories,
    aShares: {
      marketValue: aShares.reduce((a, s) => a + s.marketValue, 0),
      holdings: aShares,
    },
    hShares: {
      marketValueHKD: null,
      marketValueCNY: hShares.reduce((a, s) => a + s.marketValueCNY, 0),
      holdings: hShares,
    },
    audit: {
      by: "雪球接口自动抓取",
      verified: false,
    },
  };
}

// ---------- 主流程 ----------

async function main() {
  const force = process.argv.includes("--force");

  // 0. 交易日判定（--force 跳过）
  const now = new Date();
  if (!force) {
    if (!isLastTradingDayOfMonth(now)) {
      console.log(`今天 ${dateKey(now)} 不是当月最后一个交易日，跳过抓取。`);
      return;
    }
    console.log(`✅ 今天是 ${dateKey(now)}，本月最后一个交易日，开始抓取。`);
  } else {
    console.log("⚠️ --force 模式：跳过交易日判定，强制抓取。");
  }

  // 1. 读取配置
  const cookie = process.env.XUEQIU_COOKIE;
  const pid = process.env.XUEQIU_PID;
  if (!cookie || !pid) {
    console.error(
      "❌ 缺少配置。请在 GitHub 仓库设置 Secrets：\n" +
        "   XUEQIU_COOKIE = 雪球登录 Cookie（含 xq_a_token= / u= 等）\n" +
        "   XUEQIU_PID    = 雪球组合 ID（持仓页 URL 中 pid= 后的数字）"
    );
    process.exit(1);
  }

  // 2. 读现有数据
  const raw = readFileSync(DATA_PATH, "utf-8");
  const data = JSON.parse(raw);
  const prev = data.history[data.history.length - 1];

  // 3. 拉取持仓
  console.log("拉取雪球持仓…");
  const cur = await fetchPortfolio(cookie, pid);
  console.log(
    `  持仓 ${cur.holdings.length} 只 | 总资产 ${Math.round(cur.totalAssets).toLocaleString()} | 现金 ${Math.round(cur.cash).toLocaleString()} | 汇率 ${cur.hkdCny.toFixed(4)}`
  );

  // 4. 构造当月快照
  const snap = buildSnapshot(prev, cur, cur.hkdCny);
  const thisMonth = snap.month;
  console.log(`  生成快照 ${snap.label}：新开仓 ${snap.categories[0].count} / 清仓 ${snap.categories[1].count} / 加仓 ${snap.categories[2].count} / 减仓 ${snap.categories[3].count}`);

  // 5. 幂等写入：当月已有快照 → 覆盖；否则追加
  const idx = data.history.findIndex((h) => h.month === thisMonth);
  if (idx >= 0) {
    data.history[idx] = snap;
    console.log(`  🔁 当月（${thisMonth}）已有快照，已覆盖更新。`);
  } else {
    data.history.push(snap);
    console.log(`  ➕ 已追加 ${thisMonth} 快照。`);
  }

  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log("✅ public/data.json 已更新。");
}

main().catch((e) => {
  console.error("❌ 抓取失败:", e.message);
  process.exit(1);
});
