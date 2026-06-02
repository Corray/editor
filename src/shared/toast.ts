/**
 * Singleton toast (api-spec §4.1) — real DOM UI (#14 API-T-001).
 *
 * Replaces the MVP console stub with a lazy-mounted overlay: each `show()`
 * injects a `.toast` into a `.toast-container` on <body>, auto-dismissing
 * after `durationMs`. No dependency; vanilla DOM so it works as a plain
 * singleton imported from any module (no Solid reactive root needed).
 *
 * Interface unchanged (frozen since #2) — consumers (M3 quota / doc.large,
 * M4 clipboard) keep calling `toast.show(msg, level, durationMs?)` untouched.
 * In a non-DOM env (SSR / tests without document) it degrades to a no-op.
 */
export type ToastLevel = 'info' | 'warn' | 'error';

export interface ToastAPI {
  show(message: string, level?: ToastLevel, durationMs?: number): void;
}

const DEFAULT_MS = 3000;
const LEAVE_MS = 200; // keep in sync with .toast--leaving animation duration

let container: HTMLElement | null = null;

/** Lazily (re)create the toast container under <body>. */
function ensureContainer(): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'toast-container';
    // announce non-intrusively to assistive tech
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export const toast: ToastAPI = {
  show(message, level = 'info', durationMs = DEFAULT_MS) {
    const root = ensureContainer();
    if (!root) return; // non-DOM env — no-op

    const el = document.createElement('div');
    el.className = `toast toast--${level}`;
    el.textContent = message;
    root.appendChild(el);

    window.setTimeout(() => {
      el.classList.add('toast--leaving');
      window.setTimeout(() => el.remove(), LEAVE_MS);
    }, durationMs);
  },
};
