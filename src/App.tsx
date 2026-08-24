import { useEffect, useState } from "react";
import type { PortfolioData } from "./types";
import { Header } from "./components/Header";
import { CategoryCards } from "./components/CategoryCards";
import { ASharesTable, HSharesTable } from "./components/ShareHoldingsTable";
import { FooterSummary } from "./components/FooterSummary";

function App() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>("");
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

  if (err) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-700">
        数据加载失败：{err}
      </div>
    );
  }
  if (!data || !activeMonth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-500">
        加载中…
      </div>
    );
  }

  const report =
    data.history.find((h) => h.month === activeMonth) ?? data.history[0];

  return (
    <main className="min-h-screen bg-ink-50">
      <Header
        data={data}
        history={data.history}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
      />

      <CategoryCards categories={report.categories} />

      <ASharesTable holdings={report.aShares.holdings} />

      <HSharesTable holdings={report.hShares.holdings} />

<FooterSummary
              aShareValue={report.aShares.marketValue}
              hShareValueCNY={report.hShares.marketValueCNY}
              totalAssets={report.summary.totalAssets}
              availableCash={report.summary.availableCash}
              cashRatio={report.summary.cashRatio}
              auditedBy={report.audit?.by}
            />
    </main>
  );
}

export default App;
