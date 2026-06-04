# 共识文档 v1.4 — Mermaid 图渲染（懒加载 + 异步 + 受控 SVG sanitize）

> v1.0 共识增量 delta（v1.3 明确推迟到 v1.4 的 Mermaid 项）。仅描述本次行为变化。
>
> **状态：** `accepted`（2026-06-04 Corray 全盘接受 TBD-v14-1~5 的 AI 倾向 (a)）
> **flow 位置：** 共识 ✓ accepted → **module-list M2 delta** → 架构 + ADR-008 → api+test-plan delta → 实现（含 security review）
> **命名：** semver tag 将是 **v0.5.0**（同先例）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.4-draft | 2026-06-04 | Mermaid 图懒加载 + 异步渲染 + SVG sanitize；5 TBD 待 accept |

---

## 1. 动机与范围

v1.3 把 Mermaid 降风险推到 v1.4（理由：异步 + SVG sanitize 是大头风险）。本版补上：
- ` ```mermaid ` 代码块 → 流程图 / 时序图 / 甘特图等（mermaid 渲染为 SVG）

**范围（仅）：** M2 预览管线增挂 Mermaid（懒加载 + 异步 per-block 渲染）。
**不在本次：** 多文档、PWA、滚动同步、云同步（各按 roadmap 推迟）。

---

## 2. 三大张力（v1.4 是最高风险版）

### 张力 A — per-block 异步渲染（比 KaTeX 重）
`mermaid.render()` 是**异步**（返回 Promise<svg>），且**每个图块各自异步**。当前 `render(md): string` 同步、v1.3 仅加了"一次性懒加载 KaTeX"。Mermaid 需：render 同步输出 markdown + **每个 mermaid 块占位**（"渲染中"）→ 异步逐块渲染 → 替换占位为 SVG。见 **TBD-v14-2**。

### 张力 B — SVG sanitize（安全红线，比 KaTeX MathML 更危险）
Mermaid 输出 **SVG**（含 `foreignObject` 放 HTML 标签等）。SVG/foreignObject 是 XSS 高发面。放行让图显示 = 扩大攻击面。见 **TBD-v14-1**（发布门槛）。

### 张力 C — 竞态
异步渲染期间文本又变（用户继续打字 / 切文档）→ 旧图渲染完不能串到新内容。见 **TBD-v14-2**。

---

## 3. 待确认项（TBD-v14-x；HOW 在 ADR-008）

### TBD-v14-1 — SVG 安全策略（红线 / 发布门槛 / `[SECURITY REVIEW REQUIRED]`）
- **(a) mermaid `securityLevel:'strict'` + `htmlLabels:false`（标签走 SVG `<text>` 而非 `foreignObject`）→ 输出无 foreignObject 的纯 SVG → DOMPurify SVG profile 受控 sanitize（放行 svg/path/g/text/... 安全子集，禁 script/事件属性/foreignObject/use-外链）**〔AI 倾向，降风险〕
- (b) `securityLevel:'loose'`（允许 HTML 标签 / click 交互 / foreignObject）→ 功能全但 XSS 面大 → **拒绝**
- (c) 不 sanitize mermaid SVG（信任库）→ **拒绝**（破红线）

**AI 倾向 (a)**：这是 v1.4 的降风险核心（类比 v13-1 的 KaTeX-only）——`htmlLabels:false` 砍掉 foreignObject（XSS 大头），标签用纯 SVG text；仍过 DOMPurify SVG profile 二次兜底。代价：图里不能用富 HTML 标签 / 不支持 click 交互（MVP 可接受）。**必须人工 security review**；放行集 + 恶意 mermaid 注入测试在 ADR-008。反例：strict 下个别图样式略逊（无 HTML 标签换行等），但安全优先。

### TBD-v14-2 — 异步渲染 + 竞态（张力 A/C）
- **(a) render 同步出占位（`<div class=mermaid-pending data-src=...>`）→ PreviewArea 异步逐块 mermaid.render → 替换；每次渲染带"代次"令牌，文本变更则丢弃过期结果**〔AI 倾向〕
- (b) 全异步 render → 首帧延迟 + markdown 也卡

**AI 倾向 (a)**：markdown + KaTeX 仍同步即出；mermaid 块占位 → 异步填充；竞态用代次令牌（render 前记 version，完成时若 version 已变则丢弃）防串图。反例：占位→图的视觉跳变 + 多图并发渲染管理复杂度（远高于 KaTeX 的一次性 load）。

### TBD-v14-3 — 懒加载
- **(a) 内容含 ` ```mermaid ` 块才动态 import mermaid**〔AI 倾向〕— mermaid ~大（数百 KB），首屏绝不含；Vite lazy chunk
- (b) 始终加载 → 破 150KB 首屏闸

**AI 倾向 (a)**：按需 import，守首屏闸（同 KaTeX）。

### TBD-v14-4 — 渲染失败降级
- **(a) 非法 mermaid 语法 → 块内显错误提示（不崩、不影响其余内容）**〔AI 倾向〕
- (b) 抛错 → 预览崩

**AI 倾向 (a)**：try/catch 每块，失败显友好错误占位。

### TBD-v14-5 — 主题
- **(a) mermaid 主题跟随 M6 light/dark（深色用 mermaid dark theme）**〔AI 倾向〕
- (b) 固定 default 主题（不跟随）

**AI 倾向 (a)**：与 M6 主题一致（深色模式图不刺眼）；主题切换时已渲染的图需重渲染（或接受切换后下次渲染才变）。反例：跟随主题增加重渲染触发点；(b) 固定最简。**这条可降级 (b) 若想简化。**

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 渲染管线 delta（+Mermaid 异步 per-block + 懒加载）| §M2 |
| 架构 + **ADR-008** | mermaid 选型/版本 + **DOMPurify SVG profile（安全核心）** + 异步渲染+竞态设计 + 懒加载 code-split + 主题 | L3 + security |
| api-spec delta | M2 render 占位契约 + PreviewArea 异步渲染编排（代次令牌防竞态）| 契约 |
| test-plan delta | 家族：`内容(纯md/单图/多图/图+公式混合/非法图/恶意 SVG 注入) × 加载(懒加载首次/已载) × 异步态(占位/完成/失败/竞态)`；**XSS 矩阵扩 mermaid SVG/foreignObject 注入（发布门槛）** | 覆盖 |

---

## 5. 验收条件（v1.4 新增 AC，待 test-plan 细化）

- AC-v14-1：` ```mermaid graph TD; A-->B ` → 预览渲染出流程图（懒加载，占位→完成）
- AC-v14-2：纯文本/无图文档 → 不加载 mermaid（首屏闸不变）
- AC-v14-3：**恶意 mermaid 输入**（图定义里注入 `<script>`/`onerror`/foreignObject XSS/外链）→ sanitize 后无脚本执行（XSS 红线，**发布门槛**，security review）
- AC-v14-4：非法 mermaid 语法 → 块内显错，不崩、不影响其余预览
- AC-v14-5：多图文档 → 各自渲染；渲染中改文本 → 不串图（竞态）
- AC-v14-6：深色主题下图可读（TBD-v14-5 若选 (a)）

> AC-v14-3 是发布门槛（安全，SVG 比 KaTeX MathML 更需严格）。待 TBD accept 后细化进 test-plan delta。
