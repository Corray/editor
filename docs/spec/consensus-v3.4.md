# 共识文档 v3.4 — markdown 扩展包（emoji / 脚注 / 上下标）

> v1.0 共识增量 delta（2026-06-17 第三批 scope 第四项 / 压轴）。
>
> **状态：** `accepted`（2026-06-18；TBD-v34-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M2 delta → ADR-030 → api/test-plan delta → 实现
> **命名：** semver tag **v1.14.0-rc.1**。L2（扩 M2 渲染管线，markdown-it 插件叠加）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.4-draft | 2026-06-17 | emoji `:smile:` / 脚注 `[^1]` / 上下标 `~sub~`/`^sup^`（懒加载）；3 TBD |
| v3.4 | 2026-06-18 | TBD-v34-1~3 全部拍板（全 a）→ accepted；版本 emoji 3.0.0/footnote 4.0.0/sub 2.0.0/sup 2.0.0 |

---

## 1. 动机与范围

补常见 markdown 扩展语法（emoji shortcode / 脚注 / 上下标）。锦上添花，价值偏低（PM 已知，纳入打磨批压轴）。

**范围（仅）：** emoji + 脚注 + 上下标 markdown-it 插件叠加 + 懒加载。
**不在本次：** 定义列表 / 缩写 / 容器（::: ）/ 自定义 emoji。

---

## 2. 张力

### 张力 A — 依赖 + 首屏体积
emoji 全量 shortcode 数据 ~50KB。复用 katex/mermaid/hljs 的**懒加载**范式：含扩展语法（`hasExtension` 启发式）才加载，首屏不含（保 size 闸）。脚注/上下标插件极小，并入同一 lazy chunk。

### 张力 B — 安全
emoji 渲染 Unicode 字符（安全）；脚注渲染 `<a>/<section>/<ol>`、上下标 `<sub>/<sup>`——均 DOMPurify 默认放行（探针验），经 render() 既有 sanitize，不放宽。

---

## 3. 待确认项（TBD-v34-x）

### TBD-v34-1 — 扩展集
- **(a) emoji + 脚注 + 上下标**（一次叠齐常见三项）〔AI 倾向〕
- (b) 仅 emoji + 脚注
- (c) 仅 emoji

### TBD-v34-2 — emoji 实现
- **(a) markdown-it-emoji 插件**（全量 shortcode，标准/维护好；data 随 lazy chunk）〔AI 倾向：用户期望全量〕
- (b) 自定义小子集（~30 常用，无依赖，但覆盖窄）

### TBD-v34-3 — 加载
- **(a) 懒加载**（`hasExtension` 启发式触发，katex/mermaid/hljs 范式；首屏不含，保 size 闸）〔AI 倾向〕
- (b) eager（首屏 +emoji data ~50KB，破范式）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 delta（+扩展包懒加载）| §M2 |
| **ADR-030** | markdown-it-emoji/footnote/sub/sup 懒加载（hasExtension + ensureExtensions，katex 范式）+ 安全（默认 sanitize 放行 sub/sup/footnote 结构）+ 首屏不含 | L2 |
| api-spec delta | pipeline hasExtension / ensureExtensions / extensionsReady（katex 三件套同构）| 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`emoji(:smile:→😄) × 脚注([^1] 渲染 ref+def) × 上下标(~x~→sub / ^x^→sup) × 未载降级(raw) × XSS(恶意不逃逸) × 首屏不含(size 闸)` | 覆盖 |

---

## 5. 验收条件（AC-v34-x）

- AC-v34-1：`:smile:` 等 emoji shortcode → 渲染 emoji 字符（加载后）
- AC-v34-2：脚注 `[^1]` + `[^1]: def` → 渲染引用上标 + 底部定义
- AC-v34-3：`~sub~` → `<sub>`，`^sup^` → `<sup>`
- AC-v34-4：扩展库为 lazy chunk，首屏体积不增（size 闸守）
- AC-v34-5：未加载期间含扩展语法 → 降级 raw（不报错），加载后重渲染
- AC-v34-6：**XSS 门槛**：扩展语法承载恶意内容经 sanitize 剥离（双引擎）
- AC-v34-7：既有零回归（katex/mermaid/hljs/task list/frontmatter 渲染）

> 安全面：扩展输出（emoji 字符 / sub/sup/footnote 结构）经 render() 既有 DOMPurify 默认配置放行（探针验），不放宽 allowlist（ADR-002）。
