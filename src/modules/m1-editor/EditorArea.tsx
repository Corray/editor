import { createMemo, For, Show, type Accessor } from 'solid-js';
import type { DocumentState } from './state';

export interface EditorAreaProps {
  state: DocumentState;
  /**
   * 行号显示开关（F1.2 / M1 prefs）。省略 = 不显示 gutter（向后兼容旧调用）。
   * 显示时同步关闭软换行（white-space: pre），让行号精确对应逻辑行。
   */
  showLineNumbers?: Accessor<boolean>;
}

/**
 * Markdown source textarea，可选行号 gutter。
 *
 * - 双向绑定 `state.text()` ↔ textarea.value
 * - onInput 实时写回 state.setText（M3 持久化模块 debounce 接收）
 * - 关闭浏览器 spellcheck 避免 Markdown 语法红线
 * - showLineNumbers 开时：左侧 gutter 渲染逐行号 + textarea 关软换行；
 *   gutter 自身 overflow:hidden，靠 onScroll 同步 textarea 的 scrollTop。
 *
 * 已知限制（TODO(mvp-scope)）：textarea 关软换行后底部出现横向滚动条，
 *   占用约 1 行高度而 gutter 无横向条，极端长行场景下底部可能差半行；
 *   极简 MVP 接受，行号精确性优先（见 GAP-003 决策 Q1）。
 */
export function EditorArea(props: EditorAreaProps) {
  let gutterRef: HTMLDivElement | undefined;

  const showGutter = () => props.showLineNumbers?.() ?? false;
  const lineCount = createMemo(() => props.state.text().split('\n').length);

  const syncScroll = (
    e: Event & { currentTarget: HTMLTextAreaElement },
  ): void => {
    if (gutterRef) gutterRef.scrollTop = e.currentTarget.scrollTop;
  };

  return (
    <div
      class="editor-with-gutter"
      classList={{ 'editor-with-gutter--numbered': showGutter() }}
    >
      <Show when={showGutter()}>
        <div
          class="editor-gutter"
          ref={(el) => (gutterRef = el)}
          aria-hidden="true"
        >
          <For each={Array.from({ length: lineCount() }, (_, i) => i + 1)}>
            {(n) => <div class="editor-gutter__line">{n}</div>}
          </For>
        </div>
      </Show>
      <textarea
        class="editor-area"
        classList={{ 'editor-area--nowrap': showGutter() }}
        aria-label="Markdown editor"
        value={props.state.text()}
        onInput={(e) => props.state.setText(e.currentTarget.value)}
        onScroll={syncScroll}
        spellcheck="false"
      />
    </div>
  );
}
