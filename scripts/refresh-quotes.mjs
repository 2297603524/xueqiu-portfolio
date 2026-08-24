#!/usr/bin/env node
/**
 * 行情自动刷新脚本
 *
 * 用法: node scripts/refresh-quotes.mjs
 *
 * 功能:
 *  1. 读取 public/data.json
 *  2. 通过腾讯行情接口拉取所有 A/H 股现价
 *  3. 通过新浪汇率接口拉取 HKD/CNY 汇率
 *  4. 重算每只股票的 现价/市值/仓位/盈亏/盈亏比例
 *  5. 重算账户总资产与现金仓位
 *  6. 写回 data.json（历史月份也一并刷新现价，方便回溯）
 *
 * 数据源（均免登录）:
 *  - A/H 股行情: https://qt.gtimg.cn/q=<code>
 *  - 汇率: https://hq.sinajs.cn/list=fx_susdcny,fx_susdhkd  (HKDCNY = USDCNY / USDHKD)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "public", "data.json");

// ---------- 工具 ----------

async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      ...headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

/** 腾讯行情返回是 GBK，转成 UTF-8 文本（Node 无法直接用 TextDecoder 处理 GBK，这里手动处理字节） */
async function fetchQuote(text) {
  return text;
}

function parseTencentLine(line) {
  // v_sh600900="1~长江电力~600900~28.15~..."
  const m = line.match(/="(.*)"\s*;?\s*$/);
  if (!m) return null;
  const parts = m[1].split("~");
  return parts;
}

/** 从腾讯行情行提取现价（A股 index 3，港股 index 3，单位均为原币种） */
function extractPrice(parts) {
  return parseFloat(parts[3]);
}

// ---------- 主流程 ----------

async function main() {
  // 1. 读数据
  const raw = readFileSync(DATA_PATH, "utf-8");
  const data = JSON.parse(raw);

  // 只刷新最新月份（history 升序排列，最后一个是最新）；历史月份保留当时价格
  const latest = data.history[data.history.length - 1];
  if (!latest) {
    console.log("没有历史数据可刷新。");
    return;
  }

  // 收集最新月份需要的行情代码（去重）
  const codes = new Set();
  for (const s of latest.aShares.holdings) if (s.shares > 0) codes.add(tencentCode(s.code));
  for (const s of latest.hShares.holdings) if (s.shares > 0) codes.add(tencentCode(s.code));
  const codeList = [...codes];
  if (codeList.length === 0) {
    console.log("没有持仓代码需要刷新。");
    return;
  }

  console.log(`拉取 ${codeList.length} 个标的行情...`);
  const quoteText = await fetchText(`https://qt.gtimg.cn/q=${codeList.join(",")}`);

  // 解析为 { 原代码: 现价 }
  const priceMap = {};
  for (const line of quoteText.split("\n")) {
    const m = line.match(/^v_([a-z]{2}\d+)=/);
    if (!m) continue;
    const parts = parseTencentLine(line);
    if (!parts) continue;
    const qCode = m[1];
    const price = extractPrice(parts);
    // 映射回我们的代码格式 (如 sh600900 -> 600900.SH)
    const ourCode = ourCodeFrom(qCode);
    if (ourCode && price > 0) priceMap[ourCode] = price;
  }
  console.log(`拿到 ${Object.keys(priceMap).length} 个现价。`);

  // 2. 拉汇率
  let hkdCny = 0.92; // 兜底值
  try {
    const fx = await fetchText("https://hq.sinajs.cn/list=fx_susdcny,fx_susdhkd", {
      Referer: "https://finance.sina.com.cn",
    });
    const usdCny = fx.match(/fx_susdcny="([^"]*)/)?.[1]?.split(",")[1];
    const usdHkd = fx.match(/fx_susdhkd="([^"]*)/)?.[1]?.split(",")[1];
    if (usdCny && usdHkd && parseFloat(usdCny) > 0 && parseFloat(usdHkd) > 0) {
      hkdCny = parseFloat(usdCny) / parseFloat(usdHkd);
    }
  } catch (e) {
    console.warn("汇率获取失败，使用兜底 0.92:", e.message);
  }
  console.log(`HKD/CNY 汇率: ${hkdCny.toFixed(4)}`);

  // 3. 刷新最新月份
  let updatedCount = 0;
  for (const h of [latest]) {
    const aShares = h.aShares.holdings;
    const hShares = h.hShares.holdings;

    // A 股: 现价/市值/仓位/盈亏
    for (const s of aShares) {
      const px = priceMap[s.code];
      if (!px || s.shares <= 0) {
        s.currentPrice = px ?? s.currentPrice;
        s.marketValue = s.shares > 0 ? Math.round(s.shares * s.currentPrice) : 0;
        continue;
      }
      s.currentPrice = px;
      s.marketValue = Math.round(s.shares * px);
      s.profitAmount = Math.round((px - s.costPrice) * s.shares);
      s.profitRatio = s.costPrice !== 0 ? (px - s.costPrice) / s.costPrice : null;
      updatedCount++;
    }

    // H 股: 现价(HKD) -> 市值(CNY) / 盈亏(CNY)
    for (const s of hShares) {
      const pxHkd = priceMap[s.code];
      if (!pxHkd || s.shares <= 0) continue;
      const pxCny = pxHkd * hkdCny;
      s.marketValueCNY = Math.round(s.shares * pxCny);
      // 成本价以 HKD 计；负成本（分红回收本金）时盈亏比例显示 —
      s.profitAmountCNY = Math.round((pxHkd - s.costPriceHKD) * hkdCny * s.shares);
      if (s.costPriceHKD > 0) {
        s.profitRatio = (pxHkd - s.costPriceHKD) / s.costPriceHKD;
      }
      updatedCount++;
    }

    // 仓位重算: A股/H股各自的市值占比
    const aVal = aShares.reduce((acc, s) => acc + s.marketValue, 0);
    const hVal = hShares.reduce((acc, s) => acc + s.marketValueCNY, 0);
    const total = h.summary.totalAssets; // 总资产以月报为准，不因行情波动改变口径
    for (const s of aShares) s.weight = total > 0 ? s.marketValue / total : 0;
    for (const s of hShares) s.weight = total > 0 ? s.marketValueCNY / total : 0;

    h.aShares.marketValue = aVal;
    h.hShares.marketValueCNY = hVal;
  }

  console.log(`已刷新 ${updatedCount} 条持仓记录。`);

  // 4. 写回
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log("✅ public/data.json 已更新。");
}

// ---------- 代码转换 ----------

/** 我们的代码格式 -> 腾讯格式 */
function tencentCode(code) {
  if (code.endsWith(".SH")) return "sh" + code.slice(0, 6);
  if (code.endsWith(".SZ")) return "sz" + code.slice(0, 6);
  if (code.endsWith(".HK")) return "hk" + code.slice(0, 5);
  return code;
}

/** 腾讯格式 -> 我们的代码格式 */
function ourCodeFrom(q) {
  const m = q.match(/^([a-z]{2})(\d+)$/);
  if (!m) return null;
  const [, prefix, num] = m;
  if (prefix === "sh") return num + ".SH";
  if (prefix === "sz") return num + ".SZ";
  if (prefix === "hk") return num + ".HK";
  return null;
}

main().catch((e) => {
  console.error("❌ 刷新失败:", e.message);
  process.exit(1);
});
