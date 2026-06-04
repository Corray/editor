# ADR-008 — Mermaid 图渲染（懒加载 + 异步 + SVG sanitize）

| 字段 | 值 |
|------|----|
| **Status** | **draft**（待 Decider 选 D1 SVG sanitize 方案 + 确认 D2~D5；D1 security review）|
| **Date** | 2026-06-04 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.4（accepted）/ module-list M2 delta / ADR-002 sanitize 红线 / ADR-007 (KaTeX 懒加载范式) |
| **Supersedes** | — |

## Context

共识 v1.4 决定 M2 增挂 Mermaid（懒加载 + per-block 异步 + 受控 SVG sanitize）。TBD-v14-1~5 accept：securityLevel:strict + htmlLabels:false（砍 foreignObject）/ 占位+代次令牌防竞态 / 懒加载 / 失败降级 / 主题跟随 M6。

本 ADR 定 how：① **SVG sanitize 配置（安全核心）** ② mermaid 集成（fence 渲染）③ 异步编排+竞态 ④ 懒加载 ⑤ 主题。

约束：ADR-002 红线（必须二次 sanitize，不信任库单独输出）；150KB 首屏闸；mermaid ~数百 KB 必懒加载。
> mermaid 是 diagram 事实标准、无对等替代 → 无"库选型"fork；真正决策点是 **SVG sanitize 方案**（D1）。

---

## D1 — Mermaid SVG sanitize 配置（**安全核心 / 需 Decider 拍板 / `[SECURITY REVIEW REQUIRED]`**）

前提：mermaid `securityLevel:'strict'` + `htmlLabels:false` → 输出**无 foreignObject 的纯 SVG**（标签走 `<text>`）。此 SVG 仍须过 DOMPurify 二次兜底（ADR-002）。怎么配 DOMPurify：

### A. DOMPurify 内置 SVG profile
`DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })`
- **Pros:** DOMPurify 维护的 curated SVG 白名单，跟随上游修 CVE；省维护
- **Cons:** profile 较宽（含 svgFilters 等），放行面比 mermaid 实际所需大；可能含 `<foreignObject>`（虽 strict 不产，但 profile 允许 = 多一层潜在面）

### B. 手卷最小 allowlist
`ADD_TAGS:[svg,g,path,text,rect,line,...]` 精确列 mermaid-strict 实际输出的元素 + 显式 `FORBID_TAGS:[foreignObject,script]`
- **Pros:** 最小放行面、最紧
- **Cons:** 维护负担——mermaid 版本升级输出元素变 → allowlist 漂移 → 图渲染缺元素；需跟版本核对

### C. SVG profile + 显式 FORBID（纵深防御）〔AI 倾向〕
`{ USE_PROFILES:{svg:true,svgFilters:true}, FORBID_TAGS:['foreignObject'], FORBID_ATTR:[/* on* 事件 */] }`
- **Pros:** 用维护良好的 profile（不漂移）+ 显式禁 foreignObject/事件属性（堵 strict 万一回退的面）；profile 修 CVE + 项目加固双层
- **Cons:** 仍带 profile 的较宽基线（但 FORBID 收口关键面）

### 倾向：**C（profile + 显式 FORBID foreignObject/事件）**
不手卷（避免 mermaid 版本漂移导致图破）+ 显式堵 foreignObject（XSS 大头）/ 事件属性。与 securityLevel:strict 三层叠加。**必须人工 security review**：跑恶意 mermaid（图定义注入 `<script>`/`onerror`/foreignObject/外链 `<use href>`/`<image href=javascript>`）→ DOM 级断言无执行。具体 FORBID 清单实现时定稿。反例：profile 基线宽于手卷 (B)，若审出 profile 放行了不该放的，再收紧。

> research-first：选定后核 DOMPurify svg profile 实际放行集 + mermaid strict 输出元素 + 恶意注入测试。

---

## D2 — mermaid 集成（fence 渲染）〔提议〕

- markdown-it 自定义 fence 规则：` ```mermaid ` 块 → 同步输出占位 `<div class="mermaid-pending" data-mermaid="<escaped 源>">`（不在 render 里异步）
- 普通 markdown + KaTeX 仍同步（render 契约不变）
- mermaid 源经 HTML-escape 存进 data 属性（占位本身过 DOMPurify 无害）

## D3 — 异步编排 + 竞态（TBD-v14-2）〔提议〕

PreviewArea（Solid）：
- memo 渲染出含占位的 HTML（同步）
- 渲染后副作用：查 `.mermaid-pending` → 懒加载 mermaid → 逐块 `mermaid.render(id, src)` → **sanitize SVG（D1）** → 替换占位
- **代次令牌**：每次 text 变更 `gen++`；异步渲染完成时若 `gen` 已变 → 丢弃（防串图）
- 失败：单块 try/catch → 占位显错误文本（TBD-v14-4）

## D4 — 懒加载（TBD-v14-3）〔提议〕

`hasMermaid(text)`（探测 ` ```mermaid `）→ 才 `import('mermaid')`（memoized）。mermaid 数百 KB 在 lazy chunk，首屏不含（守闸；size 闸已按首屏算 / F-V13-3）。

## D5 — 主题（TBD-v14-5）〔提议〕

mermaid `initialize({ theme: <M6 dark ? 'dark' : 'default'> })`；M6 主题切换时重渲染已存图（复用代次令牌触发）。

---

## Consequences（选定后）

- api-spec delta：render 占位契约 + PreviewArea 异步编排（代次令牌）+ hasMermaid/ensureMermaid
- test-plan delta：家族 `内容(纯md/单图/多图/图+公式/非法图/恶意 SVG 注入) × 加载 × 异步态(占位/完成/失败/竞态)`；XSS 矩阵扩 mermaid SVG（AC-v14-3 发布门槛）
- 架构 §渲染管线更新；bundle 首屏复核（mermaid 懒加载不计）
- i18n：图渲染失败提示
- security review：D1 sanitize 配置 + 恶意 mermaid 注入测试通过才可 tag v0.5.0

## References

- 共识 v1.4 TBD-v14-1~5
- （待补）mermaid 官方文档 + securityLevel 行为 + 版本 + DOMPurify svg profile 放行集（install/实现时附）
- ADR-002（sanitize 红线）/ ADR-007（懒加载+异步范式）
