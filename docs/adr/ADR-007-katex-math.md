# ADR-007 — KaTeX 数学公式渲染（懒加载 + 受控 sanitize）

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-04：D1 选 `@vscode/markdown-it-katex`；D2~D5 提议确认；D2 安全 allowlist 实现时 security review）|
| **Date** | 2026-06-04 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.3（accepted，KaTeX-only）/ module-list M2 delta / ADR-001 插件挂载点 / ADR-002 sanitize |
| **Supersedes** | — （扩展 M2 渲染管线）|

## Context

共识 v1.3 决定 M2 增挂 KaTeX 公式（懒加载），Mermaid 推 v1.4。TBD-v13-2~5 accept：一次性懒加载 + load 后 re-render / DOMPurify 放行 KaTeX MathML-HTML 子集（安全）/ math 才 import / `$`+`$$` 分隔符。

本 ADR 定 how：① KaTeX markdown-it 插件选型 ② **DOMPurify KaTeX allowlist（安全核心，security review）** ③ 懒加载机制 ④ CSS ⑤ 分隔符配置。

约束：150KB 首屏闸（当前 ~68KB）；ADR-002 sanitize 红线不破；KaTeX `output:'html'` 还是 `'mathml'` 影响 sanitize 面。

---

## D1 — KaTeX markdown-it 插件（**需 Decider 拍板**）

### A. `@vscode/markdown-it-katex`〔AI 倾向〕
- **Pros:** VSCode 团队维护、活跃、现代；`$`/`$$` 分隔 + 转义（"$5" 不误判）处理成熟；与最新 katex 兼容
- **Cons:** +依赖（插件小，katex 本体才是重头，懒加载）

### B. `markdown-it-katex`（原版）
- **Pros:** 最早、用例多
- **Cons:** **久未维护**（数年）、与新 katex peer-dep 冲突、`$` 转义弱 → 不推荐

### C. `markdown-it-texmath`
- **Pros:** 可配多种分隔风格（dollars/brackets）、katex backend、维护中
- **Cons:** API 更重；分隔风格灵活反而需多配；对单一 `$`/`$$` 需求 overkill

### 决策：**A `@vscode/markdown-it-katex`**〔Decider accepted 2026-06-04〕
现代 + 维护活跃 + `$` 转义成熟，正配 TBD-v13-5（`$`/`$$` + "$5" 不误判）。katex 本体懒加载控 bundle。**反例**：若未来要多分隔风格（`\(...\)` 等），texmath (C) 更灵活——届时可换。原版 (B) 维护停滞，排除。

> research-first：选定后 install 核对插件 API + katex 版本 + 实测懒加载 chunk gz；ADR References 附链接 + 访问日期。

---

## D2 — DOMPurify KaTeX allowlist（**安全核心 / `[SECURITY REVIEW REQUIRED]`**）〔提议〕

**红线：** KaTeX 输出（公式 HTML/MathML）当前被默认 `DOMPurify.sanitize` 删；放行必须**最小化**且**不引入可执行向量**。

提议：
- **KaTeX `output: 'html'`**（非 mathml）——输出 `<span class="katex">` 嵌套 + 普通 HTML（span/sup/sub/...），**sanitize 面比 MathML 小**（避开 `<maction>` 等 MathML XSS 向量）
- DOMPurify 配置：在默认严格基础上，仅放行 KaTeX HTML 输出所需的标签/属性（span / 类名 / style 的安全子集）；**不放行** script / 事件属性 / SVG / foreignObject / iframe
- markdown 主链路仍走默认严格 sanitize；KaTeX 放行仅作用于公式片段
- **验证（security review 必做）**：构造恶意 `$...$`（试图经 katex 注入 `<script>` / `onerror` / `\href{javascript:}` / 危险宏）→ 确认 sanitize 后无执行（KaTeX 自身 `trust:false` 默认禁 `\href` 等 + DOMPurify 二次兜底）

> 具体 ALLOWED_TAGS/ATTR 清单在实现时定稿并经 review；AC-v13-3 是发布门槛。

## D3 — 懒加载 + re-render 机制（TBD-v13-2/4）〔提议〕

- M2 模块级 `let katexLoaded = false` + `mdWithKatex`（挂插件后的 markdown-it 实例）
- `render(md)`：含 math 语法（正则探测 `$`）且未载 → 返回基底渲染（公式 raw）+ 触发 `import('katex' + plugin)`（一次性）→ load 完 set signal → PreviewArea re-render（此时用挂了插件的实例）
- 已载 → 同步用 `mdWithKatex` 渲染
- 防重复 import（load promise memoize）

## D4 — KaTeX CSS〔提议〕

KaTeX 需其 CSS（字体度量）。随插件**动态 import** CSS（`import('katex/dist/katex.min.css')`，Vite 处理为 lazy chunk）→ 不进首屏。

## D5 — 分隔符（TBD-v13-5）〔提议〕

`$...$`（inline）+ `$$...$$`（block）；依赖插件 A 的转义规则处理 "$5" 等非公式 `$`（核对其 default escape 行为，必要时配置）。

---

## Consequences（选定后）

- api-spec delta：M2 render 衔接（同步基底 + KaTeX 懒加载 re-render）+ PreviewArea 渲染态
- data-model delta：无（公式是渲染，不入持久化）
- test-plan delta：家族 `内容(纯md/inline/block/混合/含$非公式/恶意$注入) × 加载(首次/已载)`；XSS 矩阵扩 KaTeX 注入（AC-v13-3 发布门槛）
- 架构 §渲染管线更新；bundle 复核 `pnpm size`（首屏不含 katex）+ 懒加载 chunk 实测
- i18n：公式渲染失败提示（如有）

## References

- 共识 v1.3 TBD-v13-1~5（v13-1=b KaTeX-only）
- `katex` 0.17.0 + `@vscode/markdown-it-katex` 1.1.2（2026-06-04 核实）：插件 default 导出 fn；
  研究确认 `output:'html'` 仅产 styled span（无 MathML/SVG）；`trust:false` 中和 `\href{javascript:}`（渲染为红色错误文本）；`throwOnError:false` 非法 LaTeX 显错不崩
- **D2 实测结论（降风险）**：output:'html' 的 styled span **过默认 DOMPurify 即存活**（span/class/style 默认放行）→ **无需放宽 allowlist**（最安全：零新增放行面）；XSS 用 DOM 级断言验（katex.test）
- **实测 bundle**：katex JS 懒加载 chunk ~80KB gz（**不计首屏**）；首屏 66.83KB（无 katex）+ CSS 9.48KB = 76.66KB gz（<150）
- **偏差（记 finding）**：katex CSS 因 vite `cssCodeSplit:false` 仍 eager 进首屏 style.css（TBD-v13-4 期望 CSS 懒加载）；首屏仍 <150 → 非阻塞，v1.3.x 评估翻 cssCodeSplit
- **size 闸修正**：原 sum 整个 dist 含 lazy chunk → 改按 index.html 引用集算首屏（commit `1e2af26`）
- 实现 commit `1e2af26`
- ADR-002（sanitize 红线）/ ADR-001（插件挂载点）
