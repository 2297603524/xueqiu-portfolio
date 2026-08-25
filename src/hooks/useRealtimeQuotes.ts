import { useEffect, useRef, useState } from "react";
import { fetchQuotes, fetchHkdCny, type Quote } from "../lib/realtime";

/**
 * 实时行情 Hook：按固定间隔（默认 3s）通过 JSONP 拉取一批股票的最新价
 * - 自动重试：单次失败不会中断，连续失败时 live=false
 * - 实时汇率：HKD/CNY 优先实时（新浪），失败兜底 0.92
 * @param aCodes A 股代码列表（如 ["600900.SH"]）
 * @param hCodes H 股代码列表（如 ["01898.HK"]）
 * @param enabled 是否启用（仅最新月份启用，历史月份保持静态）
 * @param intervalMs 刷新间隔，默认 3000ms
 */
export function useRealtimeQuotes(
  aCodes: string[],
  hCodes: string[],
  enabled: boolean,
  intervalMs = 3000
) {
  const [quotes, setQuotes] = useState<Map<string, Quote> | null>(null);
  const [hkdCny, setHkdCny] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [consecutiveFail, setConsecutiveFail] = useState(0);
  const hkdCnyRef = useRef<number | null>(null);

  const aKey = aCodes.join(",");
  const hKey = hCodes.join(",");

  useEffect(() => {
    if (!enabled) {
      setQuotes(null);
      setError(null);
      setLastUpdated(null);
      setConsecutiveFail(0);
      return;
    }
    const all = [...aCodes, ...hCodes];
    if (all.length === 0) return;

    let disposed = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const [q, hkd] = await Promise.all([
          fetchQuotes(all),
          hkdCnyRef.current === null ? fetchHkdCny() : Promise.resolve(null),
        ]);
        if (disposed) return;
        setQuotes(q);
        if (hkd !== null) {
          hkdCnyRef.current = hkd;
          setHkdCny(hkd);
        }
        setLastUpdated(new Date());
        setConsecutiveFail(0);
        setError(null);
      } catch (e) {
        if (disposed) return;
        setConsecutiveFail((c) => {
          const n = c + 1;
          if (n >= 3) setError("连续多次获取行情失败，已显示最近一次行情");
          return n;
        });
      }
    };

    tick();
    timer = window.setInterval(tick, intervalMs);
    return () => {
      disposed = true;
      if (timer !== undefined) window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, aKey, hKey, intervalMs]);

  return {
    quotes,
    hkdCny: hkdCny ?? 0.92, // 兜底汇率
    error,
    live: enabled && quotes !== null && consecutiveFail < 3,
    lastUpdated,
    consecutiveFail,
  };
}
