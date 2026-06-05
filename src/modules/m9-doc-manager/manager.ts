import { createSignal } from 'solid-js';
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
    await putDoc(updated, id === activeId());
  }

  async function activate(id: string): Promise<void> {
    setActiveSignal(id);
    await setActiveId(id);
    setEditorText(records.get(id)?.text ?? '');
  }

  async function create(initialText = ''): Promise<string> {
    // 先 flush 当前（防丢未存盘的编辑）
    await saveActiveText(getEditorText());
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
    await putDoc(doc, true);
    await activate(doc.id);
    return doc.id;
  }

  async function switchTo(id: string): Promise<void> {
    if (id === activeId()) return;
    if (!records.has(id)) return;
    await saveActiveText(getEditorText()); // flush 当前
    await activate(id);
  }

  async function remove(id: string): Promise<void> {
    if (!records.has(id)) return;
    const wasActive = id === activeId();
    records.delete(id);
    await deleteDocRecord(id);

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
      await putDoc(doc, true);
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
  };
}
