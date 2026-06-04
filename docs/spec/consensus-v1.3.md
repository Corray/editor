# 共识文档 v1.3 — 渲染增强（Mermaid 图 + KaTeX 公式，懒加载）

> v1.0 共识增量 delta（路线图 "v1.1" 遗留的渲染插件项）。仅描述本次行为变化，前序条款不变。
>
> **状态：** `draft`（TBD-v13-1 已决 **(b) 先 KaTeX，Mermaid 推 v1.4**；v13-2~5 待确认，已按 KaTeX-only 重构）
> **flow 位置：** v1.3 入口（共识）→ module-list M2 delta → 架构 + ADR-007 → api+data-model+test-plan delta → 实现
> **命名：** semver tag 将是 **v0.4.0**（同先例）。
>
> **scope 收窄（2026-06-04 降风险）：** 本版**仅 KaTeX 公式**；Mermaid（异步 + SVG sanitize 大头风险）**推迟 v1.4**。张力 A（异步管线）基本消解（KaTeX 同步，仅一次性懒加载异步）；张力 B（安全）缩小为放行 KaTeX MathML/HTML（非任意 SVG）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.3-draft2 | 2026-06-04 | TBD-v13-1=(b) 先 KaTeX；Mermaid→v1.4；按 KaTeX-only 重构 v13-2~5 |
| v1.3-draft | 2026-06-04 | Mermaid + KaTeX 懒加载；5 TBD 待 accept |

---

## 1. 动机与范围

PRD §152 / ADR-001（已预留 markdown-it `.use(plugin)` 挂载点）的渲染扩展：
- **Mermaid**：` ```mermaid ` 代码块 → 流程图/时序图等 SVG
- **KaTeX**：`$...$` / `$$...$$` → 数学公式

**范围（仅）：** M2 预览渲染管线增挂 Mermaid + KaTeX，**懒加载**（动态 import，不进首屏 bundle）。
**不在本次：** PWA、多文档、滚动同步、云同步（各按 roadmap 推迟）。

---

## 2. 两大张力（必须 TBD 拍板）

### 张力 A — Mermaid 异步 vs 当前同步 render
当前 `render(md): string` 是**纯同步**（`createMemo` → `innerHTML`）。**Mermaid 渲染是异步**（`mermaid.render()` 返回 Promise）。KaTeX 渲染同步（`renderToString`），但**懒加载本身异步**（动态 import 一次性）。→ 引入 Mermaid 必须让预览管线支持异步。见 **TBD-v13-2**。

### 张力 B — sanitize 放行 vs XSS 红线（安全敏感）
KaTeX 输出含特定 HTML/MathML 标签+类；Mermaid 输出 SVG（含 `foreignObject` 等）。当前 `DOMPurify.sanitize(raw)` 用**默认配置**，会**删掉**大量 SVG/MathML → 公式/图渲染不出。放宽 allowlist 让它们通过，**直接扩大 XSS 面**（SVG/foreignObject 历史 XSS 高发）。这是 **security-review 红线**。见 **TBD-v13-3**。

---

## 3. 待确认项（TBD-v13-x；"做什么"层，HOW 在 ADR-007）

### TBD-v13-1 — 范围 ✅ 已决 **(b) 先 KaTeX，Mermaid 推迟 v1.4**
〔2026-06-04 Corray 降风险拍板〕本版仅 KaTeX 公式。Mermaid（异步 + SVG sanitize 大头风险）单列 v1.4。下面 v13-2~5 已按 KaTeX-only 重构。

### TBD-v13-2 — KaTeX 懒加载后的渲染衔接（张力 A 已消解为一次性 load）
KaTeX 渲染**同步**，唯一异步是首次遇公式时**动态 import 插件**（一次性）。
- **(a) 同步基底即时出 markdown；首次检测到 math 且插件未载 → 异步 load → load 完成后 re-render（公式从 raw `$...$` 闪现为渲染态，仅首次）**〔AI 倾向〕
- (b) 不懒加载，KaTeX 进首屏 bundle → render 全程同步无闪现（但破 150KB 闸，见 v13-4）

**AI 倾向 (a)**：保持 markdown 同步即时；KaTeX 插件一次性懒加载 + load 后 re-render。无 Mermaid 那种 per-block 异步/占位/竞态复杂度——仅一个"插件是否已加载"的模块级状态 + 加载完触发一次 re-render。反例：首次出现公式有一次"raw→渲染"闪现（<一次 import 时间）。

### TBD-v13-3 — sanitize 策略（张力 B，安全；范围缩小为 KaTeX MathML/HTML）
- **(a) 仍 DOMPurify 二次 sanitize，配置放行 KaTeX 输出的安全子集（MathML `<math>`/`<semantics>`/… + `<span class=katex>` 结构）；不放行任意 SVG/script/事件属性**〔AI 倾向〕
- (b) 对 KaTeX 输出跳过 sanitize → **拒绝**（破 XSS 红线）

**AI 倾向 (a)**：双保险不破——markdown 链路仍默认严格 sanitize；KaTeX 输出走**受控放行**（MathML/HTML 子集，**不含 SVG/foreignObject**，比含 Mermaid 时安全面小得多）。**仍需人工 security review**（标 `[SECURITY REVIEW REQUIRED]`）；具体 allowlist 在 ADR-007（含验证：KaTeX 输出不含可执行向量）。反例：MathML 历史上也有过 XSS（`<maction>` 等），需 ADR 精确界定放行集 + 测恶意 `$...$` 注入。

### TBD-v13-4 — 懒加载触发
- **(a) 内容含 mermaid 块 / math 语法时才动态 import 对应库**〔AI 倾向〕— 首屏不含 mermaid(~大)/katex(+CSS)，Vite code-split chunk
- (b) 始终加载 → 破 150KB 首屏闸

**AI 倾向 (a)**：按需 import，控首屏 bundle（150KB 闸不破）。反例：首次出现公式/图时有一次加载延迟（占位过渡）。

### TBD-v13-5 — KaTeX 分隔符 + CSS
- **(a) `$...$` inline + `$$...$$` block；KaTeX CSS 随库懒加载**〔AI 倾向〕
- (b) 仅 `$$...$$`（避免 `$` 与普通文本/价格冲突）

**AI 倾向 (a)** 但注意 `$` 冲突（"$5" 误判公式）——多数 katex 插件有转义/双 `$` 规则；ADR-007 选插件时核对。反例：(b) 仅块级最安全无歧义，但不能写行内公式。

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 渲染管线 delta（+KaTeX 插件挂载 + 懒加载 + load 后 re-render）| §M2 |
| 架构 + **ADR-007** | KaTeX 插件选型（markdown-it-katex 类）+ **DOMPurify KaTeX 放行 allowlist（安全核心）** + 懒加载 code-split + KaTeX CSS | L2-L3 + security |
| api-spec delta | M2 render 契约：保持同步基底；新增"KaTeX 插件懒加载 + 加载完 re-render"衔接 | 契约 |
| test-plan delta | 家族：`内容(纯md / +inline math / +block math / 混合 / 含 $ 非公式 / 恶意 $ 注入) × 加载(懒加载首次/已载)`；**XSS 矩阵扩 KaTeX/MathML 注入** | 覆盖 |

---

## 5. 验收条件（v1.3 新增 AC，待 test-plan 细化）

- AC-v13-1：`$E=mc^2$`（inline）/ `$$...$$`（block）→ 预览渲染出数学公式
- AC-v13-2：纯文本/普通 markdown 文档 → **不加载** KaTeX（首屏 bundle 不变，<150KB 闸）
- AC-v13-3：**恶意 `$...$` 注入**（试图经 KaTeX/MathML 注入 script / 事件属性 / 危险标签）→ sanitize 后无脚本执行（XSS 红线，security review，发布门槛）
- AC-v13-4：首次出现公式 → 懒加载插件 → load 后公式渲染（raw→渲染 仅首次闪现，可接受）
- AC-v13-5：非公式文本含 `$`（如 "$5 和 $10"）→ 不误判为公式（KaTeX 插件转义/双 `$` 规则，TBD-v13-5）

> Mermaid 相关 AC 随 Mermaid 推迟 v1.4。AC-v13-3 是发布门槛（安全）。待 v13-2~5 accept 后细化进 test-plan delta。
