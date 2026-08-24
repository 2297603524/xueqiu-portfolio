// 实时行情工具：通过 JSONP（动态 <script>）方式拉取腾讯行情，绕过浏览器跨域限制
// 腾讯接口返回形如 v_sh600900="1~长江电力~600900~28.15~..." 的赋值语句，加载后成为全局变量

/** 代码转换：600900.SH -> sh600900；01898.HK -> hk01898 */
export function tencentCode(code: string): string {
  if (code.endsWith(".SH")) return "sh" + code.slice(0, 6);
  if (code.endsWith(".SZ")) return "sz" + code.slice(0, 6);
  if (code.endsWith(".HK")) return "hk" + code.slice(0, 5);
  return code;
}

/** 动态加载 script（JSONP），带 3s 超时与清理 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    const cleanup = () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    s.src = src;
    s.onload = () => {
      cleanup();
      resolve();
    };
    s.onerror = () => {
      cleanup();
      reject(new Error("script load failed: " + src.slice(0, 80)));
    };
    document.head.appendChild(s);
    setTimeout(() => {
      cleanup();
      reject(new Error("script timeout: " + src.slice(0, 80)));
    }, 3000);
  });
}

/**
 * 拉取一批代码的实时行情
 * @returns { code -> 现价(原币种) }
 */
export async function fetchQuotes(codes: string[]): Promise<Map<string, number>> {
  const list = codes.map(tencentCode);
  const url = `https://qt.gtimg.cn/q=${list.join(",")}&_=${Date.now()}`;
  await loadScript(url);
  const map = new Map<string, number>();
  for (const key of Object.keys(window as unknown as Record<string, unknown>)) {
    if (!/^v_(sh|sz|hk)\d+$/.test(key)) continue;
    const raw = (window as unknown as Record<string, string>)[key];
    if (typeof raw !== "string") continue;
    const parts = raw.split("~");
    if (parts.length < 4) continue;
    const price = parseFloat(parts[3]);
    const qCode = key.replace(/^v_/, "");
    const code = ourCode(qCode);
    if (code && price > 0) map.set(code, price);
    // 清理全局变量，避免累积
    try {
      delete (window as unknown as Record<string, unknown>)[key];
    } catch {
      /* ignore */
    }
  }
  return map;
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
