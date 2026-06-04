import { createSignal, createEffect, on, type Accessor } from 'solid-js';
import { openDB, type IDBPDatabase } from 'idb';
import { debounce } from './debounce';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import type { PersistenceAPI, SaveStatus } from './api';

/**
 * M3 持久化 — IndexedDB 后端（ADR-005 / data-model v1.1）。
 *
 * - 主后端 IndexedDB（DB `editor` v1 / store `kv` / key `document`）
 * - IDB 不可用（隐私模式 / 老浏览器）→ 降级 localStorage（共识 TBD-v11-3）
 * - 首次加载迁移旧 `editor.document.v1` → IDB（先写后删幂等，TBD-v11-2）
 * - 状态机 IDLE/DIRTY/SAVING/ERROR 保留（SAVING 现为真异步态）
 */
const DB_NAME = 'editor';
const DB_VERSION = 1;
const STORE = 'kv';
const DOC_KEY = 'document';

const LEGACY_DOC_KEY = 'editor.document.v1';
const LEGACY_NOTICE_KEY = 'editor.notice.large-doc.v1';

const DEBOUNCE_MS = 500;
const ERROR_FALLBACK_MS = 5000;

// --- IDB 连接（lazy + memoized）+ 可用性探测 ---
let dbPromise: Promise<IDBPDatabase> | null = null;
let idbUnavailable = false;
let degradedNotified = false;

function openEditorDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

/** 取 IDB；不可用（无 API / open 抛错，如 Firefox 隐私模式）→ null（调用方降级 localStorage）。 */
async function tryGetDb(): Promise<IDBPDatabase | null> {
  if (idbUnavailable) return null;
  if (typeof indexedDB === 'undefined') {
    idbUnavailable = true;
    return null;
  }
  try {
    return await openEditorDb();
  } catch {
    idbUnavailable = true;
    dbPromise = null;
    return null;
  }
}

function notifyDegradedOnce(): void {
  if (degradedNotified) return;
  degradedNotified = true;
  toast.show(t('storage.degraded'), 'warn');
}

// --- localStorage fallback / legacy helpers ---
/** raw 读（key 缺失 = null，用于区分"无旧数据"与"空字符串"）。 */
function lsGetRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // best-effort
  }
}

/**
 * 异步加载初始文档（替代 v1.0 同步 readStoredDocument）。
 * 顺带跑一次性迁移（旧 localStorage → IDB，先写后删幂等）。
 * 失败链：IDB 不可用 / 读错 → localStorage fallback → ''。
 */
export async function loadStoredDocument(): Promise<string> {
  const db = await tryGetDb();
  if (!db) {
    notifyDegradedOnce();
    return lsGetRaw(LEGACY_DOC_KEY) ?? '';
  }

  // 读 IDB 文档。读**失败**（IDB 可用但 get throw）是异象，不能静默当空——否则
  // 显空 → 用户编辑 → write-back 覆盖 IDB 中仍在的旧文档 = 真数据丢失（F-V11-1）。
  // 故 log + toast 告知"加载失败请刷新"，不裸吞（arch-constraints §8/§9）。
  let existing: unknown;
  try {
    existing = await db.get(STORE, DOC_KEY);
  } catch (err) {
    console.error('[persistence] IndexedDB read failed', err);
    toast.show(t('storage.loadError'), 'warn');
    return lsGetRaw(LEGACY_DOC_KEY) ?? '';
  }
  if (typeof existing === 'string') return existing; // 已迁移 / 已有，幂等跳过

  // IDB 空 → 迁移旧 localStorage（仅当 key 存在）
  const legacy = lsGetRaw(LEGACY_DOC_KEY);
  if (legacy === null) return ''; // 新用户
  try {
    await db.put(STORE, legacy, DOC_KEY); // 先写新
    // put resolve = 写成功确认 → 删旧（不可逆前确认）
    lsRemove(LEGACY_DOC_KEY);
    lsRemove(LEGACY_NOTICE_KEY);
  } catch (err) {
    // 迁移 put 失败 → 不删旧 key（数据不丢）；返回旧值，下次加载重试迁移
    console.error('[persistence] migration put failed', err);
  }
  return legacy;
}

/**
 * 构建 PersistenceAPI（异步后端）。须在 Solid reactive root 内调用。
 *
 * 状态机（data-model v1.0 §5.2，SAVING 现为真异步态）：
 *   IDLE ─text→ DIRTY ─500ms→ SAVING ─ok→ IDLE
 *                                    └err→ ERROR ─5s→ IDLE
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
    const value = text();
    try {
      const db = await tryGetDb();
      if (db) {
        await db.put(STORE, value, DOC_KEY);
      } else {
        notifyDegradedOnce();
        localStorage.setItem(LEGACY_DOC_KEY, value); // fallback（可能抛 quota）
      }
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
    clear: async () => {
      clearErrorTimer();
      debouncedWrite.cancel();
      try {
        const db = await tryGetDb();
        if (db) await db.delete(STORE, DOC_KEY);
      } catch {
        // best-effort；fallback / 遗留 key 仍清理
      }
      lsRemove(LEGACY_DOC_KEY);
      lsRemove(LEGACY_NOTICE_KEY);
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
