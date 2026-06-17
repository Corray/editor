import { For } from 'solid-js';
import { t } from '@/modules/m7-i18n/i18n';
import {
  applyFormat,
  toggleLinePrefix,
  wrapCodeBlock,
  insertTable,
} from './commands';

export interface FormatToolbarProps {
  /** 取当前 textarea（EditorArea 持 taRef）；undefined 时按钮 no-op。 */
  editor: () => HTMLTextAreaElement | undefined;
}

type Btn = { key: string; label: string; run: (ta: HTMLTextAreaElement) => void };

/**
 * Markdown 格式工具栏（v2.7 / ADR-023 D4）。编辑区顶部常驻，移动端横滚。
 * 8 按钮 → applyFormat / toggleLinePrefix / wrapCodeBlock；点击后回焦编辑器保持流。
 * 所有操作经 commands → replaceRange（undo 保持 / AC-v27-6）。
 */
export function FormatToolbar(props: FormatToolbarProps) {
  // glyph 用 Unicode 字符避免额外图标依赖；aria-label/title 走 i18n
  const buttons: Btn[] = [
    { key: 'bold', label: 'B', run: (ta) => applyFormat(ta, 'bold') },
    { key: 'italic', label: 'I', run: (ta) => applyFormat(ta, 'italic') },
    { key: 'code', label: '<>', run: (ta) => applyFormat(ta, 'code') },
    { key: 'link', label: '🔗', run: (ta) => applyFormat(ta, 'link') },
    { key: 'quote', label: '"', run: (ta) => toggleLinePrefix(ta, 'quote') },
    { key: 'ul', label: '•', run: (ta) => toggleLinePrefix(ta, 'ul') },
    { key: 'ol', label: '1.', run: (ta) => toggleLinePrefix(ta, 'ol') },
    { key: 'codeblock', label: '{ }', run: (ta) => wrapCodeBlock(ta) },
    { key: 'table', label: '⊞', run: (ta) => insertTable(ta) },
  ];

  const onClick = (run: Btn['run']) => {
    const ta = props.editor();
    if (!ta) return;
    run(ta);
    ta.focus(); // 回焦保持编辑流（applyFormat 内部已 focus，行前缀/围栏未必）
  };

  return (
    <div class="format-toolbar" role="toolbar" aria-label={t('fmt.toolbar')}>
      <For each={buttons}>
        {(b) => (
          <button
            type="button"
            class="format-toolbar__btn"
            classList={{ [`format-toolbar__btn--${b.key}`]: true }}
            aria-label={t(`fmt.${b.key}`)}
            title={t(`fmt.${b.key}`)}
            // mousedown preventDefault：避免点击按钮夺走 textarea 焦点 → selection 丢失
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onClick(b.run)}
          >
            {b.label}
          </button>
        )}
      </For>
    </div>
  );
}
