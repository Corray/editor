# 共识文档 v1.3 — 渲染增强（Mermaid 图 + KaTeX 公式，懒加载）

> v1.0 共识增量 delta（路线图 "v1.1" 遗留的渲染插件项）。仅描述本次行为变化，前序条款不变。
>
> **状态：** `draft`（待 PM 评审 TBD-v13-1~5）
> **flow 位置：** v1.3 入口（共识）→ module-list M2 delta → 架构 + ADR-007 → api+data-model+test-plan delta → 实现
> **命名：** semver tag 将是 **v0.4.0**（同先例）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
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

### TBD-v13-1 — 范围：两个都做 vs 先一个
- **(a) Mermaid + KaTeX 都做**〔AI 倾向，scope 既定〕
- (b) 先 KaTeX（同步、不破管线、风险小），Mermaid 推迟 v1.4

**AI 倾向 (a)** 但**强烈建议考虑 (b) 作为降风险路径**：KaTeX 同步 + sanitize 面小（MathML/HTML），Mermaid 异步 + SVG sanitize 是大头风险。若要稳，(b) 先落 KaTeX。反例：scope 已定"渲染增强"含两者，(a) 一次到位。**这条请你重点拍。**

### TBD-v13-2 — 预览管线异步化（张力 A）
- **(a) 管线整体支持异步：同步渲染 markdown + KaTeX 先出，Mermaid 块先占位（"渲染中"）→ 异步 render 完成替换**〔AI 倾向〕
- (b) 全异步 render（含 markdown）→ 首帧延迟
- (c) 只做 KaTeX（同步），不引入异步（= 退化为 TBD-v13-1 (b)）

**AI 倾向 (a)**：markdown + KaTeX 同步即时出，仅 Mermaid 占位异步填充，体验最好；M2 从"纯同步 memo"扩为"同步基底 + 异步增强"。反例：异步替换需管理"渲染中→完成/失败"态 + 防竞态（文本又变了）。

### TBD-v13-3 — sanitize 策略（张力 B，安全红线）
- **(a) 保持 DOMPurify 二次 sanitize，配置放行 KaTeX(MathML/HTML) + Mermaid(SVG) 的安全子集；Mermaid 用 `securityLevel:'strict'`；不输出未 sanitize 的 SVG**〔AI 倾向〕
- (b) 对 mermaid/katex 输出跳过 sanitize（信任库）→ **拒绝**（破 XSS 红线）

**AI 倾向 (a)**：双保险不破——markdown 链路仍默认严格 sanitize；KaTeX/Mermaid 输出走**受控放行**（DOMPurify SVG/MathML profile + 库自身 securityLevel）。**此项必须人工 security review**（标 `[SECURITY REVIEW REQUIRED]`）；具体 allowlist/profile 在 ADR-007。反例：放行 SVG 仍有残余面（foreignObject / use / 事件属性），需 ADR 精确界定。

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
| module-list | M2 渲染管线 delta（+异步 + 插件挂载）| §M2 |
| 架构 + **ADR-007** | 插件选型（mermaid / katex 插件）+ 异步渲染设计 + **DOMPurify 放行 profile（安全核心）** + 懒加载 code-split | L3 + security |
| api-spec delta | M2 render 契约：同步 → 同步基底 + 异步 Mermaid（PreviewArea 渲染态）| 契约 |
| test-plan delta | 家族：`内容(纯md / +katex / +mermaid / 混合 / 恶意 SVG·math XSS) × 加载(懒加载首次/已载) × 异步态(占位/完成/失败/竞态)`；**XSS 矩阵必扩**（mermaid SVG / katex 注入）| 覆盖 |

---

## 5. 验收条件（v1.3 新增 AC，待 test-plan 细化）

- AC-v13-1：` ```mermaid ` 流程图 → 预览渲染出图（懒加载，占位→完成）
- AC-v13-2：`$E=mc^2$` / `$$...$$` → 渲染数学公式
- AC-v13-3：纯文本/普通 markdown 文档 → **不加载** mermaid/katex（首屏 bundle 不变，<150KB 闸）
- AC-v13-4：**恶意 mermaid/katex 输入**（SVG `<script>` / `onerror` / foreignObject / katex 注入）→ sanitize 后无脚本执行（XSS 红线，security review）
- AC-v13-5：Mermaid 渲染失败（语法错）→ 友好降级（错误提示，不崩）
- AC-v13-6：文本在 Mermaid 异步渲染中又变更 → 不串图（防竞态）

> 待 TBD-v13-1~5 accept 后细化进 test-plan delta；AC-v13-4 是发布门槛（安全）。
