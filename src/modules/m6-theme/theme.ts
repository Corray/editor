import { createSignal, createEffect } from 'solid-js';
import type { ThemeAPI, ThemeMode } from './api';

const STORAGE_KEY = 'editor.theme.v1';

/**
 * Three-tier init fallback (consensus §4.4):
 *   1. localStorage (only accept 'light' | 'dark' — guards against poisoning)
 *   2. window.matchMedia('(prefers-color-scheme: dark)')
 *   3. 'light'
 */
function readInitial(): ThemeMode {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage may throw in privacy mode; treat as absent.
  }
  if (stored === 'light' || stored === 'dark') return stored;

  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // matchMedia may be absent in some envs; fall through.
  }

  return 'light';
}

/**
 * Apply the initial theme to <html> synchronously — call at bootstrap **before**
 * any async work (v1.6: bootstrap awaits IDB before render; without this the
 * dark-mode initial theme flashes light until render / FOUC). Idempotent with
 * createTheme's effect (same value re-applied). Pure side effect, no signal.
 */
export function applyInitialTheme(): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = readInitial();
  }
}

/**
 * Build a ThemeAPI. Must be called inside a Solid reactive root.
 *
 * Side effect: a createEffect mirrors `theme()` to:
 *   - document.documentElement.dataset.theme (drives CSS Variables)
 *   - localStorage[editor.theme.v1] (persistence per consensus TBD-8)
 */
export function createTheme(): ThemeAPI {
  const [theme, setTheme] = createSignal<ThemeMode>(readInitial());

  createEffect(() => {
    const t = theme();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = t;
    }
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // best-effort persistence; quota errors don't break the UI.
    }
  });

  return {
    theme,
    toggle: () => setTheme(theme() === 'light' ? 'dark' : 'light'),
    setTheme: (mode) => setTheme(mode),
  };
}
