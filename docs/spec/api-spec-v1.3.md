# 接口设计 v1.3 delta — KaTeX 公式（M2 渲染管线）

> v1.0 接口增量。仅 M2 渲染管线因 KaTeX 懒加载而扩；其余模块契约不变。
> **基线：** 共识 v1.3（accepted，KaTeX-only）+ ADR-007（D1=@vscode/markdown-it-katex）。
> **data-model：** 无变更（公式是渲染产物，不入持久化；故本版无 data-model delta）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.3 | 2026-06-04 | M2 render 保持同步基底 + KaTeX 懒加载 + load 后 re-render |

---

## 1. M2 渲染管线（扩 v1.0 §3.2，保持同步基底）

```ts
// modules/m2-preview/pipeline.ts
/** 同步渲染：markdown（+ 已加载则含 KaTeX）→ sanitized HTML。契约不变（仍同步返回 string）。 */
export function render(markdown: string): string;

/** 文本是否含 KaTeX 语法（$…$ / $$…$$），决定是否触发懒加载。 */
export function hasMath(markdown: string): boolean;

/** 一次性懒加载 KaTeX 插件 + CSS（动态 import，memoized）。resolve 后 render() 即含公式。 */
export function ensureKatex(): Promise<void>;

/** 插件是否已加载（PreviewArea 决定加载完是否需 re-render）。 */
export function katexReady(): boolean;
```

**关键：** `render()` **签名/同步性不变**（仍 `(md) => string`）。KaTeX 未载时公式按原文输出；`ensureKatex()` 完成后 `render()` 自动产出公式 HTML。

## 2. PreviewArea 衔接（ADR-007 D3 / 共识 TBD-v13-2）

```
createMemo(render(text)):
  - 含 math 且 !katexReady() → 触发 ensureKatex()（不阻塞）；本次输出 raw 公式
  - ensureKatex() resolve → 一个 reactive signal 翻转 → memo 重算 → 公式渲染态
  - 已载 / 无 math → 同步直出
```
仅"插件是否已加载"一个模块级 reactive 状态；无 per-block 异步 / 占位 / 竞态（Mermaid 才需，已推 v1.4）。文本在加载期间继续变更不串（每次 render 都读当前 text）。

## 3. sanitize（ADR-007 D2 / 安全核心 / `[SECURITY REVIEW REQUIRED]`）

- KaTeX `output:'html'`（避 MathML 面）；输出经 **DOMPurify 受控放行**（KaTeX HTML 子集：span/类名/安全 style，**不放行** script/事件属性/SVG）
- markdown 主链路仍默认严格 sanitize
- 实现时定稿 ALLOWED_TAGS/ATTR + 跑恶意 `$` 注入测试（AC-v13-3 发布门槛）

## 4. bundle（ADR-007 D4 / 共识 TBD-v13-4）

KaTeX + 插件 + CSS 全 **动态 import**（Vite lazy chunk）；纯文本文档首屏不含 → `pnpm size` 闸不破（首屏仍 ~68KB）。

## 5. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| `hasMath` / `ensureKatex` / `katexReady` + 懒加载 | ⏳ | v1.3 |
| `render` 含 KaTeX（已载）+ DOMPurify 放行 allowlist | ⏳ | v1.3（security review）|
| PreviewArea load-后-rerender 衔接 | ⏳ | v1.3 |
