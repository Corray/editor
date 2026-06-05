import type { Accessor } from 'solid-js';

export type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'ERROR';

/**
 * M3 持久化对外契约。
 *
 * v1.6（ADR-010 D4）：M3 退化为自动存盘**时机/状态机**，写目标 = M9 active doc
 * （`docManager.saveActiveText`）。初始加载 + 迁移下沉到 M9 `loadInitialDocs`。
 * v1.0 同步 `init()` / v1.1 `loadStoredDocument` 均已移除。
 */
export interface PersistenceAPI {
  readonly status: Accessor<SaveStatus>;
  /** 清空 active doc 内容（保留条目）。删除文档走 M9.remove。 */
  clear(): Promise<void>;
  enable(): void;
  disable(): void;
}

export { createPersistence } from './store';
