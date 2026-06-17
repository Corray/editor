# 接口设计 v2.7 delta — 格式工具栏

> **基线：** 共识 v2.7（accepted）+ ADR-023。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.7 | 2026-06-17 | applyFormat +'code'；+toggleLinePrefix/wrapCodeBlock；FormatToolbar；i18n fmt.* |

---

## 1. commands 扩展（ADR-023 D1~D3）

```ts
export type FormatKind = 'bold' | 'italic' | 'link' | 'code'; // +code
export function applyFormat(ta: HTMLTextAreaElement, kind: FormatKind): void;

export type LinePrefixKind = 'quote' | 'ul' | 'ol';
/** 选中行整体加/去前缀（toggle：全带→去除；ol 逐行递增）。单次 replaceRange。 */
export function toggleLinePrefix(ta: HTMLTextAreaElement, kind: LinePrefixKind): void;

/** 选区包进 ``` 围栏（独立行）；无选区插空围栏光标置内。 */
export function wrapCodeBlock(ta: HTMLTextAreaElement): void;
```

## 2. FormatToolbar 组件

```ts
// m1-editor/FormatToolbar.tsx
export interface FormatToolbarProps {
  /** 取当前 textarea（EditorArea 持 taRef）；null 时按钮 no-op。 */
  editor: () => HTMLTextAreaElement | undefined;
}
// 8 按钮 → applyFormat('bold'|'italic'|'code'|'link') / toggleLinePrefix('quote'|'ul'|'ol') / wrapCodeBlock
// 点击后回焦 textarea（保持编辑流）
```

## 3. 装配

- EditorArea：FindBar 之下渲染 `<FormatToolbar editor={() => taRef} />`
- i18n：`fmt.bold/fmt.italic/fmt.code/fmt.link/fmt.quote/fmt.ul/fmt.ol/fmt.codeblock`（aria-label + title）
- main.css：`.format-toolbar`（flex + overflow-x:auto 移动横滚）

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| commands applyFormat+'code' / toggleLinePrefix / wrapCodeBlock | ✓ | `c3139d8` |
| FormatToolbar 组件（mousedown preventDefault 保选区）+ EditorArea 装配 | ✓ | `c3139d8` |
| i18n fmt.*（+EXPECTED_KEYS）| ✓ | `c3139d8` |
| .format-toolbar CSS（移动横滚）| ✓ | `c3139d8` |

> 测试：unit +11（CT-CODE×3 / CT-LP×6 / CT-CB×2）→ 274；e2e +5 用例（ac20，9 pass + 1 webkit undo skip，含移动 viewport 可见）→ 148+4skip。首屏 91.19KB。
