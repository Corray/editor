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

export { createEditorPrefs, FONT_SIZE_PRESETS } from './prefs';
export type { EditorPrefsAPI } from './prefs';

// v2.1 编辑增强（ADR-017）
export { createFindController } from './find';
export type { FindControllerAPI } from './find';
export {
  applyFormat,
  continueList,
  indentSelection,
  toggleLinePrefix,
  wrapCodeBlock,
  insertTable,
  tableCellNav,
  isTableRow,
} from './commands';
export type { FormatKind, LinePrefixKind } from './commands';
export { countWords, formatWordCount } from './wordcount';
export type { WordCount } from './wordcount';
