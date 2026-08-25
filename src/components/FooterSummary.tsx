import { fmtMoney, fmtPercent } from "../lib/format";

interface FooterSummaryProps {
  aShareValue: number;
  hShareValueCNY: number;
  totalAssets: number;
  availableCash: number;
  cashRatio: number;
  auditedBy?: string;
  estimated?: boolean;
  live?: boolean;
  hkdCny: number;
  dailyPL: number | null;
}

export function FooterSummary({
  aShareValue,
  hShareValueCNY,
  totalAssets,
  availableCash,
  cashRatio,
  auditedBy,
  estimated,
  live,
  hkdCny,
  dailyPL,
}: FooterSummaryProps) {
  return (
    <section className="mx-auto mt-6 max-w-6xl px-4 pb-12 fade-in-up">
      {/* 统计卡 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="A 股持仓"
          value={fmtMoney(aShareValue)}
          subtle="CNY"
          accent="from-rose-500 to-orange-400"
        />
        <StatCard
          label="H 股持仓"
          value={fmtMoney(hShareValueCNY)}
          subtle={`CNY · 汇率 ${hkdCny.toFixed(4)}`}
          accent="from-sky-500 to-cyan-400"
        />
        <StatCard
          label="账户总资产"
          value={fmtMoney(totalAssets)}
          subtle="CNY"
          accent="from-indigo-500 to-blue-400"
          highlight
        />
        <StatCard
          label="资金余额"
          value={fmtMoney(availableCash)}
          subtle="CNY"
          accent="from-slate-500 to-slate-400"
        />
        <StatCard
          label="现金仓位"
          value={fmtPercent(cashRatio, 2)}
          subtle="占账户总资产"
          accent="from-emerald-500 to-green-400"
          valueClass={
            cashRatio < 0.05 ? "text-emerald-600" : cashRatio < 0.2 ? "text-slate-900" : "text-rose-600"
          }
        />
        <StatCard
          label="当日盈亏"
          value={
            dailyPL === null
              ? "—"
              : dailyPL > 0
              ? `+${fmtMoney(dailyPL)}`
              : fmtMoney(dailyPL)
          }
          subtle={dailyPL === null ? "需开启实时" : "相对昨收 · 实时"}
          accent="from-amber-500 to-yellow-400"
          valueClass={
            dailyPL === null
              ? "text-slate-500"
              : dailyPL > 0
              ? "text-rose-600"
              : dailyPL < 0
              ? "text-emerald-600"
              : "text-slate-900"
          }
          liveDot={dailyPL !== null && live}
        />
      </div>

      {/* 数据说明 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-[11px] text-slate-500 shadow-sm">
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              live ? "bg-emerald-500 live-dot" : "bg-slate-300"
            }`}
          />
          {live ? "行情实时刷新中（3 秒/次）" : "当前为静态快照数据"}
        </span>
        <span>·</span>
        <span>涨跌颜色遵循中国股市惯例（红涨绿跌）</span>
        {estimated && (
          <>
            <span>·</span>
            <span className="font-medium text-amber-600">
              本月份为估算数据，待真实月报覆盖
            </span>
          </>
        )}
        {auditedBy && (
          <>
            <span>·</span>
            <span className="text-emerald-600">✔ {auditedBy}</span>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        数据来源：雪球 @超级鹿鼎公 · 仅供学习参考，不构成投资建议
      </p>
    </section>
  );
}

function StatCard({
  label,
  value,
  subtle,
  highlight,
  valueClass = "text-slate-900",
  accent,
  liveDot,
}: {
  label: string;
  value: string;
  subtle?: string;
  highlight?: boolean;
  valueClass?: string;
  accent: string;
  liveDot?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        highlight ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200/80"
      }`}
    >
      {/* 顶部渐变细条 */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span>{label}</span>
        {liveDot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot" />}
      </div>
      <div
        className={`mt-1.5 font-mono text-lg font-bold tabular-nums ${valueClass}`}
      >
        {value}
      </div>
      {subtle && <div className="mt-0.5 text-[11px] text-slate-400">{subtle}</div>}
    </div>
  );
}
