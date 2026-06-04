# 接口设计 v1.4 delta — Mermaid 图（M2 异步渲染）

> v1.0 接口增量。M2 渲染管线增 Mermaid 占位 + 异步编排；其余契约不变。
> **基线：** 共识 v1.4（accepted）+ ADR-008（D1=profile+FORBID）。
> **data-model：** 无变更（图是渲染产物，不入持久化）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.4 | 2026-06-04 | render 出 mermaid 占位 + PreviewArea 异步逐块渲染（代次令牌防竞态）|

---

## 1. M2 渲染管线（扩 v1.3）

```ts
// modules/m2-preview/pipeline.ts
/** 同步渲染。``​`mermaid 块 → 占位 <div class="mermaid-pending" data-mermaid="<escaped>">；
 *  markdown + 已载 KaTeX 仍同步。契约仍同步返回 string。 */
export function render(markdown: string): string;

/** 文本是否含 ``​`mermaid 块（决定是否懒加载 mermaid）。 */
export function hasMermaid(markdown: string): boolean;

/** 一次性懒加载 mermaid（动态 import，memoized）+ initialize（securityLevel:strict,
 *  htmlLabels:false, theme 跟随 M6）。 */
export function ensureMermaid(theme: 'default' | 'dark'): Promise<void>;

/** 渲染单个 mermaid 源 → **sanitized** SVG（DOMPurify svg profile + FORBID foreignObject/事件）；
 *  失败 → 抛（调用方 catch 显错占位）。 */
export function renderMermaid(src: string): Promise<string>;
```

**关键：** `render()` 仍同步返回 string；mermaid 块只输出**占位**（不在 render 里异步）。占位本身过 render 的 DOMPurify（无害 div）。

## 2. PreviewArea 异步编排（ADR-008 D3 / 共识 TBD-v14-2,4）

```
let gen = 0  // 代次令牌
createEffect on text():
  gen++  ; const myGen = gen
  // memo 已同步渲染含占位的 HTML
  queueMicrotask 后：
    const pendings = preview.querySelectorAll('.mermaid-pending')
    if (pendings.length) {
      await ensureMermaid(theme)          // 懒加载（首次）
      for (块 of pendings) {
        try { svg = await renderMermaid(块.dataset.mermaid) }
        catch { svg = 错误占位 }
        if (gen !== myGen) return          // 竞态：文本已变 → 丢弃
        块.replaceWith(parsed svg)
      }
    }
```
**竞态保护：** 每次 text 变 gen++；异步渲染完成时 gen ≠ myGen → 丢弃过期结果（不串图）。

## 3. SVG sanitize（ADR-008 D1 / 安全核心 / `[SECURITY REVIEW REQUIRED]`）

`renderMermaid` 内：mermaid strict 出 SVG → `DOMPurify.sanitize(svg, { USE_PROFILES:{svg:true,svgFilters:true}, FORBID_TAGS:['foreignObject'], FORBID_ATTR:[事件属性] })`。三层：strict → htmlLabels:false → DOMPurify profile+FORBID。实现时定稿 FORBID 清单 + 恶意 mermaid 注入测试（AC-v14-3 发布门槛）。

## 4. bundle（ADR-008 D4）

mermaid（数百 KB）动态 import lazy chunk；无图文档首屏不含（首屏闸按 index.html 算 / F-V13-3 已修）。

## 5. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| `hasMermaid` / `ensureMermaid` / `renderMermaid`（+sanitize）| ⏳ | v1.4（security review）|
| render mermaid 占位 | ⏳ | v1.4 |
| PreviewArea 异步编排 + 代次令牌防竞态 + 失败降级 + 主题 | ⏳ | v1.4 |
