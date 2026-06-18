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
| pipeline installFrontmatter（block.ruler.before hr，仅 startLine 0 + 闭合校验）| ✓ | `a3468a9` |
| 轻量 key:value 行解析（嵌套/数组原样 raw）| ✓ | `a3468a9` |
| base+katex 均装 | ✓ | `a3468a9` |
| .frontmatter CSS（弱样式 metadata 框）| ✓ | `a3468a9` |

> 测试：unit +7（CT-FM：识别/文中 hr/无闭合/嵌套/含冒号/空/XSS）→ 322；e2e +3 用例双引擎（ac26，含 XSS 门槛）→ 186+4skip。首屏 95.77KB。
