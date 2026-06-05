# ADR-011 — 滚动同步：source-line 映射 + data-source-line 过 sanitize + 双向反馈环防护

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-05：D1=source-line 映射 / D2=ADD_ATTR data-source-line + XSS 复验 / D3=syncing 标志反馈环防护 / D4=双向+桌面 only / D5=新 M10 scroll-sync）|
| **Date** | 2026-06-05 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.7（accepted）/ ADR-002（sanitize 红线）/ M2 render / M5 桌面双栏 |
| **Supersedes** | — |

## Context

共识 v1.7 决定桌面编辑↔预览滚动同步。约束：精确（抗块高差异）；不破 ADR-002 sanitize 红线；移动端单栏不启用。本 ADR 定 how：① 映射 ② data-source-line 过 sanitize ③ 反馈环 ④ 方向/范围 ⑤ 模块。

---

## D1 — source-line 映射（TBD-v17-1a）
markdown-it `core.ruler` 加规则：遍历 token，对**开始块 token**（`token.map && token.nesting === 1`）`attrSet('data-source-line', String(token.map[0]))`。renderToken 自动输出属性。
- **编辑→预览**：`topLine = round(textarea.scrollTop / lineHeight)` → 在预览 `[data-source-line]` 元素中二分找 `line <= topLine` 的最近元素 → `preview.scrollTop = el.offsetTop`（相对预览容器）
- **预览→编辑**：预览视口顶部最近 `[data-source-line]` 元素 → 其 line → `textarea.scrollTop = line * lineHeight`
> 反例 (b) 比例同步：图/表/公式块高差异下漂移 → 拒绝。

## D2 — data-source-line 过 sanitize（安全核心 / `[SECURITY REVIEW REQUIRED]`）
`render` 的 `DOMPurify.sanitize(html, { ADD_ATTR: ['data-source-line'] })`。
- `data-source-line` = 惰性数字属性（无执行语义 / 非 url / 非事件）→ 放行面极小
- 其余 sanitize 严格不变（不放宽标签 / 事件 / url）
- **必须 XSS 复验**（AC-v17-5 发布门槛）：现有 XSS 向量（`<script>`/`onerror`/`javascript:`）+ 针对 data-source-line 的注入（如试图塞 `data-source-line="x" onx=...`）→ DOM 级断言无执行、无多余属性放行；e2e 双引擎
- 反例 (b) sanitize 后回填：需重解析匹配 DOM，脆弱 → 拒绝

## D3 — 反馈环防护（TBD-v17-3a）
程序滚动被驱动方前置 `syncing = true`；被驱动方 scroll handler 见 `syncing` 即 `return`（不反驱动源）；用 `requestAnimationFrame` 后 `syncing = false`（一帧窗口）。避免 A→B→A 抖动/死循环。

## D4 — 方向 + 范围（TBD-v17-4a / 共识范围）
**双向**：editor scroll → 同步 preview；preview scroll → 同步 editor（各自 D3 防护）。**仅桌面**：M5 `viewport()==='desktop'` 才挂监听；移动端单栏（edit/preview 互斥）不启用。viewport 切换时挂载/卸载监听（Solid `createEffect` + onCleanup）。

## D5 — 模块（M10 scroll-sync）
新增 `m10-scroll-sync/`：`createScrollSync(editorEl, previewEl, lineHeight)` → 装监听 + 映射 + 反馈环防护，返回 `dispose()`。M2 提供 `data-source-line`（render 改）。AppShell 桌面双栏拿 editor/preview DOM ref → createEffect 内 createScrollSync（viewport=desktop 时）+ onCleanup dispose。EditorArea/PreviewArea 暴露 scroll 元素 ref。

---

## Consequences

- **module-list**：M2 render 加 source-line core rule + ADD_ATTR；新增 **M10 滚动同步**；M5 桌面双栏挂载点
- **api-spec delta**：render 出 data-source-line 契约 + ScrollSync API（createScrollSync/dispose）+ Editor/Preview scroll ref 暴露
- **安全**：ADD_ATTR data-source-line（XSS 复验 AC-v17-5）；ADR-002 红线核心（标签/事件/url）不放宽
- main.tsx/AppShell：桌面双栏 createEffect 装 scroll sync + onCleanup；mobile 不装
- test-plan delta：映射精度家族（块高差异）+ 双向 + 反馈环 + **XSS 复验 ADD_ATTR**
- 无 data-model / 持久化变更；无新依赖
- 测试：source-line core rule 单测（render 出 data-source-line）+ XSS 复验单测/e2e；滚动同步映射 e2e（桌面，含图表块高差异）

## References

- 共识 v1.7 TBD-v17-1~5
- markdown-it `token.map`（`[lineStart, lineEnd]`，0-based）+ `core.ruler`（核实：block token 含 map / inline 不含）
- ADR-002（sanitize 红线 / 二次 DOMPurify）；ADD_ATTR 仅加惰性 data 属性，红线（标签/事件/url 严格）不动
- v1.4 mermaid 实测：DOMPurify 默认剥离 data-* → 本版用 ADD_ATTR 显式放行（非 textContent 绕路，因行号需在属性上供 JS 读）
- DOMPurify `ADD_ATTR` 文档（核实放行语义：仅加白名单属性，不放宽其他）
- 实现 commit：`<TBD 实现后回填>`
