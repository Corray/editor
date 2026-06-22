import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import type { HLJSApi } from 'highlight.js';
import { t } from '@/modules/m7-i18n/i18n'; // v3.5：callout 默认类型名标题

// —— 语法高亮（v2.3 / ADR-019）——
// hljs 懒加载；MD_OPTS.highlight 闭包在 render 期读取 → 加载完成后无需重建渲染器。
let hljsLib: HLJSApi | null = null;
let hljsLoad: Promise<void> | null = null;

const MD_OPTS = {
  html: false,
  linkify: false,
  breaks: false,
  typographer: false,
  /**
   * fenced code 着色（ADR-019 D2/D3）：hljs 已载且语言已注册 → class-based 着色
   * HTML（仅 span+class，过 render() 默认 DOMPurify 不放宽）；否则返 '' =
   * markdown-it escapeHtml 降级（未载/未知语言/无标注统一无色现状）。
   * mermaid fence 在自定义 fence 规则先拦截，不进本闭包。
   */
  highlight: (code: string, lang: string): string => {
    if (!hljsLib || !lang || !hljsLib.getLanguage(lang)) return '';
    try {
      return hljsLib.highlight(code, { language: lang, ignoreIllegals: true })
        .value;
    } catch {
      return '';
    }
  },
} as const;

/**
 * source-line 标注（v1.7 / ADR-011 D1）：给块级开始 token 标 `data-source-line`
 * = 源文行号（`token.map[0]`，0-based）。M10 滚动同步据此映射编辑↔预览。
 * 行号属性须配合 render 的 `ADD_ATTR:['data-source-line']`（否则被 DOMPurify 剥离）。
 */
function installSourceLine(md: MarkdownIt): void {
  md.core.ruler.push('source_line', (state) => {
    for (const token of state.tokens) {
      if (token.map && token.nesting === 1) {
        token.attrSet('data-source-line', String(token.map[0]));
      }
    }
    return true;
  });
}

/**
 * 任务清单（v3.1 / ADR-027）：list_item 内 inline content `^[ /x ]` → 头插 task_checkbox
 * token + 剥前缀；renderer 输出 `<input type=checkbox data-source-line>`（受信 HTML，
 * 不受 html:false 转义；经 render() 默认 DOMPurify 放行 input、剥 onclick——探针已验）。
 * checkbox 带 data-source-line → PreviewArea 点击委托据此回写源行（toggleTaskAtLine）。
 */
function installTaskList(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'task_list', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (!tok || tok.type !== 'inline' || !tok.children) continue;
      const m = /^\[([ xX])\]\s/.exec(tok.content);
      if (!m) continue;
      // 确认在 list_item 内（向前小窗扫 list_item_open）
      let liIdx = -1;
      for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
        if (tokens[j]!.type === 'list_item_open') {
          liIdx = j;
          break;
        }
        if (
          tokens[j]!.type === 'list_item_close' ||
          tokens[j]!.type === 'bullet_list_open'
        )
          break;
      }
      if (liIdx === -1) continue;
      const para = tokens[i - 1];
      const line = (para?.map ?? tokens[liIdx]!.map ?? [0])[0]!;
      const checked = m[1]!.toLowerCase() === 'x';
      // 剥首个 text child 的 `[ ] ` 前缀
      const first = tok.children[0];
      if (first && first.type === 'text') {
        first.content = first.content.replace(/^\[([ xX])\]\s/, '');
      }
      tok.content = tok.content.slice(m[0].length);
      const cb = new state.Token('task_checkbox', '', 0);
      cb.meta = { checked, line };
      tok.children.unshift(cb);
    }
    return true;
  });

  md.renderer.rules.task_checkbox = (tokens, idx) => {
    const meta = tokens[idx]!.meta as { checked: boolean; line: number };
    const checked = meta.checked ? ' checked' : '';
    return `<input class="task-checkbox" type="checkbox"${checked} data-source-line="${meta.line}">`;
  };
}

/**
 * frontmatter（v3.3 / ADR-029）：仅文档头 `---`...`---` 识别为 metadata 框（不渲染为
 * hr+乱内容）。轻量 key:value 行解析（不引 js-yaml）；值 escapeHtml + 过 render() 默认
 * DOMPurify（不放宽 / ADR-002）。文中 `---` 仍走 hr；无闭合不识别（落 hr）。
 */
function installFrontmatter(md: MarkdownIt): void {
  md.block.ruler.before(
    'hr',
    'frontmatter',
    (state, startLine, endLine, silent) => {
      if (startLine !== 0) return false; // 仅文档最开头
      const firstStart = state.bMarks[startLine]! + state.tShift[startLine]!;
      const firstEnd = state.eMarks[startLine]!;
      if (state.src.slice(firstStart, firstEnd).trim() !== '---') return false;
      // 向下找闭合 ---
      let closeLine = -1;
      for (let l = startLine + 1; l < endLine; l++) {
        const s = state.bMarks[l]! + state.tShift[l]!;
        const e = state.eMarks[l]!;
        if (state.src.slice(s, e).trim() === '---') {
          closeLine = l;
          break;
        }
      }
      if (closeLine === -1) return false; // 无闭合 → 不识别（落 hr）
      if (silent) return true;
      // 收集 frontmatter 内容行
      const rows: ({ key: string; value: string } | { raw: string })[] = [];
      for (let l = startLine + 1; l < closeLine; l++) {
        const s = state.bMarks[l]! + state.tShift[l]!;
        const e = state.eMarks[l]!;
        const line = state.src.slice(s, e);
        const m = /^([^:\s][^:]*?):\s*(.*)$/.exec(line);
        if (m) rows.push({ key: m[1]!, value: m[2]! });
        else if (line.trim() !== '') rows.push({ raw: line });
      }
      const token = state.push('frontmatter', '', 0);
      token.meta = { rows };
      token.map = [startLine, closeLine + 1];
      state.line = closeLine + 1;
      return true;
    },
    { alt: [] },
  );

  md.renderer.rules.frontmatter = (tokens, idx) => {
    const rows = (tokens[idx]!.meta as {
      rows: ({ key: string; value: string } | { raw: string })[];
    }).rows;
    const esc = md.utils.escapeHtml;
    const body = rows
      .map((r) =>
        'raw' in r
          ? `<div class="frontmatter__raw">${esc(r.raw)}</div>`
          : `<div class="frontmatter__row"><dt>${esc(r.key)}</dt><dd>${esc(r.value)}</dd></div>`,
      )
      .join('');
    return `<div class="frontmatter"><dl>${body}</dl></div>\n`;
  };
}

/** 基底渲染器（无 KaTeX）—— KaTeX 未懒加载时用。 */
const baseMd = new MarkdownIt(MD_OPTS);
installMermaidFence(baseMd);
installSourceLine(baseMd);
installTaskList(baseMd);
installFrontmatter(baseMd);

// —— markdown 扩展包（v3.4 / ADR-030）：emoji/脚注/上下标 懒加载 ——
// 插件 .use() mutate 实例，每实例只应用一次（baseMd + katexMd 对称协同）。
let extPlugins: ((md: MarkdownIt) => void)[] | null = null;
let extLoad: Promise<void> | null = null;

/** 文本是否含扩展语法（emoji/脚注/sub/sup/callout/mark/ins）→ 决定懒加载（误判最坏多加载）。 */
export function hasExtension(markdown: string): boolean {
  return /:[a-z0-9_+-]+:|\[\^[^\]]+\]|~[^~\s]+~|\^[^\^\s]+\^|(^|\n):::[a-z]|==[^=]|\+\+[^+]/.test(
    markdown,
  );
}

/** callout 类型（v3.5 / ADR-031）。 */
const CALLOUT_TYPES = ['note', 'tip', 'warning', 'danger'] as const;

/** 扩展插件是否已加载。 */
export function extensionsReady(): boolean {
  return extPlugins !== null;
}

function applyExtensions(md: MarkdownIt): void {
  if (!extPlugins) return;
  for (const p of extPlugins) p(md);
}

/** 一次性懒加载 4 插件 + 应用到现有实例（baseMd + katexMd?）。memoized（ADR-030 D1/D2）。 */
export function ensureExtensions(): Promise<void> {
  if (!extLoad) {
    extLoad = (async () => {
      const [emoji, footnote, sub, sup, container, mark, ins] =
        await Promise.all([
          import('markdown-it-emoji'),
          import('markdown-it-footnote'),
          import('markdown-it-sub'),
          import('markdown-it-sup'),
          import('markdown-it-container'),
          import('markdown-it-mark'),
          import('markdown-it-ins'),
        ]);
      extPlugins = [
        (md) => md.use(emoji.full),
        (md) => md.use(footnote.default),
        (md) => md.use(sub.default),
        (md) => md.use(sup.default),
        (md) => md.use(mark.default), // v3.6：==高亮==
        (md) => md.use(ins.default), // v3.6：++插入++
        // v3.5：4 类 callout 容器块（ADR-031）
        (md) => {
          for (const type of CALLOUT_TYPES) {
            md.use(container.default, type, {
              render: (tokens: { nesting: number; info: string }[], idx: number) => {
                const token = tokens[idx]!;
                if (token.nesting === 1) {
                  // info 串剥类型名 → 剩余为自定义标题；空 → i18n 类型名
                  const title = token.info.trim().slice(type.length).trim();
                  const label = title || t(`callout.${type}`);
                  return `<div class="callout callout--${type}"><div class="callout__title">${md.utils.escapeHtml(label)}</div>\n`;
                }
                return '</div></div>\n';
              },
            });
          }
        },
      ];
      applyExtensions(baseMd);
      if (katexMd) applyExtensions(katexMd); // 对称：katex 已建 → 同步应用
    })();
  }
  return extLoad;
}

/**
 * 翻转源文第 line（0-based）行的任务标记 `[ ]`↔`[x]`（v3.1 / ADR-027）。
 * 非任务行 / 越界 → 原样返回。点击 checkbox 委托调用。
 */
export function toggleTaskAtLine(text: string, line: number): string {
  const lines = text.split('\n');
  if (line < 0 || line >= lines.length) return text;
  const l = lines[line]!;
  const m = /^(\s*[-*+]\s+\[)([ xX])(\])/.exec(l);
  if (!m) return text;
  const next = m[2]!.toLowerCase() === 'x' ? ' ' : 'x';
  lines[line] = l.slice(0, m[1]!.length) + next + l.slice(m[1]!.length + 1);
  return lines.join('\n');
}

/**
 * 给 markdown-it 装 ` ```mermaid ` fence 规则：同步输出**占位** div（不在 render 里
 * 异步）。源文 escapeHtml 后存 data-mermaid，PreviewArea 异步逐块渲染替换（ADR-008 D2）。
 * 占位本身（div + class + data-*）过 render 的 DOMPurify 无害。
 */
function installMermaidFence(md: MarkdownIt): void {
  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    if (token && token.info.trim() === 'mermaid') {
      // 源文作占位 div 的**文本内容**（escaped）—— 文本永远过 sanitize（安全），
      // 比 data-* 属性更稳（不依赖 ALLOW_DATA_ATTR）。PreviewArea 读 textContent。
      return `<div class="mermaid-pending">${md.utils.escapeHtml(token.content)}</div>`;
    }
    return defaultFence(tokens, idx, opts, env, self);
  };
}

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
      installMermaidFence(katexMd); // katex 渲染器也要认 mermaid fence
      installSourceLine(katexMd); // 同样标 data-source-line（v1.7）
      installTaskList(katexMd); // task list 渲染（v3.1）
      installFrontmatter(katexMd); // frontmatter metadata 框（v3.3）
      applyExtensions(katexMd); // 对称：扩展已载 → 同步应用到新建的 katexMd（v3.4）
    })();
  }
  return loadPromise;
}

/**
 * 文本是否含「带语言标注的非 mermaid fence」（决定是否懒加载 highlight.js）。
 * 误判最坏 = 多加载一次，无害（hasMath 范式）。
 */
export function hasCode(markdown: string): boolean {
  return /(^|\n) {0,3}(?:`{3,}|~{3,}) *(?!mermaid\b)[a-zA-Z]/.test(markdown);
}

/** highlight.js 是否已加载（PreviewArea 决定加载完是否 re-render）。 */
export function highlightReady(): boolean {
  return hljsLib !== null;
}

/** 一次性懒加载 highlight.js lib/common（~37 常用语言，memoized / ADR-019 D1）。 */
export function ensureHighlight(): Promise<void> {
  if (!hljsLoad) {
    hljsLoad = import('highlight.js/lib/common').then((m) => {
      hljsLib = m.default;
    });
  }
  return hljsLoad;
}

// —— Mermaid（v1.4 / ADR-008）——

let mermaidMod: typeof import('mermaid').default | null = null;
let mermaidLoad: Promise<void> | null = null;
let mermaidTheme: 'default' | 'dark' = 'default';
let mermaidSeq = 0;

/** 文本是否含 ` ```mermaid ` 代码块（决定是否懒加载 mermaid）。 */
export function hasMermaid(markdown: string): boolean {
  return /(^|\n)```mermaid\b/.test(markdown);
}

/**
 * 一次性懒加载 mermaid（动态 import，memoized / ADR-008 D4）+ initialize
 * （securityLevel:'strict' + htmlLabels:false 砍 foreignObject；theme 跟随 M6）。
 * theme 变化时重 initialize（已存图由 PreviewArea 代次令牌触发重渲染）。
 */
export async function ensureMermaid(theme: 'default' | 'dark'): Promise<void> {
  if (!mermaidLoad) {
    mermaidLoad = (async () => {
      const mod = await import('mermaid');
      mermaidMod = mod.default;
      mermaidMod.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        htmlLabels: false,
        theme,
      });
      mermaidTheme = theme;
    })();
  }
  await mermaidLoad;
  if (mermaidMod && theme !== mermaidTheme) {
    mermaidMod.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      htmlLabels: false,
      theme,
    });
    mermaidTheme = theme;
  }
}

/**
 * 渲染单个 mermaid 源 → **sanitized** SVG。失败抛错（调用方 catch 显错占位）。
 *
 * [SECURITY REVIEW REQUIRED] 三层 sanitize（ADR-008 D1）：
 *   1. mermaid securityLevel:'strict'（库内 sanitize）
 *   2. htmlLabels:false（标签走 SVG text，不产 foreignObject）
 *   3. DOMPurify SVG profile + 显式 FORBID foreignObject（堵 XSS 大头；事件属性/js: URL 默认剥离）
 */
export async function renderMermaid(src: string): Promise<string> {
  if (!mermaidMod) throw new Error('mermaid not loaded');
  const { svg } = await mermaidMod.render(`mmd-${++mermaidSeq}`, src);
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['foreignObject', 'script'],
  });
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
  // ADD_ATTR data-source-line（v1.7 / ADR-011 D2）：仅放行该惰性数字属性供滚动同步
  // 映射；标签/事件/url 等严格 sanitize 不放宽（ADR-002 红线）。XSS 复验 AC-v17-5。
  return DOMPurify.sanitize(engine.render(markdown), {
    ADD_ATTR: ['data-source-line'],
  });
}
