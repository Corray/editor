import {
  createMemo,
  createSignal,
  createEffect,
  onCleanup,
  Show,
} from 'solid-js';
import type { DocumentState } from '@/modules/m1-editor/state';
import {
  render,
  hasMath,
  ensureKatex,
  katexReady,
  ensureMermaid,
  renderMermaid,
  hasMermaid,
  hasCode,
  ensureHighlight,
  highlightReady,
  toggleTaskAtLine,
} from './pipeline';
import { t } from '@/modules/m7-i18n/i18n';

export interface PreviewAreaProps {
  state: DocumentState;
  /** 上抛预览滚动容器（.preview-pane）（M10 滚动同步用 / v1.7）。 */
  scrollRef?: (el: HTMLElement) => void;
}

/**
 * 大文档预览渲染防抖（perf / BHV-008 实测反哺 2026-06-09）。
 *
 * `render()`（markdown-it + DOMPurify）耗时随文本体量增长（实测 dev 100KB ~300ms /
 * 一帧 16ms 在 ~10KB 处被突破）。每键同步全量重渲染会**阻塞 textarea 输入**。
 * 策略：小文档立即渲染（无感）；大文档 / 含 mermaid 走 trailing-debounce ——
 * 连续输入期间不渲染，停顿 DEBOUNCE_MS 后渲染一次，输入保持流畅。
 * 含 mermaid 也防抖：顺带消除「每键占位 → SVG」闪烁 + 重复异步渲染 CPU 浪费（F-V14-1）。
 */
const PREVIEW_DEBOUNCE_MS = 120;
const PREVIEW_DEBOUNCE_THRESHOLD = 10_000;

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
  // v2.3 highlight.js 懒加载（ADR-019，katexVer 同构）。
  const [hlVer, setHlVer] = createSignal(0);

  // 防抖渲染源：renderText 跟随 state.text()，但大文档 / 含 mermaid 时延迟到输入停顿。
  // textarea 仍即时响应（输入处理廉价）；仅昂贵的 render() 被推迟。
  const [renderText, setRenderText] = createSignal(props.state.text());
  let debTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const text = props.state.text();
    if (text.length < PREVIEW_DEBOUNCE_THRESHOLD && !hasMermaid(text)) {
      clearTimeout(debTimer); // 小文档 → 立即（取消任何挂起的防抖）
      setRenderText(text);
      return;
    }
    clearTimeout(debTimer);
    debTimer = setTimeout(() => setRenderText(text), PREVIEW_DEBOUNCE_MS);
  });
  onCleanup(() => clearTimeout(debTimer));

  const html = createMemo(() => {
    katexVer();
    hlVer();
    const text = renderText();
    if (hasMath(text) && !katexReady()) {
      void ensureKatex().then(() => setKatexVer((v) => v + 1));
    }
    if (hasCode(text) && !highlightReady()) {
      void ensureHighlight().then(() => setHlVer((v) => v + 1));
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

  // v3.1（ADR-027 D3）：task list checkbox 点击委托 → 翻转源行 → setText（单一数据源）。
  // preventDefault 撤销原生 toggle，真值由重渲染驱动；持久化经 M3。
  const onPreviewClick = (e: MouseEvent): void => {
    const el = e.target as HTMLElement;
    if (el.tagName !== 'INPUT' || !el.classList.contains('task-checkbox')) return;
    e.preventDefault();
    const line = Number(el.getAttribute('data-source-line'));
    if (!Number.isFinite(line)) return;
    props.state.setText(toggleTaskAtLine(props.state.text(), line));
  };

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
          onClick={onPreviewClick}
          innerHTML={html()}
        />
      </Show>
    </div>
  );
}
