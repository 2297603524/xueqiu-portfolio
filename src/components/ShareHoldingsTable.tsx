import { useMemo, useState } from "react";
import type { AShareHolding, HShareHolding, OpType } from "../types";
import type { Quote } from "../lib/realtime";
import {
  fmtInt,
  fmtPrice,
  fmtPercent,
  fmtMoney,
  fmtSignedPercent,
} from "../lib/format";

// ---------- 通用小组件 ----------

type SortKey = "mv" | "weight" | "profit" | "price";
type SortDir = 1 | -1;

/** 可点击排序的表头（带方向箭头） */
function SortableTh({
  label,
  k,
  current,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  k: SortKey;
  current: SortKey | null;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = current === k;
  return (
    <th
      onClick={() => onSort(k)}
      className={`px-3 py-2 font-medium text-left tracking-wide whitespace-nowrap cursor-pointer select-none transition hover:text-rose-700 ${className}`}
      title="点击排序"
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <span
          className={`text-[9px] transition ${
            active ? "text-rose-600 opacity-100" : "opacity-30"
          }`}
        >
          {active ? (dir === -1 ? "▼" : "▲") : "▼"}
        </span>
      </span>
    </th>
  );
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
  open: "bg-blue-50 text-blue-600",
  close: "bg-violet-50 text-violet-600",
  add: "bg-rose-50 text-rose-600",
  reduce: "bg-emerald-50 text-emerald-600",
  hold: "bg-slate-100 text-slate-500",
  closed: "bg-slate-100 text-slate-400 line-through",
};

function MarketBadge({ code }: { code: string }) {
  let label = "";
  let cls = "";
  if (code.endsWith(".SH")) {
    label = "沪";
    cls = "bg-rose-50 text-rose-600";
  } else if (code.endsWith(".SZ")) {
    label = "深";
    cls = "bg-emerald-50 text-emerald-600";
  } else if (code.endsWith(".HK")) {
    label = "港";
    cls = "bg-sky-50 text-sky-600";
  }
  return (
    <span
      className={`mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

/**
 * 现价单元格：价格 + 当日涨跌%；实时刷新时价格变化会触发闪动动画（涨=红闪，跌=绿闪）
 * key={price} 让 React 在价格变化时重建元素，从而重播 CSS 动画
 */
function PriceCell({
  price,
  quote,
  live,
}: {
  price: number;
  quote?: Quote;
  live: boolean;
}) {
  if (!live || !quote || quote.price !== price) {
    return (
      <div>
        <div className="font-mono tabular-nums">{fmtPrice(price)}</div>
        {quote && quote.changePct !== 0 && (
          <div
            className={`text-[11px] tabular-nums ${
              quote.changePct > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {quote.changePct > 0 ? "+" : ""}
            {fmtPercent(Math.abs(quote.changePct), 2)}
          </div>
        )}
      </div>
    );
  }
  const up = quote.changePct > 0;
  return (
    <div>
      <span
        key={quote.price}
        className={`inline-block px-1 py-0.5 font-mono tabular-nums ${
          up ? "flash-up text-rose-600" : "flash-down text-emerald-600"
        }`}
      >
        {fmtPrice(quote.price)}
      </span>
      <div
        className={`text-[11px] tabular-nums ${
          up ? "text-rose-600" : "text-emerald-600"
        }`}
      >
        {up ? "+" : ""}
        {fmtPercent(Math.abs(quote.changePct), 2)}
      </div>
    </div>
  );
}

/** 仓位列：百分比数字 + 红色渐变进度条（0~100%） */
function WeightCell({ weight }: { weight: number }) {
  const pct = Math.max(0, Math.min(weight, 1)) * 100;
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-slate-600 tabular-nums">{fmtPercent(weight, 2)}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-rose-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProfitCell({
  ratio,
  amount,
  sharesZero,
  negativeCost,
}: {
  ratio: number | null;
  amount: number;
  sharesZero?: boolean;
  /** 成本为负（分红已回收本金），比例无法常规计算 */
  negativeCost?: boolean;
}) {  const cls =
    ratio === null
      ? "text-slate-400"
      : ratio > 0
      ? "text-rose-600"
      : ratio < 0
      ? "text-emerald-600"
      : "text-slate-500";
  return (
    <div>
      <div className={`font-medium tabular-nums ${cls}`}>
        {negativeCost ? (
          <span className="inline-block whitespace-nowrap rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
            成本已回收
          </span>
        ) : ratio === null ? (
          "—"
        ) : (
          fmtSignedPercent(ratio)
        )}
      </div>
      <div className={`text-[11px] tabular-nums ${cls} opacity-80`}>
        {sharesZero ? "—" : `${amount > 0 ? "+" : ""}${fmtMoney(amount)}`}
      </div>
    </div>
  );
}

function SectionTitle({
  badge,
  badgeCls,
  title,
  right,
}: {
  badge: string;
  badgeCls: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-rose-100 px-4 py-2.5 sm:px-5">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${badgeCls}`}
        >
          {badge}
        </span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {right && <div className="text-xs text-slate-400">{right}</div>}
    </div>
  );
}

// ---------- A 股表格 ----------

interface SharesTableProps {
  holdings: AShareHolding[];
  quotes: Map<string, Quote> | null;
  live: boolean;
}

export function ASharesTable({ holdings, quotes, live }: SharesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>("mv");
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  const totalMV = holdings.reduce((a, h) => a + h.marketValue, 0);
  const totalShares = holdings.reduce((a, h) => a + (h.shares > 0 ? h.shares : 0), 0);
  const totalProfit = holdings.reduce((a, h) => a + h.profitAmount, 0);

  const sorted = useMemo(() => {
    if (!sortKey) return holdings;
    const arr = [...holdings];
    arr.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case "mv": va = a.marketValue; vb = b.marketValue; break;
        case "weight": va = a.weight; vb = b.weight; break;
        case "profit": va = a.profitAmount; vb = b.profitAmount; break;
        case "price": va = a.currentPrice; vb = b.currentPrice; break;
        default: va = a.name; vb = b.name;
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
    });
    return arr;
  }, [holdings, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === -1 ? 1 : -1));
    else {
      setSortKey(k);
      setSortDir(-1);
    }
  };

  return (
    <section className="fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-sm shadow-rose-100/40">
        <SectionTitle
          badge="A 股"
          badgeCls="bg-rose-50 text-rose-600"
          title="A 股持仓明细"
          right={`${holdings.length} 只 · 市值 ¥${fmtInt(totalMV)}`}
        />

        {/* 桌面表格（表头吸顶 + 可排序） */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 z-10 bg-rose-50/95 text-xs uppercase tracking-wide text-rose-500 backdrop-blur">
              <tr>
                <Th>代码</Th>
                <Th>名称</Th>
                <Th className="text-right">持仓股数</Th>
                <Th className="text-right">变动</Th>
                <Th>操作</Th>
                <Th className="text-right">成本价</Th>
                <SortableTh label="现价" k="price" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                <SortableTh label="市值" k="mv" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                <SortableTh label="仓位" k="weight" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                <SortableTh label="盈亏" k="profit" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
              </tr>
            </thead>
            <tbody className="table-zebra">
              {sorted.map((h) => (
                <tr
                  key={h.code}
                  className="border-t border-rose-100 transition hover:bg-rose-50/60"
                >
                  <Td>
                    <span className="text-slate-500">{h.code}</span>
                  </Td>
                  <Td>
                    <MarketBadge code={h.code} />
                    <span className="font-medium text-slate-900">{h.name}</span>
                  </Td>
                  <Td className="text-right">
                    {h.shares > 0 ? fmtInt(h.shares) : "—"}
                  </Td>
                  <Td
                    className={`text-right ${
                      h.delta > 0
                        ? "text-rose-600"
                        : h.delta < 0
                        ? "text-emerald-600"
                        : "text-slate-400"
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
                      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${OP_STYLE[h.op]}`}
                    >
                      {OP_LABEL[h.op]}
                    </span>
                  </Td>
                  <Td className="text-right">{fmtPrice(h.costPrice)}</Td>
                  <Td className="text-right">
                    <PriceCell
                      price={h.currentPrice}
                      quote={quotes?.get(h.code)}
                      live={live}
                    />
                  </Td>
                  <Td className="text-right">{fmtMoney(h.marketValue)}</Td>
                  <Td className="text-right">
                    {h.weight === 0 ? "—" : <WeightCell weight={h.weight} />}
                  </Td>
                  <Td className="text-right">
                    <ProfitCell
                      ratio={h.profitRatio}
                      amount={h.profitAmount}
                      sharesZero={h.shares === 0}
                      negativeCost={h.costPrice <= 0}
                    />
                  </Td>
                </tr>
              ))}
              {/* 合计行 */}
              <tr className="border-t-2 border-rose-200 bg-rose-50/80 font-semibold">
                <Td className="text-rose-600" >合计</Td>
                <Td>{""}</Td>
                <Td className="text-right text-slate-900">{fmtInt(totalShares)}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td className="text-right text-rose-700">{fmtMoney(totalMV)}</Td>
                <Td className="text-right">
                  <WeightCell weight={totalMV / (totalMV || 1)} />
                </Td>
                <Td className="text-right">
                  <span
                    className={`tabular-nums ${
                      totalProfit > 0
                        ? "text-rose-600"
                        : totalProfit < 0
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}
                  >
                    {totalProfit > 0 ? "+" : ""}
                    {fmtMoney(totalProfit)}
                  </span>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 移动端卡片 */}
        <div className="md:hidden divide-y divide-rose-100">
          {holdings.map((h) => {
            const q = quotes?.get(h.code);
            return (
              <div key={h.code} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <MarketBadge code={h.code} />
                    <span className="font-semibold text-slate-900">
                      {h.name}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {h.code}
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${OP_STYLE[h.op]}`}
                  >
                    {OP_LABEL[h.op]}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <Field label="持仓" value={h.shares > 0 ? fmtInt(h.shares) : "—"} />
                  <Field
                    label="变动"
                    value={
                      h.delta > 0
                        ? `+${fmtInt(h.delta)}`
                        : h.delta < 0
                        ? fmtInt(h.delta)
                        : "—"
                    }
                    valueClass={
                      h.delta > 0
                        ? "text-rose-600"
                        : h.delta < 0
                        ? "text-emerald-600"
                        : ""
                    }
                  />
                  <Field
                    label="现价"
                    value={
                      <PriceCell
                        price={h.currentPrice}
                        quote={q}
                        live={live}
                      />
                    }
                  />
                  <Field label="成本" value={fmtPrice(h.costPrice)} />
                  <Field
                    label="盈亏%"
                    value={fmtSignedPercent(h.profitRatio)}
                    valueClass={
                      (h.profitRatio ?? 0) > 0
                        ? "text-rose-600"
                        : (h.profitRatio ?? 0) < 0
                        ? "text-emerald-600"
                        : ""
                    }
                  />
                  <Field
                    label="市值"
                    value={fmtMoney(h.marketValue)}
                    valueClass="text-slate-900"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- H 股表格 ----------

interface HSharesTableProps {
  holdings: HShareHolding[];
  quotes: Map<string, Quote> | null;
  live: boolean;
  /** HKD/CNY 汇率（实时或兜底 0.92），用于从市值反推 HKD 现价 */
  hkdCny: number;
}

export function HSharesTable({ holdings, quotes, live, hkdCny }: HSharesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>("mv");
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  const totalMV = holdings.reduce((a, h) => a + h.marketValueCNY, 0);
  const totalShares = holdings.reduce((a, h) => a + h.shares, 0);
  const totalProfit = holdings.reduce((a, h) => a + h.profitAmountCNY, 0);

  const sorted = useMemo(() => {
    if (!sortKey) return holdings;
    const arr = [...holdings];
    arr.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case "mv": va = a.marketValueCNY; vb = b.marketValueCNY; break;
        case "weight": va = a.weight; vb = b.weight; break;
        case "profit": va = a.profitAmountCNY; vb = b.profitAmountCNY; break;
        case "price": {
          va =
            a.shares > 0 ? Math.round((a.marketValueCNY / a.shares / hkdCny) * 100) / 100 : 0;
          vb =
            b.shares > 0 ? Math.round((b.marketValueCNY / b.shares / hkdCny) * 100) / 100 : 0;
          break;
        }
        default: va = a.name; vb = b.name;
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
    });
    return arr;
  }, [holdings, sortKey, sortDir, hkdCny]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === -1 ? 1 : -1));
    else {
      setSortKey(k);
      setSortDir(-1);
    }
  };

  return (
    <section className="fade-in-up">
      <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-sm shadow-rose-100/40">
        <SectionTitle
          badge="H 股"
          badgeCls="bg-sky-50 text-sky-600"
          title="H 股持仓明细"
          right={`${holdings.length} 只 · 市值 ¥${fmtInt(totalMV)}`}
        />

        {/* 桌面表格（表头吸顶 + 可排序） */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 z-10 bg-rose-50/95 text-xs uppercase tracking-wide text-rose-500 backdrop-blur">
              <tr>
                <Th>代码</Th>
                <Th>名称</Th>
                <Th className="text-right">持仓股数</Th>
                <Th className="text-right">变动</Th>
                <Th>操作</Th>
                <Th className="text-right">成本价（HKD）</Th>
                <SortableTh label="现价" k="price" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                <SortableTh label="市值(CNY)" k="mv" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                <SortableTh label="仓位" k="weight" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
                <SortableTh label="盈亏(CNY)" k="profit" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
              </tr>
            </thead>
            <tbody className="table-zebra">
              {sorted.map((h) => {
                // 无实时价时从市值反推 HKD 现价（保留 2 位）
                const hkdPrice =
                  h.shares > 0
                    ? Math.round((h.marketValueCNY / h.shares / hkdCny) * 100) /
                      100
                    : 0;
                return (
                  <tr
                    key={h.code}
                    className="border-t border-rose-100 transition hover:bg-rose-50/60"
                  >
                    <Td>
                      <span className="text-slate-500">{h.code}</span>
                    </Td>
                    <Td>
                      <MarketBadge code={h.code} />
                      <span className="font-medium text-slate-900">{h.name}</span>
                    </Td>
                    <Td className="text-right">{fmtInt(h.shares)}</Td>
                    <Td
                      className={`text-right ${
                        h.delta > 0
                          ? "text-rose-600"
                          : h.delta < 0
                          ? "text-emerald-600"
                          : "text-slate-400"
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
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${OP_STYLE[h.op]}`}
                      >
                        {OP_LABEL[h.op]}
                      </span>
                    </Td>
                    <Td className="text-right">{fmtPrice(h.costPriceHKD)}</Td>
                    <Td className="text-right">
                      <PriceCell
                        price={hkdPrice}
                        quote={quotes?.get(h.code)}
                        live={live}
                      />
                    </Td>
                    <Td className="text-right">{fmtMoney(h.marketValueCNY)}</Td>
                  <Td className="text-right">
                    <WeightCell weight={h.weight} />
                  </Td>
                  <Td className="text-right">
                    <ProfitCell
                      ratio={h.profitRatio}
                      amount={h.profitAmountCNY}
                      negativeCost={h.costPriceHKD <= 0}
                    />
                  </Td>
                  </tr>
                );
              })}
              {/* 合计行 */}
              <tr className="border-t-2 border-rose-200 bg-rose-50/80 font-semibold">
                <Td className="text-rose-600">合计</Td>
                <Td>{""}</Td>
                <Td className="text-right text-slate-900">{fmtInt(totalShares)}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td className="text-right text-rose-700">{fmtMoney(totalMV)}</Td>
                <Td className="text-right">
                  <WeightCell weight={totalMV / (totalMV || 1)} />
                </Td>
                <Td className="text-right">
                  <span
                    className={`tabular-nums ${
                      totalProfit > 0
                        ? "text-rose-600"
                        : totalProfit < 0
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}
                  >
                    {totalProfit > 0 ? "+" : ""}
                    {fmtMoney(totalProfit)}
                  </span>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 移动端卡片 */}
        <div className="md:hidden divide-y divide-rose-100">
          {holdings.map((h) => {
            const q = quotes?.get(h.code);
            const hkdPrice =
              h.shares > 0
                ? Math.round((h.marketValueCNY / h.shares / hkdCny) * 100) / 100
                : 0;
            return (
              <div key={h.code} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <MarketBadge code={h.code} />
                    <span className="font-semibold text-slate-900">
                      {h.name}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {h.code}
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${OP_STYLE[h.op]}`}
                  >
                    {OP_LABEL[h.op]}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <Field label="持仓" value={fmtInt(h.shares)} />
                  <Field
                    label="变动"
                    value={
                      h.delta > 0
                        ? `+${fmtInt(h.delta)}`
                        : h.delta < 0
                        ? fmtInt(h.delta)
                        : "—"
                    }
                    valueClass={
                      h.delta > 0
                        ? "text-rose-600"
                        : h.delta < 0
                        ? "text-emerald-600"
                        : ""
                    }
                  />
                  <Field
                    label="现价"
                    value={
                      <PriceCell price={hkdPrice} quote={q} live={live} />
                    }
                  />
                  <Field
                    label="成本"
                    value={fmtPrice(h.costPriceHKD)}
                    suffix="HKD"
                  />
                  <Field
                    label="盈亏%"
                    value={
                      h.costPriceHKD <= 0
                        ? "成本已回收"
                        : h.profitRatio === null
                        ? "—"
                        : fmtSignedPercent(h.profitRatio)
                    }
                    valueClass={
                      h.costPriceHKD <= 0
                        ? "text-emerald-600"
                        : (h.profitRatio ?? 0) > 0
                        ? "text-rose-600"
                        : (h.profitRatio ?? 0) < 0
                        ? "text-emerald-600"
                        : ""
                    }
                  />
                  <Field
                    label="市值"
                    value={fmtMoney(h.marketValueCNY)}
                    suffix="CNY"
                    valueClass="text-slate-900"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- 基础表格元素 ----------

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 font-medium text-left tracking-wide whitespace-nowrap ${className}`}
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
    <td className={`px-3 py-1.5 align-middle whitespace-nowrap ${className}`}>
      {children}
    </td>
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
      <div className="text-slate-400">
        {label}
        {suffix && <span className="ml-1 text-[10px]">({suffix})</span>}
      </div>
      <div className={`font-mono tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}
