import { createMemo, createSignal, createEffect, Show } from 'solid-js';
import type { DocumentState } from '@/modules/m1-editor/state';
import {
  render,
  hasMath,
  ensureKatex,
  katexReady,
  ensureMermaid,
  renderMermaid,
} from './pipeline';
import { t } from '@/modules/m7-i18n/i18n';

export interface PreviewAreaProps {
  state: DocumentState;
  /** 上抛预览滚动容器（.preview-pane）（M10 滚动同步用 / v1.7）。 */
  scrollRef?: (el: HTMLElement) => void;
}

/**
 * Live preview pane.
 *
 * - 空文档 → Solid JSX (textContent path) 显示 placeholder（安全）
 * - 非空 → innerHTML 注入 render() 结果
 */
export function PreviewArea(props: PreviewAreaProps) {
  // [SECURITY REVIEW REQUIRED]
  // innerHTML 唯一合法源 = pipeline.render()（已 DOMPurify sanitize；ADR-002）。
  // v1.3 KaTeX 懒加载：含公式且未载 → 一次性 import → bump katexVer 触发重算。
  const [katexVer, setKatexVer] = createSignal(0);
  const html = createMemo(() => {
    katexVer();
    const text = props.state.text();
    if (hasMath(text) && !katexReady()) {
      void ensureKatex().then(() => setKatexVer((v) => v + 1));
    }
    return render(text);
  });

  // v1.4 Mermaid 异步编排（ADR-008 D3）：render 出占位 → 此处懒加载 + 逐块异步渲染
  // → 替换。代次令牌防竞态（渲染期间文本又变 → 丢弃过期结果，不串图）。
  let contentRef: HTMLDivElement | undefined;
  let gen = 0;
  createEffect(() => {
    const h = html(); // dep：每次内容变重跑
    const myGen = ++gen; // 代次令牌
    if (!h.includes('mermaid-pending')) return;
    const theme =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.theme === 'dark'
        ? 'dark'
        : 'default';
    queueMicrotask(async () => {
      const root = contentRef;
      if (!root || gen !== myGen) return; // innerHTML 已更新后再查；过期则退
      const pendings = [...root.querySelectorAll('.mermaid-pending')];
      if (pendings.length === 0) return;
      try {
        await ensureMermaid(theme);
      } catch {
        return; // mermaid 加载失败 → 占位保留（不崩）
      }
      for (const el of pendings) {
        if (gen !== myGen) return; // 竞态：文本已变，丢弃
        const src = el.textContent ?? ''; // 源文 = 占位的文本内容
        let svg: string;
        try {
          svg = await renderMermaid(src);
        } catch {
          if (gen !== myGen) return;
          el.textContent = t('mermaid.error'); // 单块失败降级（不影响其余）
          el.classList.add('mermaid-error');
          continue;
        }
        if (gen !== myGen) return;
        const tpl = document.createElement('div');
        tpl.innerHTML = svg; // svg 已在 renderMermaid 内 DOMPurify sanitize
        el.replaceWith(...Array.from(tpl.childNodes));
      }
    });
  });

  return (
    <div
      class="preview-pane"
      aria-label="Preview"
      ref={(el) => props.scrollRef?.(el)}
    >
      <Show
        when={props.state.text() !== ''}
        fallback={
          <span class="preview-placeholder">{t('preview.placeholder')}</span>
        }
      >
        {/* [SECURITY REVIEW REQUIRED] innerHTML <- render() (sanitized) */}
        <div
          class="preview-content"
          ref={(el) => (contentRef = el)}
          innerHTML={html()}
        />
      </Show>
    </div>
  );
}
