// 数字与日期格式化工具

/** 千分位整数（含负号） */
export function fmtInt(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

/** 金额 - 默认 CNY */
export function fmtMoney(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

/** 带正负号的金额（用于变动列） */
export function fmtSigned(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return sign + Math.round(n).toLocaleString("zh-CN");
}

/** 价格（2 位小数） */
export function fmtPrice(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 百分比 - 默认 *100 转 bps 显示 */
export function fmtPercent(n: number | null, digits: number = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = n * 100;
  return v.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + "%";
}

/** 带正负号的百分比 */
export function fmtSignedPercent(n: number | null, digits: number = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = n * 100;
  const sign = v > 0 ? "+" : v < 0 ? "" : "";
  return sign + v.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + "%";
}

/** 股票代码前缀对应的中文市场名 */
export function marketName(code: string): string {
  if (code.endsWith(".SH")) return "沪市";
  if (code.endsWith(".SZ")) return "深市";
  if (code.endsWith(".HK")) return "港股";
  return "";
}
