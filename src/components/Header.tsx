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
  /** 月度盈亏（当月盈利额/收益率） */
  monthlyPL: { profit: number | null; ratio: number | null; note?: string } | undefined;
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
  monthlyPL,
  estimated,
}: HeaderProps) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString("zh-CN", { hour12: false })
    : "";
  const todayStr = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-rose-50 to-rose-100 text-rose-900">
      {/* 装饰光晕（浅红） */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-rose-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-5 pb-4">
        {/* 顶行：标题 + 实时开关 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                  {data.title}
                </h1>
                {estimated && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-300">
                    估算数据
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-500">
                {data.subtitle ? `${data.subtitle} · ` : ""}
                {todayStr}
              </p>
            </div>
          </div>

          {/* 实时状态 */}
          <div className="flex items-center gap-2">
            {realtimeOn && (
              <button
                type="button"
                onClick={onToggleRealtime}
                title="点击暂停实时刷新"
                className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 transition hover:bg-emerald-100"
              >
                <span
                  className={`live-dot h-2 w-2 rounded-full ${
                    live ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                {live ? "实时行情 · 3s" : "连接中…"}
                {live && timeStr && (
                  <span className="hidden text-emerald-600/70 sm:inline">
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
                className="flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs text-rose-500 transition hover:bg-rose-50"
              >
                <span className="h-2 w-2 rounded-full bg-rose-300" />
                静态数据 · 点击开启实时
              </button>
            )}
          </div>
        </div>

        {/* 实时行情错误提示 */}
        {realtimeOn && realtimeError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
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
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="text-[11px] text-rose-400">账户总资产（CNY）</div>
            <div className="mt-0.5 bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 bg-clip-text font-mono text-2xl font-bold tabular-nums tracking-tight text-transparent md:text-3xl">
              ¥{fmtMoney(summary.totalAssets)}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-rose-400">
              可用现金 ¥{fmtInt(summary.availableCash)} · 现金仓位
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-rose-200/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${Math.min(summary.cashRatio, 1) * 100}%` }}
                />
              </div>
              {fmtPercent(summary.cashRatio, 1)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-rose-400">A 股持仓</div>
            <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums md:text-xl">
              ¥{fmtMoney(aShareValue)}
            </div>
            <div className="mt-0.5 text-[11px] text-rose-400">沪 / 深</div>
          </div>

          <div>
            <div className="text-[11px] text-rose-400">H 股持仓（折 CNY）</div>
            <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums md:text-xl">
              ¥{fmtMoney(hShareValueCNY)}
            </div>
            <div className="mt-0.5 text-[11px] text-rose-400">港股</div>
          </div>

          <div>
            <div className="text-[11px] text-rose-400">持仓总盈亏</div>
            <div
              className={`mt-0.5 font-mono text-lg font-semibold tabular-nums md:text-xl ${
                totalProfit === null
                  ? "text-rose-300"
                  : totalProfit > 0
                  ? "text-rose-600"
                  : totalProfit < 0
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              {totalProfit === null
                ? "—"
                : totalProfit > 0
                ? `+${fmtMoney(totalProfit)}`
                : fmtMoney(totalProfit)}
            </div>
            <div className="mt-0.5 text-[11px] text-rose-400">
              {totalProfit === null ? "历史月份不计算" : "按最新行情计算"}
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] text-rose-400">当日盈亏</span>
              {dailyPL !== null && live && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 live-dot" title="实时刷新中" />
              )}
            </div>
            <div
              key={dailyPL ?? 0}
              className={`mt-0.5 font-mono text-lg font-semibold tabular-nums md:text-xl ${
                dailyPL === null
                  ? "text-rose-300"
                  : dailyPL > 0
                  ? "text-rose-600 flash-up"
                  : dailyPL < 0
                  ? "text-emerald-600 flash-down"
                  : "text-rose-500"
              }`}
            >
              {dailyPL === null
                ? "—"
                : dailyPL > 0
                ? `+${fmtMoney(dailyPL)}`
                : fmtMoney(dailyPL)}
            </div>
            <div className="mt-0.5 text-[11px] text-rose-400">
              {dailyPL === null ? "需开启实时" : "相对昨收 · 实时"}
            </div>
          </div>
        </div>

        {/* 月度盈亏徽章行 */}
        {monthlyPL?.profit != null && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm ${
                monthlyPL.profit > 0
                  ? "border-rose-200 bg-white/80 text-rose-600"
                  : monthlyPL.profit < 0
                  ? "border-emerald-200 bg-white/80 text-emerald-600"
                  : "border-rose-200 bg-white/80 text-rose-500"
              }`}
            >
              <span className="font-medium">本月盈亏</span>
              <span className="font-mono text-sm font-bold tabular-nums">
                {monthlyPL.profit > 0 ? "+" : ""}
                {fmtMoney(monthlyPL.profit)}
              </span>
              {monthlyPL.ratio != null && (
                <span className="font-mono tabular-nums opacity-80">
                  {monthlyPL.ratio > 0 ? "+" : ""}
                  {fmtPercent(Math.abs(monthlyPL.ratio), 2)}
                </span>
              )}
            </span>
            {monthlyPL.note && (
              <span className="text-[11px] text-rose-400">{monthlyPL.note}</span>
            )}
          </div>
        )}

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
                      ? "bg-white font-semibold text-rose-700 shadow-md shadow-rose-200"
                      : "bg-white/60 text-rose-500 ring-1 ring-rose-200 hover:bg-white"
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
          <div className="mt-3 flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
              {history[0].label}
              {history[0].audit?.estimated && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
                  title="估算数据"
                />
              )}
            </span>
            <span className="text-xs text-rose-400">当前持仓月份</span>
          </div>
        )}
      </div>
    </header>
  );
}
