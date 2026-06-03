import type { Accessor } from 'solid-js';

export type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'ERROR';

/**
 * M3 持久化对外契约（v1.1 异步 / api-spec v1.1）。
 *
 * v1.0 的同步 `init(): string` 已移除 —— IndexedDB 异步化（ADR-005 D2）。
 * 初始文档改由模块级 {@link loadStoredDocument} 异步加载（含一次性迁移）。
 */
export interface PersistenceAPI {
  readonly status: Accessor<SaveStatus>;
  /** 清空：删 IDB 文档 + 遗留 localStorage 旧 key。异步（IDB delete）。 */
  clear(): Promise<void>;
  enable(): void;
  disable(): void;
}

export { createPersistence, loadStoredDocument } from './store';
