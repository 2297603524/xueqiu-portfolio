import { useCallback, useEffect, useMemo, useState } from "react";
import type { PortfolioData } from "./types";
import type { Quote } from "./lib/realtime";
import { Header } from "./components/Header";
import { CategoryCards } from "./components/CategoryCards";
import { ASharesTable, HSharesTable } from "./components/ShareHoldingsTable";
import { FooterSummary } from "./components/FooterSummary";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRealtimeQuotes } from "./hooks/useRealtimeQuotes";

function App() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>("");
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [err, setErr] = useState<string>("");

  // 加载 public/data.json（用 BASE_URL 适配 GitHub Pages 子路径部署）
  useEffect(() => {
    const ctl = new AbortController();
    // no-cache：每次访问都让浏览器带 ETag 回源校验，避免 GitHub Pages 缓存导致数据停留在旧月份
    fetch(import.meta.env.BASE_URL + "data.json", { cache: "no-cache", signal: ctl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: PortfolioData) => {
        const history = Array.isArray(d?.history) ? d.history : [];
        if (history.length === 0) throw new Error("月报数据为空");
        setData({ ...d, history });
        // 允许通过 URL ?month=YYYY-MM 切换默认月份（用于预览与分享）
        const m = new URLSearchParams(window.location.search).get("month");
        setActiveMonth(
          m && history.some((h) => h.month === m) ? m : history[history.length - 1].month
        );
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErr(e instanceof Error ? e.message : String(e));
      });
    return () => ctl.abort();
  }, []);

  const lastMonth = data?.history[data.history.length - 1]?.month ?? "";

  const report = useMemo(
    () => data?.history.find((h) => h.month === activeMonth) ?? data?.history.at(-1),
    [data, activeMonth]
  );

  // 仅最新月份启用实时行情（历史月份保持当时价格）
  const isLatest = !!data && activeMonth !== "" && activeMonth === lastMonth;
  const aCodes = useMemo(
    () => report?.aShares.holdings.filter((s) => s.shares > 0).map((s) => s.code) ?? [],
    [report]
  );
  const hCodes = useMemo(
    () => report?.hShares.holdings.filter((s) => s.shares > 0).map((s) => s.code) ?? [],
    [report]
  );

  const { quotes, hkdCny, hkdCnyLive, error, live, lastUpdated } = useRealtimeQuotes(
    aCodes,
    hCodes,
    realtimeOn && isLatest
  );

  // 实时价格合成展示数据（深拷贝，不修改原始数据）
  const displayReport = useMemo(() => {
    if (!report) return undefined;

    const clone: PortfolioData["history"][number] = JSON.parse(JSON.stringify(report));
    // 仓位分母口径：以月报总资产为基准，与 data.json 保持一致，避免同一行数字前后矛盾
    const totalAssets = clone.summary.totalAssets;

    if (quotes) {
      for (const s of clone.aShares.holdings) {
        const q: Quote | undefined = quotes.get(s.code);
        if (!q || s.shares <= 0) continue;
        s.currentPrice = q.price;
        s.marketValue = Math.round(s.shares * q.price);
        s.profitAmount = Math.round((q.price - s.costPrice) * s.shares);
        s.profitRatio = s.costPrice !== 0 ? (q.price - s.costPrice) / s.costPrice : null;
        s.weight = totalAssets > 0 ? s.marketValue / totalAssets : 0;
      }
      for (const s of clone.hShares.holdings) {
        const q: Quote | undefined = quotes.get(s.code);
        if (!q || s.shares <= 0) continue;
        // 直接记录 HKD 现价，避免再靠「市值 ÷ 股数 ÷ 汇率」反推而产生抖动
        s.currentPriceHKD = q.price;
        s.marketValueCNY = Math.round(s.shares * q.price * hkdCny);
        s.profitAmountCNY = Math.round((q.price - s.costPriceHKD) * hkdCny * s.shares);
        if (s.costPriceHKD > 0) s.profitRatio = (q.price - s.costPriceHKD) / s.costPriceHKD;
        s.weight = totalAssets > 0 ? s.marketValueCNY / totalAssets : 0;
      }
    }

    // 重算板块市值（以持仓明细为准，保证表格合计行与明细一致）
    clone.aShares.marketValue = clone.aShares.holdings.reduce((a, s) => a + s.marketValue, 0);
    clone.hShares.marketValueCNY = clone.hShares.holdings.reduce(
      (a, s) => a + s.marketValueCNY,
      0
    );
    return clone;
  }, [report, quotes, hkdCny]);

  // 持仓总盈亏（A + H）
  const totalProfit = useMemo(() => {
    if (!displayReport) return null;
    const a = displayReport.aShares.holdings.reduce((sum, s) => sum + s.profitAmount, 0);
    const h = displayReport.hShares.holdings.reduce((sum, s) => sum + s.profitAmountCNY, 0);
    return a + h;
  }, [displayReport]);

  // 当日盈亏（仅实时刷新时有效）：A/H 股相对昨收的涨跌额合计，统一折算为 CNY
  const dailyPL = useMemo(() => {
    if (!quotes || !displayReport) return null;
    let a = 0;
    for (const s of displayReport.aShares.holdings) {
      const q = quotes.get(s.code);
      if (q && s.shares > 0) a += s.shares * (q.price - q.prevClose);
    }
    let h = 0;
    for (const s of displayReport.hShares.holdings) {
      const q = quotes.get(s.code);
      if (q && s.shares > 0) h += s.shares * (q.price - q.prevClose) * hkdCny;
    }
    return a + h;
  }, [quotes, displayReport, hkdCny]);

  const toggleRealtime = useCallback(() => setRealtimeOn((v) => !v), []);

  if (err) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-slate-600">月报数据加载失败</div>
        <div className="text-xs text-rose-400">{err}</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 rounded-full border border-rose-200 bg-white px-4 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!data || !report || !displayReport) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-rose-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
        <div className="text-sm">月报加载中…</div>
      </div>
    );
  }

  const estimated = !!report.audit?.estimated;

  return (
    <ErrorBoundary>
      <main className="min-h-screen pb-4">
        <Header
          data={data}
          history={data.history}
          activeMonth={activeMonth}
          onMonthChange={setActiveMonth}
          realtimeOn={realtimeOn && isLatest}
          live={live}
          realtimeError={error}
          lastUpdated={lastUpdated}
          onToggleRealtime={toggleRealtime}
          summary={displayReport.summary}
          aShareValue={displayReport.aShares.marketValue}
          hShareValueCNY={displayReport.hShares.marketValueCNY}
          totalProfit={totalProfit}
          dailyPL={dailyPL}
          monthlyPL={displayReport.monthlyPL}
          estimated={estimated}
        />

        <div className="mx-auto max-w-7xl px-4">
          <CategoryCards categories={displayReport.categories} />

          {/* A/H 表格上下排列（全宽显示，列完整无需横向滚动） */}
          <ASharesTable
            holdings={displayReport.aShares.holdings}
            quotes={quotes}
            live={live}
            totalAssets={displayReport.summary.totalAssets}
          />

          <HSharesTable
            holdings={displayReport.hShares.holdings}
            quotes={quotes}
            live={live}
            hkdCny={hkdCny}
            totalAssets={displayReport.summary.totalAssets}
          />

          <FooterSummary
            auditedBy={displayReport.audit?.by}
            estimated={estimated}
            live={live}
            hkdCny={hkdCny}
            hkdCnyLive={hkdCnyLive}
            monthLabel={displayReport.label}
          />
        </div>
      </main>
    </ErrorBoundary>
  );
}

export default App;
