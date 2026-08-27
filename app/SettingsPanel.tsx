"use client";

import { SYMBOLS } from "./lib/symbols";
import { DEFAULT_PREFS, REFRESH_OPTIONS, moveSymbol, type Prefs } from "./lib/prefs";

interface SettingsPanelProps {
  open: boolean;
  prefs: Prefs;
  onChange: (next: Prefs) => void;
  onClose: () => void;
}

function labelFor(symbol: string) {
  return SYMBOLS.find((s) => s.symbol === symbol)?.label ?? symbol;
}

export default function SettingsPanel({ open, prefs, onChange, onClose }: SettingsPanelProps) {
  if (!open) return null;

  const setThreshold = (symbol: string, field: "above" | "below", raw: string) => {
    const value = raw.trim() === "" ? undefined : Number(raw);
    const current = prefs.thresholds[symbol] ?? {};
    const nextThreshold = { ...current, [field]: value };
    onChange({ ...prefs, thresholds: { ...prefs.thresholds, [symbol]: nextThreshold } });
  };

  const toggleFavorite = (symbol: string) => {
    const isFav = prefs.favorites.includes(symbol);
    onChange({
      ...prefs,
      favorites: isFav ? prefs.favorites.filter((s) => s !== symbol) : [...prefs.favorites, symbol],
    });
  };

  const move = (symbol: string, direction: -1 | 1) => {
    onChange({ ...prefs, order: moveSymbol(prefs.order, symbol, direction) });
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>설정</h2>
          <button type="button" className="settings-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="settings-section">
          <label className="settings-label" htmlFor="refresh-interval">
            새로고침 주기
          </label>
          <select
            id="refresh-interval"
            className="settings-select"
            value={prefs.refreshMs}
            onChange={(e) => onChange({ ...prefs, refreshMs: Number(e.target.value) })}
          >
            {REFRESH_OPTIONS.map((ms) => (
              <option key={ms} value={ms}>
                {ms / 1000}초
              </option>
            ))}
          </select>
        </div>

        <div className="settings-section">
          <div className="settings-label">지표 관리 (즐겨찾기 · 순서 · 임계값 알림)</div>
          <div className="symbol-list">
            {prefs.order.map((symbol, i) => (
              <div key={symbol} className="symbol-row">
                <button
                  type="button"
                  className={`favorite-btn${prefs.favorites.includes(symbol) ? " active" : ""}`}
                  onClick={() => toggleFavorite(symbol)}
                  aria-label="즐겨찾기 토글"
                >
                  {prefs.favorites.includes(symbol) ? "★" : "☆"}
                </button>
                <span className="symbol-row-label">{labelFor(symbol)}</span>
                <div className="symbol-row-thresholds">
                  <input
                    type="number"
                    placeholder="이상"
                    className="threshold-input"
                    value={prefs.thresholds[symbol]?.above ?? ""}
                    onChange={(e) => setThreshold(symbol, "above", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="이하"
                    className="threshold-input"
                    value={prefs.thresholds[symbol]?.below ?? ""}
                    onChange={(e) => setThreshold(symbol, "below", e.target.value)}
                  />
                </div>
                <div className="symbol-row-move">
                  <button type="button" disabled={i === 0} onClick={() => move(symbol, -1)} aria-label="위로">
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === prefs.order.length - 1}
                    onClick={() => move(symbol, 1)}
                    aria-label="아래로"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className="settings-reset" onClick={() => onChange(DEFAULT_PREFS)}>
          기본값으로 초기화
        </button>
      </div>
    </div>
  );
}
