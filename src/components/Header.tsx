import type { PortfolioData } from "../types";
import { fmtInt, fmtMoney, fmtPercent } from "../lib/format";

interface HeaderProps {
  data: PortfolioData;
  history: PortfolioData["history"];
  activeMonth: string;
  onMonthChange: (m: string) => void;
  realtimeOn: boolean;
  live: boolean;
  realtimeError: string | null;
  lastUpdated: Date | null;
  onToggleRealtime: () => void;
  /** 当前月份快照 */
  summary: { totalAssets: number; availableCash: number; cashRatio: number };
  /** A/H 股市值（最新月份实时计算） */
  aShareValue: number;
  hShareValueCNY: number;
  /** 实时总盈亏（A+H，仅最新月份有值） */
  totalProfit: number | null;
  /** 当日盈亏（仅实时刷新开启时有效） */
  dailyPL: number | null;
  /** 当前月份是否为估算快照 */
  estimated: boolean;
}

export function Header({
  data,
  history,
  activeMonth,
  onMonthChange,
  realtimeOn,
  live,
  realtimeError,
  lastUpdated,
  onToggleRealtime,
  summary,
  aShareValue,
  hShareValueCNY,
  totalProfit,
  dailyPL,
  estimated,
}: HeaderProps) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString("zh-CN", { hour12: false })
    : "";

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-red-900 to-rose-950 text-white">
      {/* 装饰光晕（红色主题） */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-red-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-6">
        {/* 顶行：标题 + 实时开关 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-lg font-bold shadow-lg shadow-red-500/30">
              鹿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                  {data.title}
                </h1>
                {estimated && (
                  <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/40">
                    估算数据
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{data.subtitle}</p>
            </div>
          </div>

          {/* 实时状态 */}
          <div className="flex items-center gap-2">
            {realtimeOn && (
              <button
                type="button"
                onClick={onToggleRealtime}
                title="点击暂停实时刷新"
                className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 backdrop-blur transition hover:bg-emerald-500/20"
              >
                <span
                  className={`live-dot h-2 w-2 rounded-full ${
                    live ? "bg-emerald-400" : "bg-slate-400"
                  }`}
                />
                {live ? "实时行情 · 3s" : "连接中…"}
                {live && timeStr && (
                  <span className="hidden text-emerald-400/70 sm:inline">
                    {timeStr} 更新
                  </span>
                )}
              </button>
            )}
            {!realtimeOn && (
              <button
                type="button"
                onClick={onToggleRealtime}
                title="点击开启实时刷新"
                className="flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1.5 text-xs text-slate-300 backdrop-blur transition hover:bg-slate-500/20"
              >
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                静态数据 · 点击开启实时
              </button>
            )}
          </div>
        </div>

        {/* 实时行情错误提示 */}
        {realtimeOn && realtimeError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>实时行情连接异常（可能被拦截或接口繁忙），当前显示最近一次行情。错误：{realtimeError}</span>
          </div>
        )}

        {/* 核心数字区 */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xs text-slate-400">账户总资产（CNY）</div>
            <div className="mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
              ¥{fmtMoney(summary.totalAssets)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              可用现金 ¥{fmtInt(summary.availableCash)} · 现金仓位{" "}
              {fmtPercent(summary.cashRatio, 1)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400">A 股持仓</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums md:text-2xl">
              ¥{fmtMoney(aShareValue)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">沪 / 深</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">H 股持仓（折 CNY）</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums md:text-2xl">
              ¥{fmtMoney(hShareValueCNY)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">港股</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">持仓总盈亏</div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-nums md:text-2xl ${
                totalProfit === null
                  ? "text-slate-500"
                  : totalProfit > 0
                  ? "text-rose-400"
                  : totalProfit < 0
                  ? "text-emerald-400"
                  : "text-slate-200"
              }`}
            >
              {totalProfit === null
                ? "—"
                : totalProfit > 0
                ? `+${fmtMoney(totalProfit)}`
                : fmtMoney(totalProfit)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {totalProfit === null ? "历史月份不计算" : "按最新行情计算"}
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-400">当日盈亏</span>
              {dailyPL !== null && live && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 live-dot" title="实时刷新中" />
              )}
            </div>
            <div
              key={dailyPL ?? 0}
              className={`mt-1 font-mono text-xl font-semibold tabular-nums md:text-2xl ${
                dailyPL === null
                  ? "text-slate-500"
                  : dailyPL > 0
                  ? "text-rose-400 flash-up"
                  : dailyPL < 0
                  ? "text-emerald-400 flash-down"
                  : "text-slate-200"
              }`}
            >
              {dailyPL === null
                ? "—"
                : dailyPL > 0
                ? `+${fmtMoney(dailyPL)}`
                : fmtMoney(dailyPL)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {dailyPL === null ? "需开启实时" : "相对昨收 · 实时"}
            </div>
          </div>
        </div>

        {/* 月份区：多月份时显示可切换 tabs；单月份时静态显示当前持仓月份 */}
        {history.length > 1 ? (
          <div className="month-scroll mt-6 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {history.map((h) => {
              const active = h.month === activeMonth;
              const est = !!h.audit?.estimated;
              return (
                <button
                  key={h.month}
                  type="button"
                  onClick={() => onMonthChange(h.month)}
                  className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap transition ${
                    active
                      ? "bg-white font-semibold text-slate-900 shadow-md"
                      : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {h.month}
                  {est && (
                    <span
                      className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                        active ? "bg-amber-500" : "bg-amber-400/70"
                      }`}
                      title="估算数据"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-slate-100 ring-1 ring-white/15">
              {history[0].label}
              {history[0].audit?.estimated && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
                  title="估算数据"
                />
              )}
            </span>
            <span className="text-xs text-slate-500">当前持仓月份</span>
          </div>
        )}
      </div>
    </header>
  );
}
