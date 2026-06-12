# 接口设计 v2.3 delta — 代码块语法高亮

> v1.0 接口增量。M2 pipeline 扩展（KaTeX 三件套同构）。
> **基线：** 共识 v2.3（accepted）+ ADR-019。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.3 | 2026-06-12 | pipeline +hasCode/ensureHighlight/highlightReady；MD_OPTS.highlight 闭包；--hl-* 主题变量 |

---

## 1. M2 pipeline 扩展（ADR-019 D1/D2）

```ts
/** 文本是否含「带语言标注的非 mermaid fence」（决定是否懒加载 highlight.js） */
export function hasCode(markdown: string): boolean;
/** 一次性懒加载 highlight.js lib/common（memoized） */
export function ensureHighlight(): Promise<void>;
/** 已加载？（PreviewArea 决定加载完是否 re-render） */
export function highlightReady(): boolean;
```

- `MD_OPTS.highlight` 闭包：hljs 已载且语言已注册 → 返回着色 HTML；否则 `''`（markdown-it escapeHtml 降级）
- PreviewArea：html memo 内 `hasCode(text) && !highlightReady()` → `ensureHighlight().then(bump hlVer)`（katexVer 同构）

## 2. 主题变量（ADR-019 D4）

variables.css：`--hl-keyword / --hl-string / --hl-number / --hl-comment / --hl-title / --hl-attr / --hl-type / --hl-meta / --hl-tag`（light/dark 双值）；main.css 按 `.hljs-*` token 类消费。

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| pipeline hasCode/ensureHighlight/highlightReady + MD_OPTS.highlight | ⏳ | — |
| PreviewArea hlVer 集成 | ⏳ | — |
| variables.css --hl-* + main.css token 规则 | ⏳ | — |
| 依赖 highlight.js@11.11.1 | ⏳ | — |
