# 接口设计 v3.3 delta — frontmatter (YAML) 支持

> **基线：** 共识 v3.3（accepted）+ ADR-029。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.3 | 2026-06-18 | pipeline installFrontmatter（block rule + metadata 框 renderer） |

---

## 1. M2 pipeline 扩展（ADR-029）

```ts
// pipeline.ts —— block rule before 'hr'（仅 startLine===0）+ frontmatter renderer
function installFrontmatter(md: MarkdownIt): void;
// block rule：doc 头 `---`...`---` → consume + push frontmatter token（meta.rows）
// renderer.rules.frontmatter → <div class="frontmatter"><dl> key:value 行 </dl></div>（值 escapeHtml）
// base+katex 均装（同 installMermaidFence/installTaskList/installSourceLine）
```

行解析（内部）：
```ts
type FmRow = { key: string; value: string } | { raw: string };
// `^([^:\s][^:]*?):\s*(.*)$` → {key,value}；否则 {raw}
```

## 2. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| pipeline installFrontmatter（block rule + renderer，仅 doc 头 + 闭合校验）| ⏳ | — |
| 轻量 key:value 行解析（嵌套原样）| ⏳ | — |
| base+katex 均装 | ⏳ | — |
| .frontmatter CSS | ⏳ | — |
