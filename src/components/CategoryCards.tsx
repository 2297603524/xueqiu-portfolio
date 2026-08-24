import type { Category } from "../types";
import { fmtInt } from "../lib/format";

interface CategoryCardsProps {
  categories: Category[];
}

// 4 个分类的视觉风格 - 雪球风格映射
const STYLES: Record<
  Category["type"],
  { tag: string; chipText: string; chipBg: string; bar: string; hover: string }
> = {
  open: {
    tag: "新开仓",
    chipText: "text-accent-open",
    chipBg: "bg-accent-open/10",
    bar: "bg-accent-open",
    hover: "group-hover:text-accent-open",
  },
  close: {
    tag: "清仓",
    chipText: "text-accent-close",
    chipBg: "bg-accent-close/10",
    bar: "bg-accent-close",
    hover: "group-hover:text-accent-close",
  },
  add: {
    tag: "加仓",
    chipText: "text-up",
    chipBg: "bg-up/10",
    bar: "bg-up",
    hover: "group-hover:text-up",
  },
  reduce: {
    tag: "减仓",
    chipText: "text-down",
    chipBg: "bg-down/10",
    bar: "bg-down",
    hover: "group-hover:text-down",
  },
};

export function CategoryCards({ categories }: CategoryCardsProps) {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((c) => {
        const style = STYLES[c.type];
        // 找出最大绝对值变动的股票，标记最大
        const sortedStocks = [...c.stocks].sort(
          (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
        );
        const largestName = sortedStocks[0]?.name;

        return (
          <div
            key={c.type}
            className="group relative overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {/* 顶部色条 */}
            <div className={`h-1 w-full ${style.bar}`} />

            <div className="p-4">
              {/* 标签 + 数量 */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs ${style.bar}`}
                  >
                    {c.count}
                  </span>
                  <span className={`text-base font-semibold ${style.chipText}`}>
                    {style.tag}
                  </span>
                </div>
                <span className="text-xs text-ink-500">
                  {c.count} 只
                </span>
              </div>

              {/* 股票列表 */}
              <ul className="mt-4 space-y-2.5">
                {c.stocks.map((s) => {
                  const isLargest = s.name === largestName;
                  return (
                    <li
                      key={s.code}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="truncate font-medium text-ink-900">
                            {s.name}
                          </span>
                          {isLargest && (
                            <span className="shrink-0 text-[10px] text-ink-500">
                              最大
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-500 tabular-nums">
                          {s.code}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 font-mono tabular-nums ${
                          s.delta > 0 ? "text-up" : "text-down"
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
            </div>
          </div>
        );
      })}
    </section>
  );
}
