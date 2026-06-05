# 接口设计 v1.7 delta — 滚动同步（M10 + M2 source-line）

> v1.0 接口增量。M2 render 加 data-source-line；新增 M10 ScrollSync。
> **基线：** 共识 v1.7（accepted）+ ADR-011。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.7 | 2026-06-05 | render 出 data-source-line（ADD_ATTR）+ createScrollSync + editor/preview scroll ref |

---

## 1. M2 render — source-line 标注（ADR-011 D1,D2）

```ts
// pipeline.ts
// core.ruler 'source_line'：块开始 token（map && nesting===1）→ attrSet data-source-line=map[0]
// render：DOMPurify.sanitize(html, { ADD_ATTR: ['data-source-line'] })
export function render(markdown: string): string; // 契约不变（仍 string），块元素带 data-source-line
```

**安全（`[SECURITY REVIEW REQUIRED]` / ADR-011 D2）：** ADD_ATTR 仅放行惰性数字属性 data-source-line；标签/事件/url 严格不变。AC-v17-5 XSS 复验发布门槛。

## 2. M10 ScrollSync（新增 / ADR-011 D5）

```ts
// modules/m10-scroll-sync/sync.ts
export interface ScrollSync { dispose(): void; }
/** 装编辑↔预览双向滚动同步（source-line 映射 + 反馈环防护）。返回 dispose 卸载监听。 */
export function createScrollSync(
  editorEl: HTMLTextAreaElement,
  previewEl: HTMLElement,
  lineHeight: number,
): ScrollSync;
```

编排（AppShell 桌面双栏）：
```
createEffect:
  if viewport()==='desktop' && editorEl && previewEl:
    const sync = createScrollSync(editorEl, previewEl, lh)
    onCleanup(() => sync.dispose())   // viewport 切移动 / 卸载时拆监听
```

反馈环（D3）：`let syncing=false`；驱动方 scroll → `syncing=true` → 设被驱动方 scrollTop → `requestAnimationFrame(()=>syncing=false)`；被驱动方 scroll handler `if(syncing)return`。

## 3. Editor / Preview scroll ref 暴露

- EditorArea：textarea 元素 ref 上抛（供 createScrollSync）
- PreviewArea：滚动容器（.preview-pane）ref 上抛

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| M2 source_line core rule + render ADD_ATTR data-source-line | ⏳ | — |
| M10 createScrollSync（映射 + 双向 + 反馈环防护 + dispose）| ⏳ | — |
| AppShell 桌面双栏 createEffect 挂载 + onCleanup + editor/preview ref | ⏳ | — |
| XSS 复验（ADD_ATTR 不破防 / AC-v17-5）| ⏳ | — |
