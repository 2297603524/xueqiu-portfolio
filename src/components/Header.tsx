import type { PortfolioData } from "../types";

interface HeaderProps {
  data: PortfolioData;
  history: PortfolioData["history"];
  activeMonth: string;
  onMonthChange: (m: string) => void;
  realtimeOn: boolean;
  live: boolean;
  realtimeError: string | null;
  onToggleRealtime: () => void;
}

export function Header({
  data,
  history,
  activeMonth,
  onMonthChange,
  realtimeOn,
  live,
  realtimeError,
  onToggleRealtime,
}: HeaderProps) {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 tracking-tight">
            {data.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* 实时行情开关 */}
          {realtimeOn && (
            <button
              type="button"
              onClick={onToggleRealtime}
              title="点击暂停实时刷新"
              className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 transition hover:bg-emerald-100"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    live ? "animate-ping bg-emerald-400 opacity-75" : "bg-ink-300"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    live ? "bg-emerald-500" : "bg-ink-300"
                  }`}
                />
              </span>
              {live ? "实时行情 · 1s" : "连接中…"}
            </button>
          )}
          {!realtimeOn && (
            <button
              type="button"
              onClick={onToggleRealtime}
              title="点击开启实时刷新"
              className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs text-ink-500 transition hover:bg-ink-50"
            >
              <span className="h-2 w-2 rounded-full bg-ink-300" />
              静态数据（点击开实时）
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500">切换月份</span>
            <select
              value={activeMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-900 shadow-sm focus:border-accent-open focus:outline-none focus:ring-2 focus:ring-accent-open/20"
            >
              {history.map((h) => (
                <option key={h.month} value={h.month}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 实时行情提示条 */}
      {realtimeOn && realtimeError && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          实时行情连接失败（可能被浏览器拦截或接口繁忙），当前显示静态数据。错误：{realtimeError}
        </div>
      )}
      {realtimeOn && live && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <span>最新月份实时刷新中（A/H 股现价、市值、仓位、盈亏每秒更新）</span>
          <span className="text-ink-300">·</span>
          <span>HKD/CNY 按 0.92 估算</span>
        </div>
      )}

      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent" />
    </header>
  );
}
