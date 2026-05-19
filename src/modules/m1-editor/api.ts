import type { Accessor } from 'solid-js';
import type { DocumentState } from './state';

export interface EditorAPI {
  readonly text: Accessor<string>;
  setTextFromStorage(initial: string): void;
  clear(): void;
}

export function createEditorAPI(state: DocumentState): EditorAPI {
  return {
    text: state.text,
    setTextFromStorage: (initial) => state.setText(initial),
    clear: () => state.setText(''),
  };
}

export { createDocumentState } from './state';
export type { DocumentState } from './state';
