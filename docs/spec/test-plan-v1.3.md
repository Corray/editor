# 测试计划 v1.3 delta — KaTeX 公式

> v1.0 测试计划增量。覆盖 KaTeX 公式渲染 + 懒加载 + **XSS 安全（发布门槛）**。
> **基线：** 共识 v1.3 AC-v13-1~5 + ADR-007。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.3 | 2026-06-04 | KaTeX 渲染 / 懒加载 / `$` 不误判 / XSS 注入 家族 |

---

## 1. 验收条件矩阵

| AC | 场景 | 测试 ID | 层 |
|----|------|---------|----|
| AC-v13-1 | `$E=mc^2$` inline / `$$...$$` block → 渲染公式 | UT-KATEX-001 / E2E-v13-001 | unit + e2e |
| AC-v13-2 | 纯文本/普通 md → 不加载 KaTeX（首屏 bundle 不变）| UT-LAZY-002 / size 闸 | unit + CI |
| AC-v13-3 🔴 | 恶意 `$` 注入（script/事件属性/危险宏/href:js）→ sanitize 后无执行 | UT-XSS-003 / E2E-v13-003 | unit + e2e（**发布门槛**）|
| AC-v13-4 | 首次遇公式 → 懒加载 → load 后渲染（raw→渲染 仅首次）| E2E-v13-004 | e2e |
| AC-v13-5 | "$5 和 $10" 等非公式 `$` → 不误判为公式 | UT-KATEX-005 | unit |

## 2. 家族维度枚举

**核心家族：`内容 × 加载态`**

| 维度 | 取值 |
|------|------|
| 内容 | 纯 md / inline `$…$` / block `$$…$$` / 混合（md+公式）/ 含 `$` 非公式（$5）/ **恶意 `$` 注入** |
| 加载态 | 插件未载（首次，raw 输出 + 触发 import）/ 已载（同步渲染）|
| 公式合法性 | 合法公式 / 非法 LaTeX（KaTeX throwOnError:false → 显错不崩）|

**必测组合（不漏网）：**
- XSS × {`$\href{javascript:alert(1)}{x}$` / `$\includegraphics{...}$` / 试图闭合 span 注入 `<script>` / `<img onerror>` 经公式 / MathML 向量（即使 output:html 也验）} → 全部 sanitize 后无执行
- 含 `$` 非公式 × {"$5", "a$b", "$ 单个", 转义 `\$`} → 不误渲染
- 懒加载 × {首次触发 import / 已载同步 / 加载期间文本又变（不串）}
- 合法性 × 非法 LaTeX → throwOnError:false 友好降级

## 3. 用例清单（关键）

| ID | 场景 | 预期 |
|----|------|------|
| UT-KATEX-001 | 已载 render `$x^2$` | 输出含 `class="katex"`，公式 HTML |
| UT-KATEX-005 | render "价格 $5 和 $10" | 不产生 katex span（非公式）|
| UT-LAZY-002 | hasMath('纯文本') = false / hasMath('$x$') = true | 触发判断正确 |
| **UT-XSS-003** | render 恶意公式（`\href{javascript:}` / 注入 script/onerror）已载 | sanitize 后无 script/事件属性/js: href（DOMPurify + katex trust:false 双保险）|
| E2E-v13-001 | 输入 `$$\int_0^1 x dx$$` | 预览渲染出积分公式 |
| E2E-v13-003 | 输入恶意公式 | 无 alert（window.alert spy 未触发）+ 无 script 节点（同 AC1-003 XSS 范式）|
| E2E-v13-004 | 输入公式 | 短暂 raw → 渲染（懒加载 load 后）|

## 4. 测试基础设施（PP-003）

- **KaTeX 输出 sanitize 验证**：unit 直接 render 恶意公式 + 断言无 `<script>`/`[onerror]`/`a[href^=javascript]`（复用 AC1-003 XSS 断言范式）
- **懒加载 unit**：动态 import 在 vitest（vite transform）可直接 await；测 katexReady 翻转
- **bundle**：`pnpm size` 确认首屏不含 katex（lazy chunk 分离）；新增"首屏 chunk 不含 katex"断言可选
- **e2e 懒加载时序**：toHaveText 自动等待 load 后渲染；首次 raw→渲染用 polling

## 5. 回归 + 安全门槛

- 既有 AC-1~6 / AC-v11 / AC-v12 不受影响（KaTeX 是 additive，纯文本路径不变）
- **AC-v13-3（XSS）是发布门槛** —— security review + 测试通过才可 tag v0.4.0
- bundle 首屏 `pnpm size` < 150KB（katex 懒加载不计首屏）
