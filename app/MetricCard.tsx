"use client";

import { useEffect, useRef, useState } from "react";
import Sparkline from "./Sparkline";
import type { Quote, PeriodKey } from "./lib/symbols";
import { PERIODS } from "./lib/symbols";
import type { Threshold, Currency } from "./lib/prefs";
import { displayPrice, formatNumber } from "./lib/format";

interface MetricCardProps {
  quote: Quote;
  period: PeriodKey;
  isFavorite: boolean;
  onToggleFavorite: (symbol: string) => void;
  onOpenDetail: (symbol: string) => void;
  threshold?: Threshold;
  currency: Currency;
  usdKrwRate: number | null;
}

export default function MetricCard({
  quote,
  period,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
  threshold,
  currency,
  usdKrwRate,
}: MetricCardProps) {
  const { label, price, series } = quote;
  const { change, changePercent } = quote.periods[period];
  const hasData = price !== null && change !== null && changePercent !== null;
  const positive = (change ?? 0) >= 0;

  const periodMeta = PERIODS.find((p) => p.key === period)!;
  const sparklineValues = series.slice(-periodMeta.sparklineLength);

  const breachedAbove = threshold?.above !== undefined && price !== null && price >= threshold.above;
  const breachedBelow = threshold?.below !== undefined && price !== null && price <= threshold.below;
  const breached = breachedAbove || breachedBelow;

  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPrice = useRef<number | null>(price);

  useEffect(() => {
    if (prevPrice.current !== null && price !== null && price !== prevPrice.current) {
      setFlash(price > prevPrice.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 900);
      prevPrice.current = price;
      return () => clearTimeout(t);
    }
    prevPrice.current = price;
  }, [price]);

  const shown = hasData ? displayPrice(quote, price!, currency, usdKrwRate) : null;

  return (
    <div
      id={`card-${quote.symbol}`}
      className={`tile${breached ? " tile-alert" : ""}${flash ? ` flash-${flash}` : ""}`}
      onClick={() => onOpenDetail(quote.symbol)}
      role="button"
      tabIndex={0}
    >
      <div className="tile-head">
        <div className="tile-head-left">
          <button
            type="button"
            className={`favorite-btn${isFavorite ? " active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(quote.symbol);
            }}
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={isFavorite}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <span className="tile-label">{label}</span>
        </div>
        <span
          className={`market-dot ${quote.marketOpen ? "open" : "closed"}`}
          title={quote.marketOpen ? "장중" : "장마감"}
        >
          {quote.marketOpen ? "장중" : "장마감"}
        </span>
      </div>

      {hasData ? (
        <>
          <div className="tile-value">
            {formatNumber(shown!.value, quote.decimals)}
            {shown!.suffix ? <span className="tile-suffix">{shown!.suffix}</span> : null}
          </div>

          <div className="tile-row">
            <span className={`tile-delta ${positive ? "up" : "down"}`}>
              {positive ? "▲" : "▼"} {formatNumber(Math.abs(change!), quote.decimals)} (
              {Math.abs(changePercent!).toFixed(2)}%)
            </span>
          </div>

          <div className="sparkline-container">
            <Sparkline values={sparklineValues} positive={positive} width={230} height={44} area id={quote.symbol} />
          </div>

          {breached && (
            <div className="tile-alert-text">
              ⚠ 임계값 도달{breachedAbove ? ` (이상: ${threshold!.above})` : ""}
              {breachedBelow ? ` (이하: ${threshold!.below})` : ""}
            </div>
          )}
        </>
      ) : (
        <div className="tile-error">데이터를 불러올 수 없습니다{quote.error ? ` (${quote.error})` : ""}</div>
      )}
    </div>
  );
}
