import { useEffect, useState } from "react";
import { fetchQuotes } from "../lib/realtime";

/**
 * 实时行情 Hook：按固定间隔（默认 1s）通过 JSONP 拉取一批股票的最新价
 * @param aCodes A 股代码列表（如 ["600900.SH"]）
 * @param hCodes H 股代码列表（如 ["01898.HK"]）
 * @param enabled 是否启用（仅最新月份启用，历史月份保持静态）
 * @param intervalMs 刷新间隔，默认 1000ms
 */
export function useRealtimeQuotes(
  aCodes: string[],
  hCodes: string[],
  enabled: boolean,
  intervalMs = 1000
) {
  const [prices, setPrices] = useState<Map<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // H 股换算汇率：与历史快照口径一致（近似 0.92），避免依赖实时汇率接口
  const hkdCny = 0.92;

  const aKey = aCodes.join(",");
  const hKey = hCodes.join(",");

  useEffect(() => {
    if (!enabled) {
      setPrices(null);
      return;
    }
    const all = [...aCodes, ...hCodes];
    if (all.length === 0) return;

    let disposed = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const m = await fetchQuotes(all);
        if (!disposed) {
          setPrices(m);
          if (error) setError(null);
        }
      } catch (e) {
        if (!disposed) setError(String(e instanceof Error ? e.message : e));
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

  return { prices, hkdCny, error, live: enabled && !!prices };
}
