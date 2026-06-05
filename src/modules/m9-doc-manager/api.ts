import type { Accessor } from 'solid-js';

/** 文档列表项（不含 text，UI 列表用）。 */
export interface DocMeta {
  id: string; // D_<uuid>
  title: string; // 自动派生
  updatedAt: number;
}

/**
 * M9 文档管理对外契约（api-spec v1.6 / ADR-010 D4）。
 * 拥有 documents store 唯一写权；M3 经 saveActiveText 间接写。
 */
export interface DocManagerAPI {
  readonly docs: Accessor<DocMeta[]>; // v1.8：按 query 过滤后（updatedAt desc）
  readonly activeId: Accessor<string>;
  readonly query: Accessor<string>; // v1.8：当前搜索词
  /** v1.8：设搜索词（实时过滤 docs()，空=全部；匹配 title 或 text）。 */
  setQuery(q: string): void;
  /** 保存 active doc 文本（M3 debounce 后调用）；no-op 若文本未变；titleManual 时不派生标题。 */
  saveActiveText(text: string): Promise<void>;
  /** 新建（空或带初始内容 import/open-shared），切为 active，返回 id。 */
  create(initialText?: string): Promise<string>;
  /** 切换 active：flush 当前 → 灌入目标 text → 持久 activeId。 */
  switchTo(id: string): Promise<void>;
  /** 删除；删 active 切最新；删到空建空 doc（永远 ≥1）。 */
  remove(id: string): Promise<void>;
  /** v1.8：手动重命名（非空→锁 titleManual；空→回退自动派生）。 */
  rename(id: string, title: string): Promise<void>;
}

export { createDocManager } from './manager';
export { loadInitialDocs } from './store';
export type { DocRecord, InitialDocs } from './store';
