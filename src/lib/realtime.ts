// 实时行情工具：通过 JSONP（动态 <script>）方式拉取腾讯行情，绕过浏览器跨域限制
// 腾讯接口返回形如 v_sh600900="1~长江电力~600900~28.15~28.06~..." 的赋值语句，加载后成为全局变量

export interface Quote {
  price: number; // 现价（原币种）
  prevClose: number; // 昨收
  change: number; // 涨跌额
  changePct: number; // 涨跌幅（如 0.0123 表示 +1.23%）
}

/** 代码转换：600900.SH -> sh600900；01898.HK -> hk01898 */
export function tencentCode(code: string): string {
  if (code.endsWith(".SH")) return "sh" + code.slice(0, 6);
  if (code.endsWith(".SZ")) return "sz" + code.slice(0, 6);
  if (code.endsWith(".HK")) return "hk" + code.slice(0, 5);
  return code;
}

/** 腾讯格式 -> 我们的代码格式：sh600900 -> 600900.SH */
function ourCode(q: string): string | null {
  const m = q.match(/^([a-z]{2})(\d+)$/);
  if (!m) return null;
  const [, prefix, num] = m;
  if (prefix === "sh") return num + ".SH";
  if (prefix === "sz") return num + ".SZ";
  if (prefix === "hk") return num + ".HK";
  return null;
}

/** 动态加载 script（JSONP），带超时与清理 */
function loadScript(src: string, timeoutMs = 6000): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    let settled = false;
    const cleanup = () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    s.src = src;
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
 * 拉取一批代码的实时行情（分批请求，避免 URL 超长）
 * @returns { code -> Quote }
 */
export async function fetchQuotes(codes: string[]): Promise<Map<string, Quote>> {
  const map = new Map<string, Quote>();
  const BATCH = 50; // 腾讯接口单次 URL 建议不超过 ~2KB，每批 50 个代码安全
  for (let i = 0; i < codes.length; i += BATCH) {
    const batch = codes.slice(i, i + BATCH);
    const list = batch.map(tencentCode);
    const url = `https://qt.gtimg.cn/q=${list.join(",")}&_=${Date.now()}`;
    await loadScript(url);

    const w = window as unknown as Record<string, unknown>;
    for (const key of Object.keys(w)) {
      if (!/^v_(sh|sz|hk)\d+$/.test(key)) continue;
      const raw = w[key];
      if (typeof raw !== "string") continue;
      const parts = raw.split("~");
      if (parts.length < 5) continue;
      const price = parseFloat(parts[3]);
      const prevClose = parseFloat(parts[4]);
      const change = parseFloat(parts[31]) || price - prevClose;
      const changePct = parseFloat(parts[32]) || (prevClose > 0 ? (price - prevClose) / prevClose : 0);
      const qCode = key.replace(/^v_/, "");
      const code = ourCode(qCode);
      if (code && price > 0) {
        map.set(code, { price, prevClose, change, changePct });
      }
      // 清理全局变量，避免累积
      try {
        delete w[key];
      } catch {
        /* ignore */
      }
    }
  }
  return map;
}

/**
 * 实时 HKD/CNY 汇率：通过 JSONP 加载新浪外汇接口，失败返回 null（调用方兜底 0.92）
 * fx_susdcny / fx_susdhkd 返回形如 var hq_str_fx_susdcny="时间,现价,..."
 */
export async function fetchHkdCny(): Promise<number | null> {
  const src = `https://hq.sinajs.cn/list=fx_susdcny,fx_susdhkd&_=${Date.now()}`;
  try {
    await loadScript(src, 4000);
    const w = window as unknown as Record<string, unknown>;
    const usdCnyRaw = w.hq_str_fx_susdcny;
    const usdHkdRaw = w.hq_str_fx_susdhkd;
    try {
      delete w.hq_str_fx_susdcny;
      delete w.hq_str_fx_susdhkd;
    } catch {
      /* ignore */
    }
    if (typeof usdCnyRaw !== "string" || typeof usdHkdRaw !== "string") return null;
    const usdCny = parseFloat(usdCnyRaw.split(",")[1]);
    const usdHkd = parseFloat(usdHkdRaw.split(",")[1]);
    if (usdCny > 0 && usdHkd > 0) return usdCny / usdHkd;
    return null;
  } catch {
    return null;
  }
}
