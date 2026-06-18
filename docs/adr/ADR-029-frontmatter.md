# ADR-029 — frontmatter：自定义 block rule + metadata 框

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-18：D1=自定义 block rule 仅 doc 头 / D2=轻量 key:value 解析 / D3=metadata 框 renderer 值 escapeHtml / D4=不放宽 sanitize）|
| **Date** | 2026-06-18 |
| **Decider** | FE (Corray，共识 v3.3 TBD 全拍) |
| **Context** | 共识 v3.3 / pipeline（installMermaidFence/installTaskList 自定义规则范式）/ ADR-002 |

## D1 — 自定义 block rule（仅文档头 / TBD-v33-1a）

`installFrontmatter(md)`：`md.block.ruler.before('hr', 'frontmatter', fn, {alt:[]})`
- 仅 `startLine === 0`（文档最开头）才尝试；否则返 false（文中 `---` 走 hr）
- 首行必须是 `---`（trim 后）；向下找闭合 `---`；找不到 → 返 false（首行 `---` 落 hr / AC-v33-3）
- 命中 → consume 到闭合行后，push `frontmatter` token（meta.rows = 解析结果），`state.line = 闭合行+1`

## D2 — 轻量 key:value 解析（TBD-v33-3a）

frontmatter 内每行：
- `^([^:\s][^:]*?):\s*(.*)$` → `{ key, value }`
- 否则（嵌套缩进 / 数组 `-` / 空行）→ `{ raw: 整行 }`（原样显示）
- 不引 js-yaml（无依赖 + 无复杂解析面）；嵌套/数组覆盖外但原样可见

## D3 — metadata 框 renderer（TBD-v33-2a）

`renderer.rules.frontmatter`：
```html
<div class="frontmatter"><dl>
  <div class="frontmatter__row"><dt>{escapeHtml key}</dt><dd>{escapeHtml value}</dd></div>
  <div class="frontmatter__raw">{escapeHtml raw}</div>  // 非 kv 行
</dl></div>
```
- 所有 key/value/raw 经 `md.utils.escapeHtml`（renderer 输出受信，但值是用户内容 → 显式 escape）
- 常显弱样式框（不藏 / 区分正文）

## D4 — 安全（不放宽 sanitize / TBD 安全门槛）

- 值 escapeHtml + 整体过 render() 既有 DOMPurify（默认严格）→ `<script>`/`onerror` 剥离
- ADD_ATTR 仍仅 data-source-line（**ADR-002 红线不动**）；AC-v33-5 XSS e2e 双引擎守

## Consequences

- api-spec delta：pipeline installFrontmatter（block rule + renderer，base+katex 均装）
- i18n：无（metadata 框纯展示用户内容，无 chrome 文案）
- test-plan delta：识别 × 不误识别（文中 hr/无闭合）× key:value 解析 × 嵌套原样 × XSS × 空 frontmatter
- 无 data-model / 无新依赖
- 限制：仅平铺 key:value 结构化展示；复杂 YAML 原样行显示
