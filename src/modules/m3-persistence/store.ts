import { createSignal, createEffect, on, type Accessor } from 'solid-js';
import { debounce } from './debounce';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import type { PersistenceAPI, SaveStatus } from './api';

const KEY_DOC = 'editor.document.v1';
const KEY_LARGE_NOTICE = 'editor.notice.large-doc.v1';
const DEBOUNCE_MS = 500;
const ERROR_FALLBACK_MS = 5000;
const LARGE_DOC_THRESHOLD = 1_000_000;

/**
 * Module-level static read (does not require a PersistenceAPI instance).
 *
 * Use this from main.tsx **before** creating reactive state, breaking the
 * chicken-and-egg between `init()` and `createPersistence(text)` — see
 * api-spec §3.3.
 */
export function readStoredDocument(): string {
  try {
    return localStorage.getItem(KEY_DOC) ?? '';
  } catch {
    // privacy mode / storage disabled — treat as absent
    return '';
  }
}

/**
 * Build a PersistenceAPI bound to a Solid text signal.
 *
 * State machine per data-model v1.0 §5.2:
 *   IDLE ── text change ──→ DIRTY ── 500ms idle ──→ SAVING ── ok ──→ IDLE
 *                                                          └ err ──→ ERROR ── 5s ──→ IDLE
 *
 * Must be called inside a Solid reactive root (`createRoot` or component).
 */
export function createPersistence(text: Accessor<string>): PersistenceAPI {
  const [status, setStatus] = createSignal<SaveStatus>('IDLE');
  let enabled = true;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  function clearErrorTimer(): void {
    if (errorTimer !== null) {
      clearTimeout(errorTimer);
      errorTimer = null;
    }
  }

  function performWrite(): void {
    if (!enabled) return;
    setStatus('SAVING');
    try {
      localStorage.setItem(KEY_DOC, text());
      setStatus('IDLE');
    } catch {
      // Treat any setItem throw as quota (the only realistic cause).
      setStatus('ERROR');
      toast.show(t('storage.quota'), 'error');
      clearErrorTimer();
      errorTimer = setTimeout(() => {
        errorTimer = null;
        if (status() === 'ERROR') setStatus('IDLE');
      }, ERROR_FALLBACK_MS);
    }
  }

  const debouncedWrite = debounce(performWrite, DEBOUNCE_MS);

  function maybeNotifyLarge(value: string): void {
    if (value.length <= LARGE_DOC_THRESHOLD) return;
    if (localStorage.getItem(KEY_LARGE_NOTICE) === '1') return;
    toast.show(t('doc.large'), 'info', 8000);
    localStorage.setItem(KEY_LARGE_NOTICE, '1');
  }

  // Subscribe to text changes (defer: true skips initial run).
  createEffect(
    on(
      text,
      (current) => {
        if (!enabled) return;
        clearErrorTimer();
        setStatus('DIRTY');
        maybeNotifyLarge(current);
        debouncedWrite();
      },
      { defer: true },
    ),
  );

  return {
    init: () => readStoredDocument(),
    status,
    clear: () => {
      clearErrorTimer();
      debouncedWrite.cancel();
      localStorage.removeItem(KEY_DOC);
      localStorage.removeItem(KEY_LARGE_NOTICE);
      setStatus('IDLE');
    },
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
      debouncedWrite.cancel();
    },
  };
}
