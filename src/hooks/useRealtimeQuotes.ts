import { useEffect, useRef, useState } from "react";
import {
  fetchQuotes,
  fetchHkdCny,
  FALLBACK_HKD_CNY,
  FX_TTL_MS,
  type Quote,
} from "../lib/realtime";

/**
 * 实时行情 Hook：按固定间隔（默认 3s）通过 JSONP 拉取一批股票的最新价。
 *
 * - 失败计数放在 ref 里，不在 setState 的 updater 内做副作用（React 严格模式下 updater 会执行两次）
 * - 连续失败 >= 3 次时 live=false 并给出提示，成功一次即刻恢复
 * - 页面被切到后台（document.hidden）时跳过轮询，回来时立即补一次，省流量与电量
 * - 汇率按 FX_TTL_MS 缓存，不与 3 秒行情同频请求
 *
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
  const [healthy, setHealthy] = useState(true);

  const failCountRef = useRef(0);
  const fxAtRef = useRef(0);

  // 用字符串做依赖键，避免数组字面量每次渲染都触发 effect 重建
  const aKey = aCodes.join(",");
  const hKey = hCodes.join(",");

  useEffect(() => {
    if (!enabled) {
      setQuotes(null);
      setError(null);
      setLastUpdated(null);
      setHealthy(true);
      failCountRef.current = 0;
      return;
    }

    const all = [...aCodes, ...hCodes];
    if (all.length === 0) return;

    let disposed = false;
    let timer: number | undefined;

    const tick = async () => {
      if (disposed) return;
      // 后台标签页不轮询，避免无意义的请求
      if (document.hidden) return;

      const needFx = Date.now() - fxAtRef.current > FX_TTL_MS;
      try {
        const [q, fx] = await Promise.all([
          fetchQuotes(all),
          needFx ? fetchHkdCny() : Promise.resolve(null),
        ]);
        if (disposed) return;
        setQuotes(q);
        if (fx !== null) {
          fxAtRef.current = Date.now();
          setHkdCny(fx);
        }
        setLastUpdated(new Date());
        failCountRef.current = 0;
        setHealthy(true);
        setError(null);
      } catch {
        if (disposed) return;
        failCountRef.current += 1;
        if (failCountRef.current >= 3) {
          setHealthy(false);
          setError("连续多次获取行情失败，已显示最近一次行情");
        }
      }
    };

    tick();
    timer = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      if (timer !== undefined) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // aKey/hKey 已覆盖 aCodes/hCodes 的内容变化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, aKey, hKey, intervalMs]);

  return {
    quotes,
    /** 实时汇率；所有源都失败时为兜底值 */
    hkdCny: hkdCny ?? FALLBACK_HKD_CNY,
    /** 汇率是否来自实时接口（false 表示用了兜底值） */
    hkdCnyLive: hkdCny !== null,
    error,
    live: enabled && quotes !== null && healthy,
    lastUpdated,
  };
}
