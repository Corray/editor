import { createSignal } from 'solid-js';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import { deriveTitle } from './title';
import { newDocId } from './idPrefix';
import {
  loadInitialDocs,
  putDoc,
  deleteDocRecord,
  setActiveId,
  type DocRecord,
  type InitialDocs,
} from './store';
import type { DocManagerAPI, DocMeta } from './api';
import type { RemoteDoc } from '@/modules/m11-sync/api';

/**
 * 用户操作（create/switchTo/remove/rename）的 store 写是 fire-and-forget（DocList
 * `void m.xxx()`）→ IDB 失败若不接 = 静默吞错（F-V11-3 家族：v1.1 在 M3.clear，
 * v1.6 重构后迁到此处）。包一层 surface：失败 console.error + toast，不静默。
 * 注：saveActiveText **不**走这里——它由 M3 performWrite 的 try/catch 接管（ERROR 态）。
 */
async function guardStore(op: Promise<void>): Promise<void> {
  try {
    await op;
  } catch (err) {
    console.error('[m9] store op failed', err);
    toast.show(t('storage.unavailable'), 'error'); // 复用原死 key（F-V11-5）
  }
}

/**
 * v2.0 同步钩子（M11 在登录态注入；匿名 = undefined，M9 行为不变）。M9 本地持久后
 * 调钩子，由 M11 push 到云（fire-and-forget）。M9 不碰 supabase（解耦 / ADR-013 D2）。
 */
export interface SyncHooks {
  onLocalChange(doc: DocRecord): void;
  onLocalDelete(id: string, updatedAt: number): void;
}

export interface DocManagerDeps {
  initial: InitialDocs;
  /** epoch ms 供给（测试可注入确定值）。 */
  now: () => number;
  /** 把目标文档文本灌入 M1 DocumentState（editor.setTextFromStorage）。 */
  setEditorText: (text: string) => void;
  /** 读当前编辑区文本（切换前 flush 用）。 */
  getEditorText: () => string;
}

const toMeta = (d: DocRecord): DocMeta => ({
  id: d.id,
  title: d.title,
  updatedAt: d.updatedAt,
});
const byRecent = (a: DocRecord, b: DocRecord) => b.updatedAt - a.updatedAt;

export function createDocManager(deps: DocManagerDeps): DocManagerAPI {
  const { now, setEditorText, getEditorText } = deps;
  // 全量 record 缓存（含 text），避免切换时重读 store
  const records = new Map<string, DocRecord>();
  for (const d of deps.initial.docs) records.set(d.id, d);

  // v2.0：同步钩子（M11 登录态注入 / 匿名 = null → 行为不变）
  let syncHooks: SyncHooks | null = null;
  const pushed = (doc: DocRecord) => syncHooks?.onLocalChange(doc);

  const [query, setQuerySignal] = createSignal<string>(''); // v1.8 搜索词（须先于 metaList 首调）
  const [activeId, setActiveSignal] = createSignal<string>(deps.initial.activeId);
  const [docs, setDocs] = createSignal<DocMeta[]>(metaList());

  function metaList(): DocMeta[] {
    const q = query().trim().toLowerCase();
    const all = [...records.values()].sort(byRecent);
    const filtered = q
      ? all.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.text.toLowerCase().includes(q), // v1.8：标题或内容命中（records 含 text）
        )
      : all;
    return filtered.map(toMeta);
  }
  function refresh(): void {
    setDocs(metaList());
  }

  async function saveActiveText(text: string): Promise<void> {
    const id = activeId();
    const rec = records.get(id);
    if (!rec) return;
    if (rec.text === text) return; // no-op（切换灌入同文本 / 无改动）→ 不 bump updatedAt
    const updated: DocRecord = {
      ...rec,
      text,
      // v1.8：手动重命名锁 → 不覆盖手动标题（解 F-V16-2 / ADR-012 D1）
      title: rec.titleManual ? rec.title : deriveTitle(text),
      updatedAt: now(),
    };
    records.set(id, updated);
    refresh();
    await putDoc(updated, true);
    pushed(updated); // v2.0：登录态 → push 到云
  }

  async function rename(id: string, title: string): Promise<void> {
    const rec = records.get(id);
    if (!rec) return;
    const trimmed = title.trim();
    const updated: DocRecord = trimmed
      ? { ...rec, title: trimmed, titleManual: true, updatedAt: now() }
      : // 空 → 回退自动派生（titleManual=false）
        { ...rec, title: deriveTitle(rec.text), titleManual: false, updatedAt: now() };
    records.set(id, updated);
    refresh();
    await guardStore(putDoc(updated, id === activeId())); // F-V11-3：失败不静默
    pushed(updated); // v2.0
  }

  async function activate(id: string): Promise<void> {
    setActiveSignal(id);
    await guardStore(setActiveId(id)); // F-V11-3
    setEditorText(records.get(id)?.text ?? '');
  }

  async function create(initialText = ''): Promise<string> {
    // 先 flush 当前（防丢未存盘的编辑）
    await guardStore(saveActiveText(getEditorText()));
    const ts = now();
    const doc: DocRecord = {
      id: newDocId(),
      title: deriveTitle(initialText),
      text: initialText,
      createdAt: ts,
      updatedAt: ts,
    };
    records.set(doc.id, doc);
    refresh();
    await guardStore(putDoc(doc, true)); // F-V11-3
    pushed(doc); // v2.0
    await activate(doc.id);
    return doc.id;
  }

  async function switchTo(id: string): Promise<void> {
    if (id === activeId()) return;
    if (!records.has(id)) return;
    await guardStore(saveActiveText(getEditorText())); // flush 当前（F-V11-3：fire-and-forget 路径 surface）
    await activate(id);
  }

  async function remove(id: string): Promise<void> {
    if (!records.has(id)) return;
    const wasActive = id === activeId();
    records.delete(id);
    await guardStore(deleteDocRecord(id)); // F-V11-3：删除失败不静默
    syncHooks?.onLocalDelete(id, now()); // v2.0：登录态 → 云端软删 tombstone（防多设备复活）

    if (records.size === 0) {
      // 删到空 → 自动建空 doc（永远 ≥1 / ADR-010 D4）
      const ts = now();
      const doc: DocRecord = {
        id: newDocId(),
        title: deriveTitle(''),
        text: '',
        createdAt: ts,
        updatedAt: ts,
      };
      records.set(doc.id, doc);
      await guardStore(putDoc(doc, true)); // F-V11-3
      refresh();
      await activate(doc.id);
      return;
    }
    refresh();
    if (wasActive) {
      // 切到最新
      const next = [...records.values()].sort(byRecent)[0]!;
      await activate(next.id);
    }
  }

  function setQuery(q: string): void {
    setQuerySignal(q);
    refresh();
  }

  // v2.0：M11 登录态注入同步钩子；登出传 null（恢复匿名行为）
  function setSyncHooks(hooks: SyncHooks | null): void {
    syncHooks = hooks;
  }

  /** 远端 → 本地记录（titleManual 启发式：title≠自动派生 → 视为手动，保住跨设备重命名）。 */
  function fromRemote(r: RemoteDoc): DocRecord {
    return {
      id: r.id,
      title: r.title,
      text: r.text,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      titleManual: r.title !== deriveTitle(r.text),
    };
  }

  /**
   * 合并云端 doc（pull / 首登并集，ADR-015 D3/D5）。per-doc LWW + 软删 tombstone。
   * 返回 toPush（本地权威、需推云的 doc：云端无 或 本地更新）。
   * active doc 的编辑区**不**在此覆盖（避免 clobber 进行中编辑）；仅 active 被远端删时切换。
   */
  async function mergeRemote(remote: RemoteDoc[]): Promise<DocRecord[]> {
    const remoteById = new Map(remote.map((r) => [r.id, r] as const));
    const adopted: DocRecord[] = []; // 远端胜 → 需落本地 IndexedDB
    for (const r of remote) {
      const local = records.get(r.id);
      if (r.deleted) {
        if (local && r.updatedAt >= local.updatedAt) records.delete(r.id); // tombstone 胜 → 删本地
        continue; // 本地无 → 不加（防复活）
      }
      if (!local || r.updatedAt > local.updatedAt) {
        const rec = fromRemote(r); // 云胜/仅云 → 采纳
        records.set(r.id, rec);
        adopted.push(rec);
      }
    }
    // toPush：本地权威（云端无该 id，或本地更新于云）
    const toPush: DocRecord[] = [];
    for (const local of records.values()) {
      const r = remoteById.get(local.id);
      if (!r || (!r.deleted && local.updatedAt > r.updatedAt)) toPush.push(local);
    }
    // active 失效（被远端删）→ 修正（永远 ≥1 / 编辑区跟随）
    if (!records.has(activeId())) {
      if (records.size === 0) {
        const ts = now();
        const doc: DocRecord = {
          id: newDocId(),
          title: deriveTitle(''),
          text: '',
          createdAt: ts,
          updatedAt: ts,
        };
        records.set(doc.id, doc);
        toPush.push(doc);
        await guardStore(putDoc(doc, true));
        await activate(doc.id);
      } else {
        await activate([...records.values()].sort(byRecent)[0]!.id);
      }
    }
    // 持久化采纳的远端 doc 到本地 IndexedDB
    for (const rec of adopted) await guardStore(putDoc(rec, rec.id === activeId()));
    refresh();
    return toPush;
  }

  return {
    docs,
    activeId,
    query,
    setQuery,
    saveActiveText,
    create,
    switchTo,
    remove,
    rename,
    setSyncHooks,
    mergeRemote,
  };
}
