import { openDB, type IDBPDatabase } from 'idb';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import { newDocId } from './idPrefix';
import { deriveTitle } from './title';

/**
 * M9 storage — IndexedDB `documents` store + 单→多迁移（ADR-010 / data-model v1.6）。
 *
 * - DB `editor` v2：store `kv`（含 `activeDocId`）+ store `documents`（keyPath `id`）
 * - 第三次迁移：v1.1 单 `kv/document` → `documents/D_*`（先写后删幂等）
 * - IDB 不可用（隐私模式）→ 降级单文档 localStorage（保 v1.1 契约；多文档功能 IDB-only）
 */
export interface DocRecord {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  /** v1.8：手动重命名锁。true=用户改过名，saveActiveText 不再自动派生标题。
   *  缺省/false=自动派生（旧记录无此字段 → 兼容自动 / ADR-012 D1）。 */
  titleManual?: boolean;
}

/** v2.6：文档版本快照（ADR-022 / data-model v2.6）。immutable。 */
export interface SnapRecord {
  id: string; // SN_<uuid>
  docId: string; // D_<uuid>（index byDoc）
  title: string;
  text: string;
  createdAt: number; // epoch ms（排序键 + auto 间隔判定）
  kind: 'auto' | 'manual' | 'restore';
}

const DB_NAME = 'editor';
const DB_VERSION = 3; // v2.6：+snapshots store（additive）
const KV = 'kv';
const DOCS = 'documents';
const SNAPS = 'snapshots';
const SNAP_BY_DOC = 'byDoc';
const ACTIVE_KEY = 'activeDocId';
const LEGACY_SINGLE_KEY = 'document'; // v1.1 kv 单 doc key
const LEGACY_LS_KEY = 'editor.document.v1'; // v1.0 localStorage（degrade 用）

/** v2.6：每文档快照上限，FIFO 删最旧（ADR-022 D3）。 */
export const MAX_SNAPSHOTS_PER_DOC = 30;
/** v2.6：自动快照最小间隔（ADR-022 D2）。 */
export const AUTO_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;

let dbPromise: Promise<IDBPDatabase> | null = null;
let idbUnavailable = false;
let degradedNotified = false;

function openEditorDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1 && !db.objectStoreNames.contains(KV)) {
          db.createObjectStore(KV); // fresh install
        }
        if (oldVersion < 2 && !db.objectStoreNames.contains(DOCS)) {
          db.createObjectStore(DOCS, { keyPath: 'id' });
        }
        // v2.6（ADR-022 D1）：additive —— 不读不改 kv/documents，零数据迁移
        if (oldVersion < 3 && !db.objectStoreNames.contains(SNAPS)) {
          const s = db.createObjectStore(SNAPS, { keyPath: 'id' });
          s.createIndex(SNAP_BY_DOC, 'docId');
        }
      },
    });
  }
  return dbPromise;
}

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

export function isIdbUnavailable(): boolean {
  return idbUnavailable;
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, v: string): void {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* quota — best effort */
  }
}
function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* best effort */
  }
}

function makeDoc(text: string, now: number): DocRecord {
  return {
    id: newDocId(),
    title: deriveTitle(text),
    text,
    createdAt: now,
    updatedAt: now,
  };
}

export interface InitialDocs {
  docs: DocRecord[];
  activeId: string;
}

/**
 * 启动加载：迁移 + 返回全量 docs + activeId。永远 ≥1 篇（ADR-010 D4）。
 * `now` 由调用方注入（测试可控；避免模块内直接 Date.now 便于确定性测试）。
 */
export async function loadInitialDocs(now: number): Promise<InitialDocs> {
  const db = await tryGetDb();
  if (!db) {
    notifyDegradedOnce();
    // 降级：单文档（localStorage legacy）；多文档 IDB-only
    const legacy = lsGet(LEGACY_LS_KEY) ?? '';
    const doc = makeDoc(legacy, now);
    return { docs: [doc], activeId: doc.id };
  }

  let docs: DocRecord[];
  try {
    docs = (await db.getAll(DOCS)) as DocRecord[];
  } catch (err) {
    console.error('[m9] documents getAll failed', err);
    toast.show(t('storage.loadError'), 'warn');
    const doc = makeDoc('', now);
    return { docs: [doc], activeId: doc.id };
  }

  if (docs.length > 0) {
    // 已是多文档（幂等跳过迁移）
    const stored = (await db.get(KV, ACTIVE_KEY)) as string | undefined;
    const activeId =
      stored && docs.some((d) => d.id === stored)
        ? stored
        : [...docs].sort((a, b) => b.updatedAt - a.updatedAt)[0]!.id;
    return { docs, activeId };
  }

  // documents 空 → 迁移旧单 doc（先写后删）。来源两路（兼容跳版升级）：
  //   v1.1 单 doc `kv/document`，或 v1.0 直跳 v1.6 残留的 localStorage `editor.document.v1`
  const idbLegacy = (await db.get(KV, LEGACY_SINGLE_KEY)) as string | undefined;
  const legacy = idbLegacy ?? lsGet(LEGACY_LS_KEY) ?? undefined;
  if (typeof legacy === 'string') {
    const doc = makeDoc(legacy, now);
    await db.put(DOCS, doc);
    await db.put(KV, doc.id, ACTIVE_KEY);
    await db.delete(KV, LEGACY_SINGLE_KEY); // 确认写成功后删旧（两路都清）
    lsRemove(LEGACY_LS_KEY);
    return { docs: [doc], activeId: doc.id };
  }

  // 新用户 → 建一个空首篇
  const doc = makeDoc('', now);
  await db.put(DOCS, doc);
  await db.put(KV, doc.id, ACTIVE_KEY);
  return { docs: [doc], activeId: doc.id };
}

/** 持久化一条 doc（put）。IDB 不可用 → 降级写 active 单文档到 localStorage。 */
export async function putDoc(doc: DocRecord, isActive: boolean): Promise<void> {
  const db = await tryGetDb();
  if (!db) {
    if (isActive) lsSet(LEGACY_LS_KEY, doc.text);
    return;
  }
  await db.put(DOCS, doc);
}

export async function deleteDocRecord(id: string): Promise<void> {
  const db = await tryGetDb();
  if (!db) return;
  await db.delete(DOCS, id);
}

export async function setActiveId(id: string): Promise<void> {
  const db = await tryGetDb();
  if (!db) return;
  await db.put(KV, id, ACTIVE_KEY);
}

// —— v2.6 版本快照（ADR-022 / snapshots store）——

/**
 * 存快照 + prune（超 MAX_SNAPSHOTS_PER_DOC → FIFO 删最旧 createdAt / ADR-022 D3）。
 * 降级（IDB 不可用）→ no-op（快照纯本地，无 localStorage 降级）。
 */
export async function putSnapshot(
  rec: SnapRecord,
  maxPerDoc: number = MAX_SNAPSHOTS_PER_DOC, // v2.9：上限参数化（默认向后兼容 / ADR-025 D2）
): Promise<void> {
  const db = await tryGetDb();
  if (!db) return;
  await db.put(SNAPS, rec);
  // prune：取该文档全部，超上限删最旧
  const all = (await db.getAllFromIndex(
    SNAPS,
    SNAP_BY_DOC,
    rec.docId,
  )) as SnapRecord[];
  if (all.length > maxPerDoc) {
    const byOldest = all.sort((a, b) => a.createdAt - b.createdAt);
    const excess = byOldest.slice(0, all.length - maxPerDoc);
    for (const s of excess) await db.delete(SNAPS, s.id);
  }
}

/** 列某文档快照（createdAt desc）。降级 → []。 */
export async function listSnapshotsByDoc(
  docId: string,
): Promise<SnapRecord[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const all = (await db.getAllFromIndex(
    SNAPS,
    SNAP_BY_DOC,
    docId,
  )) as SnapRecord[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/** 删某文档全部快照（cascade / ADR-022 D3）。降级 → no-op。 */
export async function deleteSnapshotsByDoc(docId: string): Promise<void> {
  const db = await tryGetDb();
  if (!db) return;
  const keys = await db.getAllKeysFromIndex(SNAPS, SNAP_BY_DOC, docId);
  for (const k of keys) await db.delete(SNAPS, k);
}

/** 该文档最近一张快照 createdAt（auto 间隔判定）；无 / 降级 → null。 */
export async function latestSnapshotAt(docId: string): Promise<number | null> {
  const snaps = await listSnapshotsByDoc(docId);
  return snaps.length > 0 ? snaps[0]!.createdAt : null;
}

/** 取单张快照（恢复用）。降级 → null。 */
export async function getSnapshot(id: string): Promise<SnapRecord | null> {
  const db = await tryGetDb();
  if (!db) return null;
  return ((await db.get(SNAPS, id)) as SnapRecord | undefined) ?? null;
}
