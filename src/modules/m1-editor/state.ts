import { createSignal, type Accessor, type Setter } from 'solid-js';

/**
 * SoT (Single Source of Truth) for Markdown document text.
 *
 * `setText` is internal — EditorArea uses it on input; outside the module,
 * write access is mediated by EditorAPI ({ setTextFromStorage, clear }).
 */
export interface DocumentState {
  text: Accessor<string>;
  setText: Setter<string>;
}

export function createDocumentState(initial = ''): DocumentState {
  const [text, setText] = createSignal<string>(initial);
  return { text, setText };
}
