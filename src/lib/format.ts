// 数字与日期格式化工具

/** 把 -0 归零，避免出现 "-0" 这种显示 */
function normalizeZero(n: number): number {
  return n === 0 ? 0 : n;
}

function isNil(n: unknown): n is null | undefined {
  return n === null || n === undefined || (typeof n === "number" && Number.isNaN(n));
}

/** 千分位整数（含负号） */
export function fmtInt(n: number): string {
  if (isNil(n)) return "—";
  return normalizeZero(Math.round(n)).toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

/** 金额 - 默认 CNY */
export function fmtMoney(n: number): string {
  if (isNil(n)) return "—";
  return normalizeZero(Math.round(n)).toLocaleString("zh-CN", {
    maximumFractionDigits: 0,
  });
}

/** 带正负号的金额（用于变动列）：正数补 "+"，负数自带 "-" */
export function fmtSigned(n: number): string {
  if (isNil(n)) return "—";
  const v = normalizeZero(Math.round(n));
  return (v > 0 ? "+" : "") + v.toLocaleString("zh-CN");
}

/** 价格（2 位小数） */
export function fmtPrice(n: number): string {
  if (isNil(n)) return "—";
  return normalizeZero(n).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 百分比 - 入参为小数比例（0.0123 → 1.23%） */
export function fmtPercent(n: number | null, digits: number = 2): string {
  if (isNil(n)) return "—";
  return (
    normalizeZero(n * 100).toLocaleString("zh-CN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + "%"
  );
}

/** 带正负号的百分比：正数补 "+"，负数自带 "-" */
export function fmtSignedPercent(n: number | null, digits: number = 2): string {
  if (isNil(n)) return "—";
  const v = normalizeZero(n * 100);
  return (
    (v > 0 ? "+" : "") +
    v.toLocaleString("zh-CN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) +
    "%"
  );
}

/** 股票代码前缀对应的中文市场名 */
export function marketName(code: string): string {
  if (code.endsWith(".SH")) return "沪市";
  if (code.endsWith(".SZ")) return "深市";
  if (code.endsWith(".HK")) return "港股";
  return "";
}
