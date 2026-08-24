import { useEffect, useMemo, useState } from "react";
import type { PortfolioData } from "./types";
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
        if (d.history.length > 0) setActiveMonth(d.history[d.history.length - 1].month);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const report =
    data?.history.find((h) => h.month === activeMonth) ?? data?.history[data.history.length - 1];

  // 仅最新月份启用实时行情（历史月份保持当时价格）
  const isLatest = !!data && activeMonth === data.history[data.history.length - 1].month;
  const aCodes = report?.aShares.holdings.filter((s) => s.shares > 0).map((s) => s.code) ?? [];
  const hCodes = report?.hShares.holdings.filter((s) => s.shares > 0).map((s) => s.code) ?? [];
  const { prices, hkdCny, error, live } = useRealtimeQuotes(
    aCodes,
    hCodes,
    realtimeOn && isLatest
  );

  // 实时价格合成展示数据（不修改原始数据）
  const displayReport = useMemo(() => {
    if (!report) return undefined;
    if (!prices) return report;

    const clone: PortfolioData["history"][number] = JSON.parse(JSON.stringify(report));
    const total = clone.summary.totalAssets;

    for (const s of clone.aShares.holdings) {
      const px = prices.get(s.code);
      if (!px || s.shares <= 0) continue;
      s.currentPrice = px;
      s.marketValue = Math.round(s.shares * px);
      s.profitAmount = Math.round((px - s.costPrice) * s.shares);
      s.profitRatio = s.costPrice !== 0 ? (px - s.costPrice) / s.costPrice : null;
      s.weight = total > 0 ? s.marketValue / total : 0;
    }
    for (const s of clone.hShares.holdings) {
      const pxHkd = prices.get(s.code);
      if (!pxHkd || s.shares <= 0) continue;
      const pxCny = pxHkd * hkdCny;
      s.marketValueCNY = Math.round(s.shares * pxCny);
      s.profitAmountCNY = Math.round((pxHkd - s.costPriceHKD) * hkdCny * s.shares);
      if (s.costPriceHKD > 0) s.profitRatio = (pxHkd - s.costPriceHKD) / s.costPriceHKD;
      s.weight = total > 0 ? s.marketValueCNY / total : 0;
    }
    clone.aShares.marketValue = clone.aShares.holdings.reduce((a, s) => a + s.marketValue, 0);
    clone.hShares.marketValueCNY = clone.hShares.holdings.reduce((a, s) => a + s.marketValueCNY, 0);
    return clone;
  }, [report, prices, hkdCny]);

  if (err) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-700">
        数据加载失败：{err}
      </div>
    );
  }
  if (!data || !report || !displayReport) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-500">
        加载中…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-ink-50">
      <Header
        data={data}
        history={data.history}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
        realtimeOn={realtimeOn && isLatest}
        live={live}
        realtimeError={error}
        onToggleRealtime={() => setRealtimeOn((v) => !v)}
      />

      <CategoryCards categories={displayReport.categories} />

      <ASharesTable holdings={displayReport.aShares.holdings} />

      <HSharesTable holdings={displayReport.hShares.holdings} />

      <FooterSummary
        aShareValue={displayReport.aShares.marketValue}
        hShareValueCNY={displayReport.hShares.marketValueCNY}
        totalAssets={displayReport.summary.totalAssets}
        availableCash={displayReport.summary.availableCash}
        cashRatio={displayReport.summary.cashRatio}
        auditedBy={displayReport.audit?.by}
      />
    </main>
  );
}

export default App;
