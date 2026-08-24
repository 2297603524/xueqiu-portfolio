import type { PortfolioData } from "../types";

interface HeaderProps {
  data: PortfolioData;
  history: PortfolioData["history"];
  activeMonth: string;
  onMonthChange: (m: string) => void;
}

export function Header({ data, history, activeMonth, onMonthChange }: HeaderProps) {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 tracking-tight">
            {data.title}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {data.subtitle} · 每月初更新
          </p>
        </div>
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
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent" />
    </header>
  );
}
