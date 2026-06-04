import { createMemo, createSignal, Show } from 'solid-js';
import type { DocumentState } from '@/modules/m1-editor/state';
import { render, hasMath, ensureKatex, katexReady } from './pipeline';
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
  //
  // v1.3 KaTeX 懒加载（ADR-007 D3）：含公式且插件未载 → 触发一次性 import，
  // load 完 bump katexVer → memo 重算 → 公式从 raw 闪现为渲染态（仅首次）。
  const [katexVer, setKatexVer] = createSignal(0);
  const html = createMemo(() => {
    katexVer(); // reactive dep：katex 加载完后 bump 触发重算
    const text = props.state.text();
    if (hasMath(text) && !katexReady()) {
      void ensureKatex().then(() => setKatexVer((v) => v + 1));
    }
    return render(text);
  });

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
