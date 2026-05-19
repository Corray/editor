/**
 * Imperative singleton toast (api-spec §4.1).
 *
 * TODO(post-mvp): full DOM toast UI (overlay + queue + dismiss anim).
 * MVP stub forwards to console; interface frozen — replacing internal does
 * not require changes in any consumer module.
 */
export type ToastLevel = 'info' | 'warn' | 'error';

export interface ToastAPI {
  show(message: string, level?: ToastLevel, durationMs?: number): void;
}

export const toast: ToastAPI = {
  show(message, level = 'info', _durationMs) {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : console.info;
    fn(`[toast:${level}] ${message}`);
  },
};
