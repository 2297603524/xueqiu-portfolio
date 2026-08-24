import type { AShareHolding, HShareHolding, OpType } from "../types";
import {
  fmtInt,
  fmtPrice,
  fmtPercent,
  fmtMoney,
  fmtSignedPercent,
} from "../lib/format";

interface ASharesTableProps {
  holdings: AShareHolding[];
}

const OP_LABEL: Record<OpType, string> = {
  open: "新开仓",
  close: "清仓",
  add: "加仓",
  reduce: "减仓",
  hold: "不变",
  closed: "已清仓",
};

const OP_STYLE: Record<OpType, string> = {
  open: "bg-accent-open/10 text-accent-open",
  close: "bg-accent-close/10 text-accent-close",
  add: "bg-up/10 text-up",
  reduce: "bg-down/10 text-down",
  hold: "bg-ink-100 text-ink-500",
  closed: "bg-ink-100 text-ink-500 line-through",
};

export function ASharesTable({ holdings }: ASharesTableProps) {
  return (
    <section className="mx-auto mt-8 max-w-6xl px-4">
      <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-up/10 px-1.5 py-0.5 text-xs font-semibold text-up">
              A 股
            </span>
            <h2 className="text-base font-medium text-ink-900">A 股持仓明细</h2>
          </div>
          <div className="text-xs text-ink-500 tabular-nums">
            {holdings.length} 只标的
          </div>
        </div>

        {/* 表格 - 桌面端 */}
        <div className="hidden md:block">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-ink-50/60 text-xs uppercase text-ink-500">
              <tr>
                <Th>代码</Th>
                <Th>名称</Th>
                <Th className="text-right">持仓股数</Th>
                <Th className="text-right">变动</Th>
                <Th>操作</Th>
                <Th className="text-right">成本价</Th>
                <Th className="text-right">现价</Th>
                <Th className="text-right">市值（元）</Th>
                <Th className="text-right">仓位</Th>
                <Th className="text-right">盈亏</Th>
              </tr>
            </thead>
            <tbody className="table-zebra">
              {holdings.map((h) => {
                const deltaPositive = h.delta > 0;
                return (
                  <tr key={h.code} className="border-t border-ink-100">
                    <Td>
                      <span className="text-ink-500">{h.code}</span>
                    </Td>
                    <Td>
                      <span className="font-medium text-ink-900">{h.name}</span>
                    </Td>
                    <Td className="text-right">
                      {h.shares > 0 ? fmtInt(h.shares) : "—"}
                    </Td>
                    <Td
                      className={`text-right ${
                        deltaPositive ? "text-up" : "text-down"
                      }`}
                    >
                      {h.delta > 0
                        ? `+${fmtInt(h.delta)}`
                        : h.delta < 0
                        ? fmtInt(h.delta)
                        : "—"}
                    </Td>
                    <Td>
                      <span
                        className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${
                          OP_STYLE[h.op]
                        }`}
                      >
                        {OP_LABEL[h.op]}
                      </span>
                    </Td>
                    <Td className="text-right">{fmtPrice(h.costPrice)}</Td>
                    <Td className="text-right">{fmtPrice(h.currentPrice)}</Td>
                    <Td className="text-right">{fmtMoney(h.marketValue)}</Td>
                    <Td className="text-right text-ink-700">
                      {h.weight === 0 ? "—" : fmtPercent(h.weight, 2)}
                    </Td>
                    <Td
                      className={`text-right font-medium ${
                        (h.profitRatio ?? 0) > 0
                          ? "text-up"
                          : (h.profitRatio ?? 0) < 0
                          ? "text-down"
                          : "text-ink-500"
                      }`}
                    >
                      {h.profitRatio === 0 && h.shares === 0 ? (
                        <div>
                          <div>{fmtSignedPercent(h.profitRatio)}</div>
                          <div className="text-xs text-ink-500">
                            {fmtMoney(h.profitAmount)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>{fmtSignedPercent(h.profitRatio)}</div>
                          <div className="text-xs text-ink-500">
                            {fmtMoney(h.profitAmount)}
                          </div>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 移动端卡片视图 */}
        <div className="md:hidden divide-y divide-ink-100">
          {holdings.map((h) => (
            <div key={h.code} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink-900">{h.name}</div>
                  <div className="text-xs text-ink-500 tabular-nums">
                    {h.code}
                  </div>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${OP_STYLE[h.op]}`}
                >
                  {OP_LABEL[h.op]}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <Field
                  label="持仓"
                  value={h.shares > 0 ? fmtInt(h.shares) : "—"}
                />
                <Field
                  label="变动"
                  value={fmtInt(h.delta)}
                  valueClass={
                    h.delta > 0 ? "text-up" : h.delta < 0 ? "text-down" : ""
                  }
                />
                <Field
                  label="盈亏%"
                  value={fmtSignedPercent(h.profitRatio)}
                  valueClass={
                    (h.profitRatio ?? 0) > 0
                      ? "text-up"
                      : (h.profitRatio ?? 0) < 0
                      ? "text-down"
                      : ""
                  }
                />
                <Field label="成本" value={fmtPrice(h.costPrice)} />
                <Field label="现价" value={fmtPrice(h.currentPrice)} />
                <Field label="市值" value={fmtMoney(h.marketValue)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- 小组件 ----------

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2.5 font-medium text-left tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>
  );
}

function Field({
  label,
  value,
  valueClass = "",
  suffix,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="text-ink-500">
        {label}
        {suffix && <span className="ml-1 text-[10px]">({suffix})</span>}
      </div>
      <div className={`font-mono tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}

// ============= H 股 =============

interface HSharesTableProps {
  holdings: HShareHolding[];
}

export function HSharesTable({ holdings }: HSharesTableProps) {
  return (
    <section className="mx-auto mt-6 max-w-6xl px-4">
      <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-down/10 px-1.5 py-0.5 text-xs font-semibold text-down">
              H 股
            </span>
            <h2 className="text-base font-medium text-ink-900">H 股持仓明细</h2>
          </div>
          <div className="text-xs text-ink-500 tabular-nums">
            {holdings.length} 只标的
          </div>
        </div>

        <div className="hidden md:block">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-ink-50/60 text-xs uppercase text-ink-500">
              <tr>
                <Th>代码</Th>
                <Th>名称</Th>
                <Th className="text-right">持仓股数</Th>
                <Th className="text-right">变动</Th>
                <Th>操作</Th>
                <Th className="text-right">成本价（HKD）</Th>
                <Th className="text-right">市值（CNY）</Th>
                <Th className="text-right">仓位</Th>
                <Th className="text-right">盈亏（CNY）</Th>
                <Th className="text-right">盈亏%</Th>
              </tr>
            </thead>
            <tbody className="table-zebra">
              {holdings.map((h) => {
                const deltaPositive = h.delta > 0;
                return (
                  <tr key={h.code} className="border-t border-ink-100">
                    <Td>
                      <span className="text-ink-500">{h.code}</span>
                    </Td>
                    <Td>
                      <span className="font-medium text-ink-900">{h.name}</span>
                    </Td>
                    <Td className="text-right">{fmtInt(h.shares)}</Td>
                    <Td
                      className={`text-right ${
                        deltaPositive ? "text-up" : "text-down"
                      }`}
                    >
                      {h.delta > 0
                        ? `+${fmtInt(h.delta)}`
                        : h.delta < 0
                        ? fmtInt(h.delta)
                        : "—"}
                    </Td>
                    <Td>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs ${
                          OP_STYLE[h.op]
                        }`}
                      >
                        {OP_LABEL[h.op]}
                      </span>
                    </Td>
                    <Td className="text-right">{fmtPrice(h.costPriceHKD)}</Td>
                    <Td className="text-right">{fmtMoney(h.marketValueCNY)}</Td>
                    <Td className="text-right text-ink-700">
                      {fmtPercent(h.weight, 2)}
                    </Td>
                    <Td
                      className={`text-right ${
                        h.profitAmountCNY > 0
                          ? "text-up"
                          : h.profitAmountCNY < 0
                          ? "text-down"
                          : "text-ink-500"
                      }`}
                    >
                      {fmtMoney(h.profitAmountCNY)}
                    </Td>
                    <Td
                      className={`text-right font-medium ${
                        (h.profitRatio ?? 0) > 0
                          ? "text-up"
                          : (h.profitRatio ?? 0) < 0
                          ? "text-down"
                          : "text-ink-500"
                      }`}
                    >
                      {h.profitRatio === null
                        ? "—"
                        : fmtSignedPercent(h.profitRatio)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-ink-100">
          {holdings.map((h) => (
            <div key={h.code} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-ink-900">{h.name}</div>
                  <div className="text-xs text-ink-500 tabular-nums">
                    {h.code}
                  </div>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs ${OP_STYLE[h.op]}`}
                >
                  {OP_LABEL[h.op]}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <Field
                  label="持仓"
                  value={fmtInt(h.shares)}
                />
                <Field
                  label="变动"
                  value={fmtInt(h.delta)}
                  valueClass={
                    h.delta > 0 ? "text-up" : h.delta < 0 ? "text-down" : ""
                  }
                />
                <Field
                  label="盈亏%"
                  value={
                    h.profitRatio === null
                      ? "—"
                      : fmtSignedPercent(h.profitRatio)
                  }
                  valueClass={
                    (h.profitRatio ?? 0) > 0
                      ? "text-up"
                      : (h.profitRatio ?? 0) < 0
                      ? "text-down"
                      : ""
                  }
                />
                <Field label="成本" value={fmtPrice(h.costPriceHKD)} suffix="HKD" />
                <Field label="市值" value={fmtMoney(h.marketValueCNY)} suffix="CNY" />
                <Field
                  label="盈亏"
                  value={fmtMoney(h.profitAmountCNY)}
                  suffix="CNY"
                  valueClass={
                    h.profitAmountCNY > 0
                      ? "text-up"
                      : h.profitAmountCNY < 0
                      ? "text-down"
                      : ""
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
