import { createDeferred, createMemo, For, Show, type Accessor } from 'solid-js';
import type { DocumentState } from './state';
import { createFindController } from './find';
import { FindBar } from './FindBar';
import { FormatToolbar } from './FormatToolbar';
import { applyFormat, continueList, indentSelection } from './commands';
import { countWords, formatWordCount } from './wordcount';
import { t } from '@/modules/m7-i18n/i18n';

export interface EditorAreaProps {
  state: DocumentState;
  /**
   * 行号显示开关（F1.2 / M1 prefs）。省略 = 不显示 gutter（向后兼容旧调用）。
   * 显示时同步关闭软换行（white-space: pre），让行号精确对应逻辑行。
   */
  showLineNumbers?: Accessor<boolean>;
  /** 上抛 textarea 元素（M10 滚动同步用 / v1.7）。省略 = 不上抛。 */
  editorRef?: (el: HTMLTextAreaElement) => void;
}

/**
 * Markdown source textarea，可选行号 gutter；v2.1 编辑增强（ADR-017）：
 *
 * - 双向绑定 `state.text()` ↔ textarea.value
 * - onInput 实时写回 state.setText（M3 持久化模块 debounce 接收）
 * - 关闭浏览器 spellcheck 避免 Markdown 语法红线
 * - showLineNumbers 开时：左侧 gutter 渲染逐行号 + textarea 关软换行；
 *   gutter 自身 overflow:hidden，靠 onScroll 同步 textarea 的 scrollTop。
 * - 〔v2.1〕Cmd/Ctrl+F 容器内拦截唤起查找栏（焦点在编辑面板外不拦，浏览器原生查找可用）；
 *   Cmd/Ctrl+B/I/K 格式 toggle；Enter 列表延续（e.isComposing 守 IME）；
 *   底部 status bar 字数统计。
 *
 * 已知限制（TODO(mvp-scope)）：textarea 关软换行后底部出现横向滚动条，
 *   占用约 1 行高度而 gutter 无横向条，极端长行场景下底部可能差半行；
 *   极简 MVP 接受，行号精确性优先（见 GAP-003 决策 Q1）。
 */
export function EditorArea(props: EditorAreaProps) {
  let gutterRef: HTMLDivElement | undefined;
  let taRef: HTMLTextAreaElement | undefined;

  const find = createFindController(props.state, () => taRef);
  // 字数统计走 deferred（空闲时段更新）—— 大文档单遍扫描 ~4ms/374KB，
  // 不进每键同步输入路径（BHV-008' 家族教训，实测见 wordcount.ts 头注）
  const deferredText = createDeferred(() => props.state.text(), {
    timeoutMs: 300,
  });
  const wordCountText = createMemo(() =>
    formatWordCount(countWords(deferredText()), t),
  );

  const showGutter = () => props.showLineNumbers?.() ?? false;
  const lineCount = createMemo(() => props.state.text().split('\n').length);

  const syncScroll = (
    e: Event & { currentTarget: HTMLTextAreaElement },
  ): void => {
    if (gutterRef) gutterRef.scrollTop = e.currentTarget.scrollTop;
  };

  // v2.4 a11y 逃逸（ADR-020 D1）：Esc 置位 → 下一个 Tab 放行原生焦点移动；其他键复位
  let allowTabOnce = false;

  // v2.1 keydown 编排（容器级捕获 find；textarea 级格式/列表/缩进）
  const onKeyDown = (e: KeyboardEvent): void => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      find.show();
      return;
    }
    if (e.target !== taRef || !taRef) return;
    if (e.key !== 'Tab' && e.key !== 'Escape') allowTabOnce = false;
    if (mod && !e.altKey && !e.shiftKey) {
      const k = e.key.toLowerCase();
      if (k === 'b' || k === 'i' || k === 'k') {
        e.preventDefault();
        applyFormat(taRef, k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'link');
        return;
      }
    }
    if (e.key === 'Tab' && !mod && !e.altKey) {
      if (allowTabOnce) {
        allowTabOnce = false; // 放行一次（原生焦点移动）
        return;
      }
      e.preventDefault();
      indentSelection(taRef, e.shiftKey);
      return;
    }
    if (
      e.key === 'Enter' &&
      !e.isComposing && // IME 守卫（ADR-017 D4）：确认候选词的 Enter 不拦截
      !mod &&
      !e.shiftKey &&
      !e.altKey
    ) {
      if (continueList(taRef)) e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      if (find.open()) find.hide();
      else allowTabOnce = true; // a11y：下一个 Tab 放行
    }
  };

  return (
    <div class="editor-chrome" onKeyDown={onKeyDown}>
      <FindBar find={find} />
      <FormatToolbar editor={() => taRef} />
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
          ref={(el) => {
            taRef = el;
            props.editorRef?.(el);
          }}
          value={props.state.text()}
          onInput={(e) => props.state.setText(e.currentTarget.value)}
          onScroll={syncScroll}
          spellcheck="false"
        />
      </div>
      <div class="editor-status">{wordCountText()}</div>
    </div>
  );
}
