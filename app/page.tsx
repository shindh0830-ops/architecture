"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MetricCard from "./MetricCard";
import MetricsTable from "./MetricsTable";
import HeatmapGrid from "./HeatmapGrid";
import DetailModal from "./DetailModal";
import SettingsPanel from "./SettingsPanel";
import ThemeToggle from "./ThemeToggle";
import type { Quote, PeriodKey } from "./lib/symbols";
import { PERIODS, USD_KRW_SYMBOL, KR_MARKET_SYMBOL, US_MARKET_SYMBOL } from "./lib/symbols";
import { loadPrefs, savePrefs, DEFAULT_PREFS, type Prefs } from "./lib/prefs";
import { formatNumber } from "./lib/format";

const VIEW_TABS: { key: Prefs["viewMode"]; label: string }[] = [
  { key: "grid", label: "카드 뷰" },
  { key: "table", label: "리스트 뷰" },
  { key: "heatmap", label: "히트맵 뷰" },
];

interface Toast {
  id: number;
  text: string;
}

function useClock(timeZone: string, label: string) {
  const [text, setText] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("ko-KR", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      setText(`${formatted} ${label}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone, label]);
  return text;
}

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [period, setPeriod] = useState<PeriodKey>("day");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [converterAmount, setConverterAmount] = useState(100);

  const triggeredRef = useRef<Record<string, { above?: number; below?: number }>>({});

  const kstClock = useClock("Asia/Seoul", "KST");
  const estClock = useClock("America/New_York", "EST");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only reachable client-side, after mount
    setPrefs(loadPrefs());
    setPrefsLoaded(true);
  }, []);

  const updatePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    const root = document.documentElement;
    if (prefs.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", prefs.theme);
    root.setAttribute("data-color-scheme", prefs.colorScheme);
  }, [prefs.theme, prefs.colorScheme, prefsLoaded]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuotes(data.quotes);
      setUpdatedAt(data.updatedAt);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "불러오기에 실패했습니다");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, refreshed on an interval
    load();
    const id = setInterval(load, prefs.refreshMs);
    return () => clearInterval(id);
  }, [load, prefs.refreshMs]);

  // Threshold-breach toast notifications
  useEffect(() => {
    if (!quotes) return;
    const newToasts: Toast[] = [];
    quotes.forEach((q) => {
      const threshold = prefs.thresholds[q.symbol];
      if (!threshold || q.price === null) return;
      const fired = triggeredRef.current[q.symbol] ?? {};
      if (threshold.above !== undefined) {
        if (q.price >= threshold.above && fired.above !== threshold.above) {
          fired.above = threshold.above;
          newToasts.push({ id: Date.now() + Math.random(), text: `🔔 ${q.label} 목표 상한가(${threshold.above.toLocaleString()}) 돌파!` });
        } else if (q.price < threshold.above) {
          fired.above = undefined;
        }
      }
      if (threshold.below !== undefined) {
        if (q.price <= threshold.below && fired.below !== threshold.below) {
          fired.below = threshold.below;
          newToasts.push({ id: Date.now() + Math.random(), text: `⚠️ ${q.label} 목표 하한가(${threshold.below.toLocaleString()}) 이탈!` });
        } else if (q.price > threshold.below) {
          fired.below = undefined;
        }
      }
      triggeredRef.current[q.symbol] = fired;
    });
    if (newToasts.length) {
      setToasts((prev) => [...prev, ...newToasts]);
      newToasts.forEach((t) => {
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 6000);
      });
    }
  }, [quotes, prefs.thresholds]);

  const toggleFavorite = useCallback(
    (symbol: string) => {
      const isFav = prefs.favorites.includes(symbol);
      updatePrefs({
        ...prefs,
        favorites: isFav ? prefs.favorites.filter((s) => s !== symbol) : [...prefs.favorites, symbol],
      });
    },
    [prefs, updatePrefs]
  );

  const setThreshold = useCallback(
    (symbol: string, field: "above" | "below", raw: string) => {
      const value = raw.trim() === "" ? undefined : Number(raw);
      const current = prefs.thresholds[symbol] ?? {};
      const nextThreshold = { ...current, [field]: value };
      updatePrefs({ ...prefs, thresholds: { ...prefs.thresholds, [symbol]: nextThreshold } });
    },
    [prefs, updatePrefs]
  );

  const orderIndex = (symbol: string) => {
    const i = prefs.order.indexOf(symbol);
    return i === -1 ? prefs.order.length : i;
  };

  const sortedQuotes = quotes ? [...quotes].sort((a, b) => orderIndex(a.symbol) - orderIndex(b.symbol)) : [];

  const filteredQuotes = sortedQuotes.filter((q) => {
    if (favOnly && !prefs.favorites.includes(q.symbol)) return false;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      if (!q.label.toLowerCase().includes(needle) && !q.symbol.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  const favoriteQuotes = filteredQuotes.filter((q) => prefs.favorites.includes(q.symbol));
  const categories = Array.from(new Set(filteredQuotes.map((q) => q.category)));

  const usdKrwQuote = quotes?.find((q) => q.symbol === USD_KRW_SYMBOL);
  const usdKrwRate = usdKrwQuote?.price ?? null;

  const krOpen = quotes?.find((q) => q.symbol === KR_MARKET_SYMBOL)?.marketOpen ?? false;
  const usOpen = quotes?.find((q) => q.symbol === US_MARKET_SYMBOL)?.marketOpen ?? false;

  const fearGreed = useMemo(() => {
    if (!quotes) return null;
    const withData = quotes
      .map((q) => q.periods.day.changePercent)
      .filter((v): v is number => v !== null);
    if (!withData.length) return null;
    const avg = withData.reduce((sum, v) => sum + v, 0) / withData.length;
    const value = Math.max(0, Math.min(100, Math.round(50 + avg * 15)));
    let label: string;
    if (value <= 25) label = "극단적 공포 (Extreme Fear)";
    else if (value <= 45) label = "공포 (Fear)";
    else if (value <= 55) label = "중립 (Neutral)";
    else if (value <= 75) label = "탐욕 (Greed)";
    else label = "극단적 탐욕 (Extreme Greed)";
    return { value, label, isGreed: value >= 50 };
  }, [quotes]);

  const detailQuote = quotes?.find((q) => q.symbol === detailSymbol) ?? null;

  const colorSchemeLabel = prefs.colorScheme === "kr" ? "한국식 (상승🔴 하락🔵)" : "글로벌식 (상승🟢 하락🔴)";

  const view = prefs.viewMode;

  return (
    <main className="page">
      <header className="main-header">
        <div className="header-top">
          <div className="brand-section">
            <div className="logo-icon">F</div>
            <div className="title-group">
              <h1>
                FINANCE PRO <span className="badge-live"><span className="pulse-dot" /> LIVE</span>
              </h1>
              <p className="subtitle">글로벌 시장 금융 지표 실시간 대시보드</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="market-time-box">
              <div className="time-item">🇰🇷 서울 {kstClock}</div>
              <div className="time-divider" />
              <div className="time-item">🇺🇸 뉴욕 {estClock}</div>
            </div>

            <button
              type="button"
              className="icon-btn-text"
              title="등락 색상 표준 전환"
              onClick={() => updatePrefs({ ...prefs, colorScheme: prefs.colorScheme === "kr" ? "us" : "kr" })}
            >
              🎨 {colorSchemeLabel}
            </button>

            <div className="currency-toggle-group">
              <button
                type="button"
                className={`curr-btn${prefs.currency === "USD" ? " active" : ""}`}
                onClick={() => updatePrefs({ ...prefs, currency: "USD" })}
              >
                $ USD
              </button>
              <button
                type="button"
                className={`curr-btn${prefs.currency === "KRW" ? " active" : ""}`}
                onClick={() => updatePrefs({ ...prefs, currency: "KRW" })}
              >
                ₩ KRW
              </button>
            </div>

            <ThemeToggle theme={prefs.theme} onChange={(theme) => updatePrefs({ ...prefs, theme })} />

            <button type="button" className="primary-btn" onClick={() => setSettingsOpen(true)}>
              ⚙ 설정
            </button>
          </div>
        </div>

        <div className="market-summary-bar">
          <div className="summary-card">
            <div className="summary-label">📊 시장 탐욕·공포 지수</div>
            <div className="fear-greed-body">
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{ width: `${fearGreed?.value ?? 50}%` }} />
              </div>
              <div className="fear-greed-info">
                <span className={`fg-val ${fearGreed?.isGreed ? "greed" : "fear"}`}>{fearGreed?.value ?? "-"}</span>
                <span className="fg-label">{fearGreed?.label ?? "산출 중..."}</span>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">🌐 증시 개장 상태</div>
            <div className="status-badges">
              <span className={`status-badge${krOpen ? " open" : ""}`}>
                <span className="dot" /> 한국증시 <small>{krOpen ? "장중" : "장마감"}</small>
              </span>
              <span className={`status-badge${usOpen ? " open" : ""}`}>
                <span className="dot" /> 미증시 <small>{usOpen ? "장중" : "장마감"}</small>
              </span>
              <span className="status-badge open">
                <span className="dot" /> 코인 <small>24시간 연중무휴</small>
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">💱 환율 빠른 계산기</div>
            <div className="quick-converter">
              <input
                type="number"
                min={1}
                step={10}
                value={converterAmount}
                onChange={(e) => setConverterAmount(Number(e.target.value) || 0)}
              />
              <span>USD =</span>
              <strong>
                {usdKrwRate ? `${formatNumber(converterAmount * usdKrwRate, 0)} KRW` : "환율 정보 없음"}
              </strong>
            </div>
          </div>
        </div>

        <div className="controls-bar">
          <div className="view-mode-tabs">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`view-tab${view === tab.key ? " active" : ""}`}
                onClick={() => updatePrefs({ ...prefs, viewMode: tab.key })}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <button
              type="button"
              className={`fav-filter-btn${favOnly ? " active" : ""}`}
              onClick={() => setFavOnly((v) => !v)}
            >
              ★ 즐겨찾기만 보기 ({prefs.favorites.length})
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="지수명, 티커 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="period-tabs" role="tablist" aria-label="기간 선택">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={period === p.key}
                className={`period-tab${period === p.key ? " active" : ""}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="info-meta-bar">
        <span>
          {updatedAt ? `마지막 업데이트: ${new Date(updatedAt).toLocaleTimeString("ko-KR")}` : "불러오는 중..."}
          {errorMsg ? <span className="page-error"> · {errorMsg}</span> : null}
        </span>
        <div className="live-update-control">
          <span className="live-badge">⚡ {Math.round(prefs.refreshMs / 1000)}초 자동 갱신</span>
          <button type="button" className="icon-link-btn" title="수동 갱신" onClick={load}>
            ↻
          </button>
        </div>
      </div>

      {!quotes ? (
        <div className="loading">데이터를 불러오는 중입니다...</div>
      ) : view === "table" ? (
        <MetricsTable
          quotes={filteredQuotes}
          period={period}
          favorites={prefs.favorites}
          onToggleFavorite={toggleFavorite}
          onOpenDetail={setDetailSymbol}
          currency={prefs.currency}
          usdKrwRate={usdKrwRate}
        />
      ) : view === "heatmap" ? (
        <HeatmapGrid
          quotes={filteredQuotes}
          period={period}
          onOpenDetail={setDetailSymbol}
          currency={prefs.currency}
          usdKrwRate={usdKrwRate}
        />
      ) : (
        <>
          {favoriteQuotes.length > 0 && (
            <section className="category-section">
              <div className="category-header">
                <span className="category-title">★ 즐겨찾기</span>
              </div>
              <div className="tile-grid">
                {favoriteQuotes.map((q) => (
                  <MetricCard
                    key={q.symbol}
                    quote={q}
                    period={period}
                    isFavorite
                    onToggleFavorite={toggleFavorite}
                    onOpenDetail={setDetailSymbol}
                    threshold={prefs.thresholds[q.symbol]}
                    currency={prefs.currency}
                    usdKrwRate={usdKrwRate}
                  />
                ))}
              </div>
            </section>
          )}

          {categories.map((category) => (
            <section key={category} className="category-section">
              <div className="category-header">
                <span className="category-title">{category}</span>
              </div>
              <div className="tile-grid">
                {filteredQuotes
                  .filter((q) => q.category === category)
                  .map((q) => (
                    <MetricCard
                      key={q.symbol}
                      quote={q}
                      period={period}
                      isFavorite={prefs.favorites.includes(q.symbol)}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetail={setDetailSymbol}
                      threshold={prefs.thresholds[q.symbol]}
                      currency={prefs.currency}
                      usdKrwRate={usdKrwRate}
                    />
                  ))}
              </div>
            </section>
          ))}

          {filteredQuotes.length === 0 && <div className="loading">조건에 맞는 지표가 없습니다.</div>}
        </>
      )}

      <footer className="main-footer">
        <p>FINANCE PRO Dashboard &copy; 2026. 개인 참고용 금융 지표 대시보드입니다.</p>
        <p className="disclaimer">
          시장 탐욕·공포 지수는 표시 중인 지표들의 일간 등락률 평균으로 산출한 참고용 수치이며, 데이터는 투자 권유의
          목적이 아닙니다.
        </p>
      </footer>

      {detailQuote && (
        <DetailModal
          quote={detailQuote}
          period={period}
          threshold={prefs.thresholds[detailQuote.symbol]}
          onSetThreshold={setThreshold}
          onClose={() => setDetailSymbol(null)}
          currency={prefs.currency}
          usdKrwRate={usdKrwRate}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        prefs={prefs}
        onChange={updatePrefs}
        onClose={() => setSettingsOpen(false)}
      />

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              {t.text}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
