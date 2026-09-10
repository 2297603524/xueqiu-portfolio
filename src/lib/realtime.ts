// 实时行情工具：通过 JSONP（动态 <script>）拉取腾讯行情，绕过浏览器跨域限制。
// 腾讯接口返回形如 v_sh600900="1~长江电力~600900~28.15~28.06~..." 的赋值语句，脚本加载后成为全局变量。
//
// 为什么行情和汇率都走腾讯 qt.gtimg.cn：
//   新浪 hq.sinajs.cn 对外域 Referer 一律返回 403（实测 https://2297603524.github.io/ 同样被拒），
//   浏览器端 JSONP 必然失败 —— 这正是此前 H 股市值长期使用兜底汇率计算的原因。
//   腾讯的 whHKDCNY 提供实时「港元人民币」报价，与行情同源同协议，
//   一次 JSONP 请求即可拿到，既无跨域问题也无 Referer 限制。

export interface Quote {
  price: number; // 现价（原币种）
  prevClose: number; // 昨收
  change: number; // 涨跌额
  changePct: number; // 涨跌幅，小数比例（0.0123 表示 +1.23%）
}

/** 仅当所有实时汇率源都失败时才使用的兜底值（2026-09 实际约 0.855） */
export const FALLBACK_HKD_CNY = 0.855;

/** 汇率缓存有效期：10 分钟。汇率日内波动极小，没必要跟着 3 秒的行情一起刷 */
export const FX_TTL_MS = 10 * 60 * 1000;

/** 代码转换：600900.SH -> sh600900；01898.HK -> hk01898 */
export function tencentCode(code: string): string {
  if (code.endsWith(".SH")) return "sh" + code.slice(0, 6);
  if (code.endsWith(".SZ")) return "sz" + code.slice(0, 6);
  if (code.endsWith(".HK")) return "hk" + code.slice(0, 5);
  return code;
}

/** 腾讯格式 -> 我们的代码格式：sh600900 -> 600900.SH */
function ourCode(q: string): string | null {
  const m = q.match(/^(sh|sz|hk)(\d+)$/);
  if (!m) return null;
  const [, prefix, num] = m;
  if (prefix === "sh") return num + ".SH";
  if (prefix === "sz") return num + ".SZ";
  return num + ".HK";
}

/** 腾讯行情接口支持的市场前缀，用于过滤非法代码 */
const TENCENT_PREFIX = /^(sh|sz|hk)\d{4,6}$/;

/** 动态加载 script（JSONP），带超时与清理 */
function loadScript(src: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    let settled = false;
    const cleanup = () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    s.src = src;
    s.async = true;
    s.onload = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    s.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("行情接口连接失败"));
    };
    document.head.appendChild(s);
    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("行情接口请求超时"));
    }, timeoutMs);
  });
}

/**
 * 读取并立即清除指定的 JSONP 全局变量。
 * 只处理本次真正请求的键，避免每 3 秒遍历整个 window，也避免误删其他脚本的变量。
 */
function takeGlobals(names: string[]): Record<string, string> {
  const w = window as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const name of names) {
    const v = w[name];
    if (typeof v === "string") out[name] = v;
    try {
      delete w[name];
    } catch {
      /* 不可配置属性，忽略 */
    }
  }
  return out;
}

/**
 * 解析一行腾讯行情数据。
 * 关键点：腾讯返回的涨跌幅 parts[32] 是「百分数」（0.04 表示 0.04%），
 * 必须除以 100 才是本项目统一使用的小数比例，否则会被放大 100 倍。
 */
function parseQuote(parts: string[]): Quote | null {
  if (parts.length < 6) return null;
  const price = parseFloat(parts[3]);
  const prevClose = parseFloat(parts[4]);
  if (!Number.isFinite(price) || price <= 0) return null;
  const rawChange = parseFloat(parts[31]);
  const rawPct = parseFloat(parts[32]);
  const change = Number.isFinite(rawChange) ? rawChange : price - prevClose;
  const changePct = Number.isFinite(rawPct)
    ? rawPct / 100
    : prevClose > 0
      ? (price - prevClose) / prevClose
      : 0;
  return { price, prevClose, change, changePct };
}

/**
 * 拉取一批代码的实时行情（分批请求，避免 URL 超长）。
 * 部分批次失败时返回已成功的部分；全部批次都失败才抛错，交由调用方判定「连续失败」。
 * @returns { code -> Quote }
 */
export async function fetchQuotes(codes: string[]): Promise<Map<string, Quote>> {
  const map = new Map<string, Quote>();
  const BATCH = 50; // 腾讯接口单次 URL 建议不超过 ~2KB，每批 50 个代码安全
  let lastError: unknown = null;
  let succeeded = 0;

  for (let i = 0; i < codes.length; i += BATCH) {
    const batch = codes.slice(i, i + BATCH);
    const tCodes = batch.map(tencentCode).filter((c) => TENCENT_PREFIX.test(c));
    if (tCodes.length === 0) continue;
    try {
      await loadScript(`https://qt.gtimg.cn/q=${tCodes.join(",")}&_=${Date.now()}`);
      succeeded++;
    } catch (e) {
      lastError = e;
      continue;
    }
    const globals = takeGlobals(tCodes.map((c) => `v_${c}`));
    for (const tc of tCodes) {
      const raw = globals[`v_${tc}`];
      if (!raw) continue;
      const quote = parseQuote(raw.split("~"));
      const code = ourCode(tc);
      if (quote && code) map.set(code, quote);
    }
  }

  if (map.size === 0 && succeeded === 0) {
    throw lastError instanceof Error ? lastError : new Error("行情接口无有效返回");
  }
  return map;
}

/** 汇率合理区间校验，防止接口异常值污染计算 */
function saneRate(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) && n > 0.5 && n < 1.5 ? n : null;
}

/**
 * 实时 HKD/CNY 汇率，多级降级：
 *   1. 腾讯外汇 whHKDCNY（与行情同源，JSONP，无跨域 / Referer 限制）
 *   2. fxratesapi.com（免密 + CORS）
 *   3. open.er-api.com（免密 + CORS）
 * 全部失败返回 null，调用方使用 FALLBACK_HKD_CNY。
 */
export async function fetchHkdCny(): Promise<number | null> {
  // 1) 腾讯外汇
  try {
    await loadScript(`https://qt.gtimg.cn/q=whHKDCNY&_=${Date.now()}`, 5000);
    const raw = takeGlobals(["v_whHKDCNY"])["v_whHKDCNY"];
    if (raw) {
      const rate = saneRate(raw.split("~")[3]);
      if (rate !== null) return rate;
    }
  } catch {
    /* 继续降级 */
  }

  // 2) / 3) 免密汇率 API
  for (const url of [
    "https://api.fxratesapi.com/latest?base=HKD&symbols=CNY",
    "https://open.er-api.com/v6/latest/HKD",
  ]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const json = (await res.json()) as { rates?: { CNY?: unknown } };
      const rate = saneRate(json?.rates?.CNY);
      if (rate !== null) return rate;
    } catch {
      /* 继续降级 */
    }
  }

  return null;
}
