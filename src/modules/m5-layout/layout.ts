import { createSignal, onCleanup } from 'solid-js';
import type { LayoutAPI, MobileTab, ViewportMode } from './api';

/** Mobile breakpoint — `max-width: 767px = mobile`（共识 §3 / data-model §4.3 决议）*/
const MOBILE_BREAKPOINT_PX = 767;

function readViewport(): ViewportMode {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'desktop'; // SSR / Node-only env fallback
  }
  try {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches
      ? 'mobile'
      : 'desktop';
  } catch {
    return 'desktop';
  }
}

/**
 * Build a LayoutAPI.
 *
 * Must be called inside a Solid reactive root (createRoot / component) —
 * the matchMedia change subscription registers an onCleanup hook.
 *
 * - `viewport`：matchMedia driven，初始 + change event reactive
 * - `mobileTab`：默认 `'edit'`，**不持久化**（data-model §4.3 决议）
 */
export function createLayout(): LayoutAPI {
  const [viewport, setViewport] = createSignal<ViewportMode>(readViewport());
  const [mobileTab, setMobileTab] = createSignal<MobileTab>('edit');

  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    try {
      const mql = window.matchMedia(
        `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
      );
      const handler = (e: MediaQueryListEvent): void => {
        setViewport(e.matches ? 'mobile' : 'desktop');
      };
      mql.addEventListener('change', handler);
      onCleanup(() => mql.removeEventListener('change', handler));
    } catch {
      // matchMedia 边界异常 — init 值已就位，change 监听放弃
    }
  }

  return {
    viewport,
    mobileTab,
    setMobileTab,
  };
}
