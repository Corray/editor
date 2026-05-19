import type { Accessor } from 'solid-js';

export type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'ERROR';

export interface PersistenceAPI {
  init(): string;
  readonly status: Accessor<SaveStatus>;
  clear(): void;
  enable(): void;
  disable(): void;
}

export { createPersistence, readStoredDocument } from './store';
