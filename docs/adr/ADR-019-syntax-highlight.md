# ADR-019 — 代码块语法高亮：highlight.js lib/common 懒加载 + class 输出不放宽 sanitize

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-12：D1=highlight.js 11 lib/common / D2=markdown-it highlight 闭包注入 / D3=不放宽 sanitize / D4=CSS 变量主题零重渲染）|
| **Date** | 2026-06-12 |
| **Decider** | FE (Corray，共识 v2.3 TBD 全拍) |
| **Context** | 共识 v2.3（accepted）/ ADR-007 KaTeX 懒加载范式 / ADR-002 sanitize 红线 |
| **Supersedes** | — |

## D1 — highlight.js 11.11.1 `lib/common`（TBD-v23-1a/2a）

- **class-based 输出**（`<span class="hljs-keyword">` 等）——主题切换走 CSS 变量零重渲染；shiki（inline style + 主题重渲染 + style 进 sanitize 面）和 prismjs（维护慢 + 动态注册繁琐）落选
- `lib/common` ~37 常用语言单 lazy chunk；未注册语言降级无色等宽（现状）
- `ignoreIllegals: true` —— 非法语法不抛错

## D2 — 注入点：markdown-it `highlight` 选项闭包（零重建）

`MD_OPTS.highlight = (code, lang) => hljsLib && lang && hljsLib.getLanguage(lang) ? hljsLib.highlight(code, {language: lang, ignoreIllegals: true}).value : ''`

- markdown-it 在 **render 期**调用该闭包 → hljs 懒加载完成后 baseMd/katexMd **无需重建**即生效
- 返回 `''` = markdown-it 走默认 escapeHtml 降级（未载/未知语言/无标注统一行为）
- mermaid fence 在自定义 fence 规则先拦截（`info === 'mermaid'`），不进 highlight 闭包
- 加载时机（TBD-v23-4a）：`hasCode()` 启发式（带语言标注的非 mermaid fence）→ `ensureHighlight()`，PreviewArea bump 版本号触发重渲染——KaTeX hasMath/ensureKatex/katexReady 三件套同构

## D3 — 安全：输出过既有 DOMPurify 默认配置，不放宽（TBD 红线）

- hljs 输出仅 span+class —— DOMPurify 默认 allowlist 放行，**ADD_ATTR/ALLOW 不动**（ADR-002 红线）
- hljs `highlight()` 自身对非高亮文本 escape；即使库出错，render() 末端 sanitize 兜底
- AC-v23-4 XSS e2e 双引擎守（AC-v14-3 同款门槛）

## D4 — 主题：自绘 ~10 条 token 规则 + CSS 变量（TBD-v23-1a 附带）

- 不引入 hljs 官方主题 CSS（两份主题文件 + 切换逻辑）；variables.css 加 `--hl-*` 变量（light/dark 双值），main.css 按 token 类着色
- 浅深色切换即时跟随（AC-v23-6），与 M6 既有机制零耦合

## Consequences

- **api-spec delta**：pipeline +`hasCode` / `ensureHighlight` / `highlightReady`
- **SW precache**：hljs chunk 默认进 precache（同 katex——离线高亮可用）；build 后核体积，若 raw 超 ~500KB 再评估 runtimeCaching（F-V15-1 先例），预计 ~300KB 可接受
- 编辑器侧（textarea）不着色（共识范围外）
- 新依赖 highlight.js@11.11.1（research-first：npm 最新版核实 2026-06-12）
