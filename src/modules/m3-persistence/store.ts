import { createSignal, createEffect, on, type Accessor } from 'solid-js';
import { debounce } from './debounce';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import type { PersistenceAPI, SaveStatus } from './api';
import type { DocManagerAPI } from '@/modules/m9-doc-manager/api';

/**
 * M3 持久化 — 自动存盘**时机/状态机**（v1.6 / ADR-010 D4）。
 *
 * v1.6 起 M3 不再直接碰 IndexedDB —— **单 store 单写者**：documents store 由
 * M9 独占写。M3 只负责：text 变更 → debounce 500ms → `docManager.saveActiveText`，
 * 并维护状态机 IDLE/DIRTY/SAVING/ERROR。IDB 可用性/迁移/降级均下沉到 M9。
 *
 * 状态机（data-model v1.0 §5.2）：
 *   IDLE ─text→ DIRTY ─500ms→ SAVING ─ok→ IDLE
 *                                    └err→ ERROR ─5s→ IDLE
 */
const DEBOUNCE_MS = 500;
const ERROR_FALLBACK_MS = 5000;

export function createPersistence(
  text: Accessor<string>,
  docManager: DocManagerAPI,
): PersistenceAPI {
  const [status, setStatus] = createSignal<SaveStatus>('IDLE');
  let enabled = true;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  function clearErrorTimer(): void {
    if (errorTimer !== null) {
      clearTimeout(errorTimer);
      errorTimer = null;
    }
  }

  function enterError(): void {
    setStatus('ERROR');
    toast.show(t('storage.quota'), 'error');
    clearErrorTimer();
    errorTimer = setTimeout(() => {
      errorTimer = null;
      if (status() === 'ERROR') setStatus('IDLE');
    }, ERROR_FALLBACK_MS);
  }

  async function performWrite(): Promise<void> {
    if (!enabled) return;
    setStatus('SAVING');
    try {
      await docManager.saveActiveText(text()); // M9 独占写 documents store
      setStatus('IDLE');
    } catch {
      enterError();
    }
  }

  const debouncedWrite = debounce(performWrite, DEBOUNCE_MS);

  createEffect(
    on(
      text,
      () => {
        if (!enabled) return;
        clearErrorTimer();
        setStatus('DIRTY');
        debouncedWrite();
      },
      { defer: true },
    ),
  );

  return {
    status,
    // clear = 清空 active doc 内容（保留条目 / ADR-010 D6）；删除文档走 M9.remove
    clear: async () => {
      clearErrorTimer();
      debouncedWrite.cancel();
      try {
        await docManager.saveActiveText('');
        setStatus('IDLE');
      } catch {
        enterError();
      }
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
