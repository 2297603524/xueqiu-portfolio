interface FooterSummaryProps {
  auditedBy?: string;
  estimated?: boolean;
  live?: boolean;
  hkdCny: number;
}

export function FooterSummary({ auditedBy, estimated, live, hkdCny }: FooterSummaryProps) {
  return (
    <section className="mx-auto mt-4 max-w-6xl px-4 pb-6 fade-in-up">
      {/* 数据说明条（紧凑单行） */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-rose-200/80 bg-white px-3 py-2 text-[11px] text-rose-500 shadow-sm">
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "bg-emerald-500 live-dot" : "bg-slate-300"
            }`}
          />
          {live ? "行情实时刷新中（3 秒/次）" : "当前为静态快照数据"}
        </span>
        <span>·</span>
        <span>HKD/CNY {hkdCny.toFixed(4)}</span>
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

      <p className="mt-3 text-center text-xs text-rose-400">
        数据来源：雪球 @超级鹿鼎公 · 仅供学习参考，不构成投资建议
      </p>
    </section>
  );
}
