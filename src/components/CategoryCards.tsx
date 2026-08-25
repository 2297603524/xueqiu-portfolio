import type { Category } from "../types";
import { fmtInt } from "../lib/format";

interface CategoryCardsProps {
  categories: Category[];
}

// 4 个分类的视觉风格 - 雪球风格映射（中国惯例：涨=红，跌=绿）
const STYLES: Record<
  Category["type"],
  {
    tag: string;
    iconBg: string;
    iconColor: string;
    bar: string;
    countColor: string;
  }
> = {
  open: {
    tag: "新开仓",
    iconBg: "from-blue-500 to-sky-400",
    iconColor: "text-blue-600",
    bar: "bg-blue-500",
    countColor: "text-blue-600",
  },
  close: {
    tag: "清仓",
    iconBg: "from-violet-500 to-purple-400",
    iconColor: "text-violet-600",
    bar: "bg-violet-500",
    countColor: "text-violet-600",
  },
  add: {
    tag: "加仓",
    iconBg: "from-rose-500 to-red-400",
    iconColor: "text-rose-600",
    bar: "bg-rose-500",
    countColor: "text-rose-600",
  },
  reduce: {
    tag: "减仓",
    iconBg: "from-emerald-500 to-green-400",
    iconColor: "text-emerald-600",
    bar: "bg-emerald-500",
    countColor: "text-emerald-600",
  },
};

// 分类图标（简化线条图标）
function CategoryIcon({ type }: { type: Category["type"] }) {
  const paths: Record<Category["type"], React.ReactNode> = {
    open: (
      <>
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </>
    ),
    close: (
      <>
        <path d="M5 12h14" strokeLinecap="round" />
      </>
    ),
    add: (
      <>
        <path d="M4 15a8 8 0 1116 0" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 11v4M10 13h4" strokeLinecap="round" />
      </>
    ),
    reduce: (
      <>
        <path d="M4 15a8 8 0 1116 0" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 13h4" strokeLinecap="round" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      {paths[type]}
    </svg>
  );
}

export function CategoryCards({ categories }: CategoryCardsProps) {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((c, i) => {
        const style = STYLES[c.type];
        const sortedStocks = [...c.stocks].sort(
          (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
        );
        const largestName = sortedStocks[0]?.name;
        const empty = c.stocks.length === 0;

        return (
          <div
            key={c.type}
            className="group relative overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-sm shadow-rose-100/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-200/50"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* 顶部渐变条 */}
            <div className={`h-1 w-full bg-gradient-to-r ${style.iconBg}`} />

            <div className="p-4">
              {/* 标签 + 数量 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${style.iconBg}`}
                  >
                    <CategoryIcon type={c.type} />
                  </span>
                  <span className={`text-sm font-semibold ${style.countColor}`}>
                    {style.tag}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{c.count} 只</span>
              </div>

              {/* 股票列表 / 空状态 */}
              {empty ? (
                <div className="mt-4 rounded-lg border border-dashed border-rose-200 py-5 text-center text-xs text-rose-300">
                  本月无{style.tag}记录
                </div>
              ) : (
                <ul className="mt-3.5 space-y-2.5">
                  {sortedStocks.map((s) => {
                    const isLargest = s.name === largestName;
                    return (
                      <li
                        key={s.code}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="truncate font-medium text-slate-900">
                              {s.name}
                            </span>
                            {isLargest && (
                              <span className="shrink-0 rounded bg-slate-100 px-1 text-[10px] text-slate-500">
                                最大
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 tabular-nums">
                            {s.code}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 font-mono font-medium tabular-nums ${
                            s.delta > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {s.delta > 0
                            ? `+${fmtInt(s.delta)}`
                            : fmtInt(s.delta)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
