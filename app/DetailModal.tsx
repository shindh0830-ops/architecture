"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";
import type { Quote, PeriodKey } from "./lib/symbols";
import { PERIODS } from "./lib/symbols";
import type { Threshold, Currency } from "./lib/prefs";
import { displayPrice, formatNumber } from "./lib/format";

interface DetailModalProps {
  quote: Quote;
  period: PeriodKey;
  threshold?: Threshold;
  onSetThreshold: (symbol: string, field: "above" | "below", value: string) => void;
  onClose: () => void;
  currency: Currency;
  usdKrwRate: number | null;
}

export default function DetailModal({
  quote,
  period,
  threshold,
  onSetThreshold,
  onClose,
  currency,
  usdKrwRate,
}: DetailModalProps) {
  const [aboveInput, setAboveInput] = useState(threshold?.above?.toString() ?? "");
  const [belowInput, setBelowInput] = useState(threshold?.below?.toString() ?? "");
  const [loadedFor, setLoadedFor] = useState(quote.symbol);

  if (loadedFor !== quote.symbol) {
    setLoadedFor(quote.symbol);
    setAboveInput(threshold?.above?.toString() ?? "");
    setBelowInput(threshold?.below?.toString() ?? "");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { price, series } = quote;
  const { change, changePercent } = quote.periods[period];
  const hasData = price !== null && change !== null && changePercent !== null;
  const positive = (change ?? 0) >= 0;
  const periodMeta = PERIODS.find((p) => p.key === period)!;
  const sparklineValues = series.slice(-periodMeta.sparklineLength);
  const high = sparklineValues.length ? Math.max(...sparklineValues) : null;
  const low = sparklineValues.length ? Math.min(...sparklineValues) : null;
  const highAll = series.length ? Math.max(...series) : null;
  const lowAll = series.length ? Math.min(...series) : null;
  const shown = hasData ? displayPrice(quote, price!, currency, usdKrwRate) : null;
  const shownHigh = high !== null ? displayPrice(quote, high, currency, usdKrwRate) : null;
  const shownLow = low !== null ? displayPrice(quote, low, currency, usdKrwRate) : null;
  const shownHighAll = highAll !== null ? displayPrice(quote, highAll, currency, usdKrwRate) : null;
  const shownLowAll = lowAll !== null ? displayPrice(quote, lowAll, currency, usdKrwRate) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="symbol-badge">{quote.symbol}</span>
            <h2>{quote.label}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-top-stats">
            <div className="modal-price-box">
              <span className="stat-label">현재 가격</span>
              {hasData ? (
                <>
                  <div className="modal-price">
                    {formatNumber(shown!.value, quote.decimals)}
                    {shown!.suffix ? ` ${shown!.suffix}` : ""}
                  </div>
                  <div className={`modal-delta ${positive ? "up" : "down"}`}>
                    {positive ? "+" : ""}
                    {formatNumber(change!, quote.decimals)} ({positive ? "+" : ""}
                    {changePercent!.toFixed(2)}%)
                  </div>
                </>
              ) : (
                <div className="tile-error">데이터를 불러올 수 없습니다{quote.error ? ` (${quote.error})` : ""}</div>
              )}
            </div>
            <div className="modal-meta-grid">
              <div className="meta-item">
                <span className="label">기간 고가</span>
                <strong>{shownHigh ? `${formatNumber(shownHigh.value, quote.decimals)} ${shownHigh.suffix ?? ""}` : "-"}</strong>
              </div>
              <div className="meta-item">
                <span className="label">기간 저가</span>
                <strong>{shownLow ? `${formatNumber(shownLow.value, quote.decimals)} ${shownLow.suffix ?? ""}` : "-"}</strong>
              </div>
              <div className="meta-item">
                <span className="label">52주 변동범위</span>
                <strong>
                  {shownLowAll && shownHighAll
                    ? `${formatNumber(shownLowAll.value, quote.decimals)} - ${formatNumber(shownHighAll.value, quote.decimals)}`
                    : "-"}
                </strong>
              </div>
              <div className="meta-item">
                <span className="label">카테고리</span>
                <strong>{quote.category}</strong>
              </div>
            </div>
          </div>

          <div className="chart-container-large">
            {sparklineValues.length > 1 ? (
              <Sparkline
                values={sparklineValues}
                positive={positive}
                width={720}
                height={196}
                area
                id={`modal-${quote.symbol}`}
              />
            ) : (
              <div className="tile-error">차트 데이터가 없습니다</div>
            )}
          </div>

          <div className="modal-alert-setting">
            <h3>🔔 지수 알림 설정</h3>
            <div className="alert-inputs-inline">
              <label>
                상한가 경고
                <input
                  type="number"
                  placeholder="예: 2800"
                  value={aboveInput}
                  onChange={(e) => setAboveInput(e.target.value)}
                />
              </label>
              <label>
                하한가 경고
                <input
                  type="number"
                  placeholder="예: 2500"
                  value={belowInput}
                  onChange={(e) => setBelowInput(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="primary-btn-sm"
                onClick={() => {
                  onSetThreshold(quote.symbol, "above", aboveInput);
                  onSetThreshold(quote.symbol, "below", belowInput);
                }}
              >
                알림 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
