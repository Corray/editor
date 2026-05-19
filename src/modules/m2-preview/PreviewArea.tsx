import { createMemo, Show } from 'solid-js';
import type { DocumentState } from '@/modules/m1-editor/state';
import { render } from './pipeline';
import { t } from '@/modules/m7-i18n/i18n';

export interface PreviewAreaProps {
  state: DocumentState;
}

/**
 * Live preview pane.
 *
 * - 空文档 → Solid JSX (textContent path) 显示 placeholder（安全）
 * - 非空 → innerHTML 注入 render() 结果
 * - createMemo 缓存：相同 text 不重新 parse/sanitize
 */
export function PreviewArea(props: PreviewAreaProps) {
  // [SECURITY REVIEW REQUIRED]
  // innerHTML 唯一合法源 = pipeline.render()（已 DOMPurify sanitize；
  // 见 ADR-002 + tests/unit/m2-preview/pipeline.test.ts family-E XSS 矩阵）
  const html = createMemo(() => render(props.state.text()));

  return (
    <div class="preview-pane" aria-label="Preview">
      <Show
        when={props.state.text() !== ''}
        fallback={
          <span class="preview-placeholder">{t('preview.placeholder')}</span>
        }
      >
        {/* [SECURITY REVIEW REQUIRED] innerHTML <- render() (sanitized) */}
        <div class="preview-content" innerHTML={html()} />
      </Show>
    </div>
  );
}
