import type { DocumentState } from './state';

export interface EditorAreaProps {
  state: DocumentState;
}

/**
 * Markdown source textarea.
 *
 * - 双向绑定 `state.text()` ↔ textarea.value
 * - onInput 实时写回 state.setText（M3 持久化模块 debounce 接收）
 * - 关闭浏览器 spellcheck 避免 Markdown 语法红线
 */
export function EditorArea(props: EditorAreaProps) {
  return (
    <textarea
      class="editor-area"
      aria-label="Markdown editor"
      value={props.state.text()}
      onInput={(e) => props.state.setText(e.currentTarget.value)}
      spellcheck="false"
    />
  );
}
