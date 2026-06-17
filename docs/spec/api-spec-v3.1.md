# 接口设计 v3.1 delta — 预览任务清单交互

> **基线：** 共识 v3.1（accepted）+ ADR-027。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.1 | 2026-06-17 | pipeline installTaskList（渲染）；toggleTaskAtLine 纯函数；PreviewArea 点击回写 |

---

## 1. M2 pipeline 扩展（ADR-027 D1）

```ts
// pipeline.ts —— core rule + renderer，baseMd + katexMd 都装（同 installMermaidFence）
function installTaskList(md: MarkdownIt): void;
// 渲染：list_item 内 inline content `^\[([ xX])\]\s` → 头插 task_checkbox token（checked+line）
//      renderer.rules.task_checkbox → <input class="task-checkbox" type="checkbox"[ checked] data-source-line="N">
```

## 2. 源文翻转纯函数（ADR-027 D3）

```ts
/** 翻转源文第 line（0-based）行的任务标记 [ ]↔[x]；非任务行原样返回。 */
export function toggleTaskAtLine(text: string, line: number): string;
```

## 3. PreviewArea 点击编排

- `.preview-pane`（或 content）委托 `click`：target 命中 `input.task-checkbox` →
  `e.preventDefault()` → `line = +target.dataset.sourceLine` → `props.state.setText(toggleTaskAtLine(state.text(), line))`
- 重渲染由 setText 驱动；持久化经 M3

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| pipeline installTaskList（core rule + task_checkbox renderer，base+katex 均装）| ⏳ | — |
| toggleTaskAtLine 纯函数 | ⏳ | — |
| PreviewArea 委托点击回写 | ⏳ | — |
| .task-checkbox CSS | ⏳ | — |
