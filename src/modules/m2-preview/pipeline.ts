import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const MD_OPTS = {
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
} as const;

/** 基底渲染器（无 KaTeX）—— KaTeX 未懒加载时用。 */
const baseMd = new MarkdownIt(MD_OPTS);

/** 挂了 KaTeX 插件的渲染器；懒加载完成后赋值（ADR-007 D3）。 */
let katexMd: MarkdownIt | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * 文本是否含 KaTeX 公式语法（`$$…$$` block 或 `$…$` inline）。
 * 仅用于决定是否触发懒加载（误判最坏 = 多加载一次，无害），但尽量贴近 katex 规则：
 *   - inline 开 `$` 后非空白（避免 "$ 文本"）
 *   - inline 闭 `$` 后非数字（避免 "$5 和 $10" 这类货币文本被当公式 → 不必要加载）
 */
export function hasMath(markdown: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$(?!\s)[^$]+?\$(?!\d)/.test(markdown);
}

/** KaTeX 插件是否已加载（PreviewArea 决定加载完是否 re-render）。 */
export function katexReady(): boolean {
  return katexMd !== null;
}

/**
 * 一次性懒加载 KaTeX 插件 + CSS（动态 import，memoized / ADR-007 D3,D4）。
 * resolve 后 {@link render} 自动产出公式 HTML。
 *
 * 安全（ADR-007 D2 / TBD-v13-3）：
 *   - `output:'html'` —— 仅 styled span，不输出 MathML（避开 MathML XSS 向量）
 *   - `trust:false` —— KaTeX 拒绝 `\href`/`\includegraphics` 等危险命令（渲染为错误文本）
 *   - `throwOnError:false` —— 非法 LaTeX 显错不崩
 *   - 输出仍走 render() 的 DOMPurify 二次 sanitize（默认严格配置，不放宽）
 */
export function ensureKatex(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const mod = await import('@vscode/markdown-it-katex');
      await import('katex/dist/katex.min.css');
      // 插件导出形态在 ESM/CJS interop 下可能多层包裹 → 取第一个 function
      const candidates = [mod, (mod as { default?: unknown }).default];
      const inner = (candidates[1] as { default?: unknown } | undefined)?.default;
      const katexPlugin = [inner, candidates[1], candidates[0]].find(
        (c): c is (md: MarkdownIt, opts?: unknown) => void =>
          typeof c === 'function',
      );
      if (!katexPlugin) throw new Error('katex plugin export not found');
      katexMd = new MarkdownIt(MD_OPTS).use(katexPlugin, {
        throwOnError: false,
        output: 'html',
        trust: false,
      });
    })();
  }
  return loadPromise;
}

/**
 * Markdown → safe HTML（同步基底；已载 KaTeX 则含公式）。
 *
 * Pipeline: markdown-it (html:false) [+KaTeX 已载] → DOMPurify.sanitize（默认严格）
 * 双保险 per ADR-001 / ADR-002 / consensus §4.2 / v1.3 §3。
 *
 * [SECURITY REVIEW REQUIRED] KaTeX 输出（output:html）经默认 DOMPurify sanitize；
 * 不放宽 allowlist —— styled span 默认放行，script/事件属性/SVG 默认剥离。
 */
export function render(markdown: string): string {
  if (markdown === '') return '';
  const engine = katexMd ?? baseMd;
  return DOMPurify.sanitize(engine.render(markdown));
}
