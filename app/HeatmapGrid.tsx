"use client";

import type { Quote, PeriodKey } from "./lib/symbols";
import type { Currency } from "./lib/prefs";
import { displayPrice, formatNumber } from "./lib/format";

interface HeatmapGridProps {
  quotes: Quote[];
  period: PeriodKey;
  onOpenDetail: (symbol: string) => void;
  currency: Currency;
  usdKrwRate: number | null;
}

function heatClass(changePercent: number) {
  if (changePercent > 1.2) return "up-heavy";
  if (changePercent > 0) return "up-light";
  if (changePercent < -1.2) return "down-heavy";
  if (changePercent < 0) return "down-light";
  return "flat";
}

export default function HeatmapGrid({ quotes, period, onOpenDetail, currency, usdKrwRate }: HeatmapGridProps) {
  return (
    <div className="heatmap-grid">
      {quotes.map((quote) => {
        const { price } = quote;
        const { change, changePercent } = quote.periods[period];
        const hasData = price !== null && change !== null && changePercent !== null;
        if (!hasData) {
          return (
            <div key={quote.symbol} className="heatmap-tile flat" onClick={() => onOpenDetail(quote.symbol)}>
              <div className="heatmap-top">{quote.label}</div>
              <div className="heatmap-bottom">
                <span className="heatmap-val">-</span>
              </div>
            </div>
          );
        }
        const shown = displayPrice(quote, price!, currency, usdKrwRate);
        return (
          <div
            key={quote.symbol}
            className={`heatmap-tile ${heatClass(changePercent!)}`}
            onClick={() => onOpenDetail(quote.symbol)}
          >
            <div className="heatmap-top">
              <span>{quote.label}</span>
            </div>
            <div className="heatmap-bottom">
              <span className="heatmap-val">
                {formatNumber(shown.value, quote.decimals)}
                {shown.suffix ? ` ${shown.suffix}` : ""}
              </span>
              <span className="heatmap-delta">
                {changePercent! >= 0 ? "+" : ""}
                {changePercent!.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
