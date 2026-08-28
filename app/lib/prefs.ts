import { DEFAULT_ORDER } from "./symbols";

export type ThemeMode = "system" | "light" | "dark";
export type ColorScheme = "kr" | "us";
export type Currency = "USD" | "KRW";
export type ViewMode = "grid" | "table" | "heatmap";

export interface Threshold {
  above?: number;
  below?: number;
}

export interface Prefs {
  order: string[];
  favorites: string[];
  thresholds: Record<string, Threshold>;
  refreshMs: number;
  theme: ThemeMode;
  colorScheme: ColorScheme;
  currency: Currency;
  viewMode: ViewMode;
}

export const REFRESH_OPTIONS = [10_000, 20_000, 30_000, 60_000];

export const DEFAULT_PREFS: Prefs = {
  order: DEFAULT_ORDER,
  favorites: [],
  thresholds: {},
  refreshMs: 20_000,
  theme: "system",
  colorScheme: "kr",
  currency: "USD",
  viewMode: "grid",
};

const STORAGE_KEY = "financial-dashboard-prefs-v1";

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      order: Array.isArray(parsed.order) ? parsed.order : DEFAULT_ORDER,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      thresholds: typeof parsed.thresholds === "object" && parsed.thresholds ? parsed.thresholds : {},
      refreshMs: REFRESH_OPTIONS.includes(parsed.refreshMs) ? parsed.refreshMs : DEFAULT_PREFS.refreshMs,
      theme: ["system", "light", "dark"].includes(parsed.theme) ? parsed.theme : "system",
      colorScheme: ["kr", "us"].includes(parsed.colorScheme) ? parsed.colorScheme : "kr",
      currency: ["USD", "KRW"].includes(parsed.currency) ? parsed.currency : "USD",
      viewMode: ["grid", "table", "heatmap"].includes(parsed.viewMode) ? parsed.viewMode : "grid",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable (private mode, quota) — preferences just won't persist
  }
}

export function moveSymbol(order: string[], symbol: string, direction: -1 | 1): string[] {
  const idx = order.indexOf(symbol);
  const target = idx + direction;
  if (idx === -1 || target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}
