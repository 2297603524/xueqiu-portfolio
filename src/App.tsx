import { useEffect, useMemo, useState } from "react";
import type { PortfolioData } from "./types";
import type { Quote } from "./lib/realtime";
import { Header } from "./components/Header";
import { CategoryCards } from "./components/CategoryCards";
import { ASharesTable, HSharesTable } from "./components/ShareHoldingsTable";
import { FooterSummary } from "./components/FooterSummary";
import { useRealtimeQuotes } from "./hooks/useRealtimeQuotes";

function App() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>("");
  const [realtimeOn, setRealtimeOn] = useState(true);
  const [err, setErr] = useState<string>("");

  // 加载 public/data.json（用 BASE_URL 适配 GitHub Pages 子路径部署）
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data.json")
      .then((r) => r.json())
      .then((d: PortfolioData) => {
        setData(d);
        // 允许通过 URL ?month=YYYY-MM 切换默认月份（用于预览与分享）
        const params = new URLSearchParams(window.location.search);
        const m = params.get("month");
        if (m && d.history.some((h) => h.month === m)) {
          setActiveMonth(m);
        } else if (d.history.length > 0) {
          setActiveMonth(d.history[d.history.length - 1].month);
        }
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const report =
    data?.history.find((h) => h.month === activeMonth) ??
    data?.history[data.history.length - 1];

  // 仅最新月份启用实时行情（历史月份保持当时价格）
  const isLatest = !!data && activeMonth === data.history[data.history.length - 1].month;
  const aCodes = report?.aShares.holdings.filter((s) => s.shares > 0).map((s) => s.code) ?? [];
  const hCodes = report?.hShares.holdings.filter((s) => s.shares > 0).map((s) => s.code) ?? [];
  const { quotes, hkdCny, error, live, lastUpdated } = useRealtimeQuotes(
    aCodes,
    hCodes,
    realtimeOn && isLatest
  );

  // 实时价格合成展示数据（不修改原始数据）
  const displayReport = useMemo(() => {
    if (!report) return undefined;

    const clone: PortfolioData["history"][number] = JSON.parse(JSON.stringify(report));
    const total = clone.summary.totalAssets;

    if (quotes) {
      for (const s of clone.aShares.holdings) {
        const q: Quote | undefined = quotes.get(s.code);
        if (!q || s.shares <= 0) continue;
        s.currentPrice = q.price;
        s.marketValue = Math.round(s.shares * q.price);
        s.profitAmount = Math.round((q.price - s.costPrice) * s.shares);
        s.profitRatio = s.costPrice !== 0 ? (q.price - s.costPrice) / s.costPrice : null;
        s.weight = total > 0 ? s.marketValue / total : 0;
      }
      for (const s of clone.hShares.holdings) {
        const q: Quote | undefined = quotes.get(s.code);
        if (!q || s.shares <= 0) continue;
        const pxCny = q.price * hkdCny;
        s.marketValueCNY = Math.round(s.shares * pxCny);
        s.profitAmountCNY = Math.round((q.price - s.costPriceHKD) * hkdCny * s.shares);
        if (s.costPriceHKD > 0) s.profitRatio = (q.price - s.costPriceHKD) / s.costPriceHKD;
        s.weight = total > 0 ? s.marketValueCNY / total : 0;
      }
    }

    // 重算板块市值
    clone.aShares.marketValue = clone.aShares.holdings.reduce(
      (a, s) => a + s.marketValue,
      0
    );
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

  // 当日盈亏（仅实时刷新时有效）：A/H 股相对昨收的涨跌额合计
  // A 股：shares * (currentPrice - prevClose)，单位 CNY
  // H 股：shares * (currentPrice_HKD - prevClose_HKD) * hkdCny，单位 CNY
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
      if (q && s.shares > 0)
        h += s.shares * (q.price - q.prevClose) * hkdCny;
    }
    return a + h;
  }, [quotes, displayReport, hkdCny]);

  if (err) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        数据加载失败：{err}
      </div>
    );
  }
  if (!data || !report || !displayReport) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        加载中…
      </div>
    );
  }

  const estimated = !!report.audit?.estimated;

  return (
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
        onToggleRealtime={() => setRealtimeOn((v) => !v)}
        summary={displayReport.summary}
        aShareValue={displayReport.aShares.marketValue}
        hShareValueCNY={displayReport.hShares.marketValueCNY}
        totalProfit={totalProfit}
        dailyPL={dailyPL}
        estimated={estimated}
      />

      <div className="mx-auto max-w-6xl px-4">
        <CategoryCards categories={displayReport.categories} />

        <ASharesTable holdings={displayReport.aShares.holdings} quotes={quotes} live={live} />

        <HSharesTable
          holdings={displayReport.hShares.holdings}
          quotes={quotes}
          live={live}
          hkdCny={hkdCny}
        />

        <FooterSummary
          aShareValue={displayReport.aShares.marketValue}
          hShareValueCNY={displayReport.hShares.marketValueCNY}
          totalAssets={displayReport.summary.totalAssets}
          availableCash={displayReport.summary.availableCash}
          cashRatio={displayReport.summary.cashRatio}
          auditedBy={displayReport.audit?.by}
          estimated={estimated}
          live={live}
          hkdCny={hkdCny}
          dailyPL={dailyPL}
        />
      </div>
    </main>
  );
}

export default App;
