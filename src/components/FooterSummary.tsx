import { fmtMoney, fmtPercent } from "../lib/format";

interface FooterSummaryProps {
  aShareValue: number;
  hShareValueCNY: number;
  totalAssets: number;
  availableCash: number;
  cashRatio: number;
  auditedBy?: string;
}

export function FooterSummary({
  aShareValue,
  hShareValueCNY,
  totalAssets,
  availableCash,
  cashRatio,
  auditedBy,
}: FooterSummaryProps) {
  return (
    <section className="mx-auto mt-6 max-w-6xl px-4 pb-12">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="A 股持仓" value={fmtMoney(aShareValue)} subtle="CNY" />
        <StatCard label="H 股持仓" value={fmtMoney(hShareValueCNY)} subtle="CNY" />
        <StatCard
          label="A 股账户总资产"
          value={fmtMoney(totalAssets)}
          subtle="CNY"
          highlight
        />
        <StatCard
          label="资金余额"
          value={fmtMoney(availableCash)}
          subtle="CNY"
        />
        <StatCard
          label="现金仓位"
          value={fmtPercent(cashRatio, 2)}
          subtle="占账户总资产"
          valueClass={
            cashRatio < 0.05 ? "text-down" : cashRatio < 0.2 ? "text-ink-900" : "text-up"
          }
        />
      </div>

      {/* 数据质量卡 */}
      {auditedBy && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 flex-shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{auditedBy}</span>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-ink-500">
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
  valueClass = "text-ink-900",
}: {
  label: string;
  value: string;
  subtle?: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        highlight ? "border-up/40 ring-1 ring-up/20" : "border-ink-200"
      }`}
    >
      <div className="text-xs text-ink-500">{label}</div>
      <div
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${valueClass}`}
      >
        {value}
      </div>
      {subtle && <div className="mt-0.5 text-[11px] text-ink-500">{subtle}</div>}
    </div>
  );
}
