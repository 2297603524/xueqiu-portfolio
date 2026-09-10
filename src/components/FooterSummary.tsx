interface FooterSummaryProps {
  auditedBy?: string;
  estimated?: boolean;
  live?: boolean;
  /** 当前使用的 HKD/CNY 汇率 */
  hkdCny: number;
  /** 汇率是否来自实时接口；false 表示降级用了兜底值 */
  hkdCnyLive?: boolean;
  /** 当前展示的月份文案，便于确认数据口径 */
  monthLabel?: string;
}

export function FooterSummary({
  auditedBy,
  estimated,
  live,
  hkdCny,
  hkdCnyLive = false,
  monthLabel,
}: FooterSummaryProps) {
  return (
    <section className="mx-auto mt-4 max-w-6xl px-4 pb-6 fade-in-up">
      {/* 数据说明条（紧凑单行） */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-rose-200/80 bg-white px-3 py-2 text-[11px] text-rose-500 shadow-sm">
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "live-dot bg-emerald-500" : "bg-slate-300"
            }`}
          />
          {live ? "行情实时刷新中（3 秒/次）" : "当前为静态快照数据"}
        </span>
        {monthLabel && (
          <>
            <span>·</span>
            <span>口径：{monthLabel} 月报</span>
          </>
        )}
        <span>·</span>
        <span title={hkdCnyLive ? "来自实时汇率接口" : "实时汇率接口不可用，已使用兜底值"}>
          HKD/CNY {hkdCny.toFixed(4)}
          {!hkdCnyLive && <span className="text-amber-600">（兜底值）</span>}
        </span>
        <span>·</span>
        <span>红涨绿跌（中国股市惯例）</span>
        {estimated && (
          <>
            <span>·</span>
            <span className="font-medium text-amber-600">本月份为估算数据，待真实月报覆盖</span>
          </>
        )}
        {auditedBy && (
          <>
            <span>·</span>
            <span className="text-emerald-600">✔ {auditedBy}</span>
          </>
        )}
      </div>
    </section>
  );
}
