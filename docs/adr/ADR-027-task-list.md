# ADR-027 — 预览任务清单交互：自定义渲染规则 + 点击回写源文

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-17：D1=自定义 core rule + task_checkbox renderer / D2=checkbox 标 data-source-line / D3=PreviewArea 委托点击回写 / D4=不放宽 sanitize）|
| **Date** | 2026-06-17 |
| **Decider** | FE (Corray，共识 v3.1 TBD 全拍) |
| **Context** | 共识 v3.1 / ADR-011（data-source-line）/ ADR-002 sanitize 红线 / DOMPurify 探针（input 默认放行）|

## D1 — 自定义 task list 渲染（TBD-v31-1a）

`installTaskList(md)`：
- core rule `task_list`：遍历 tokens，对 `inline` token（在 list_item 内）content 匹配 `^\[([ xX])\]\s` 的：
  - 在其 children 头插自定义 token `task_checkbox`（携 checked + line meta）
  - 从首个 text child 剥掉 `[x] ` 前缀
  - line 来自当前 list_item/paragraph token.map[0]（同 installSourceLine 来源）
- `renderer.rules.task_checkbox`：emit `<input class="task-checkbox" type="checkbox"{checked}{disabled?} data-source-line="N">`——renderer 规则输出是**受信 HTML**（不受 html:false 转义影响，同 installMermaidFence emit div）

## D2 — checkbox 标 data-source-line（TBD-v31-1a / 张力 A）

checkbox 直接带 `data-source-line`（点击委托读取即得源行，无需爬 DOM 祖先）。经 render() 既有 `ADD_ATTR:['data-source-line']` 保留（探针验）。

## D3 — PreviewArea 委托点击回写（TBD-v31-2a / 张力 B）

- checkbox **非 disabled**（disabled 不触发 click）；PreviewArea 容器委托 `click` 拦截 `input.task-checkbox`
- `e.preventDefault()`（撤销原生 toggle，DOM 态不抢真值）→ 读 data-source-line → `toggleTaskAtLine(text, line)` 纯函数翻转该行 `[ ]`↔`[x]` → `state.setText`
- 重渲染由 setText 驱动（单一数据源 = 源文）；持久化经 M3 防抖
- 大文档防抖下 checkbox 视觉更新延迟 ≤120ms（可接受，F-V31 info）

## D4 — 安全（不放宽 sanitize / TBD 安全门槛）

- checkbox `<input type=checkbox>` 经 render() 默认 DOMPurify 放行（探针验）；`onclick` 等事件属性默认剥离；ADD_ATTR 仍仅 data-source-line（**ADR-002 红线不动**）
- 回写走 `setText`（纯文本），不 innerHTML
- AC-v31-5 XSS e2e 双引擎守（任务项恶意内容剥离）

## Consequences

- api-spec delta：pipeline installTaskList（core rule + renderer）；`toggleTaskAtLine(text, line)` 纯函数；PreviewArea 点击编排
- 渲染器需在 baseMd + katexMd 都装（同 installMermaidFence/installSourceLine）
- test-plan delta：渲染 × 点击翻转 × 多任务定位 × 非任务不误渲 × XSS × 持久化
- 无 data-model；无新依赖（自定义规则）
- 限制：嵌套/有序任务列表本版按 GFM 无序 `- [ ]` 处理；大文档防抖下点击视觉延迟
