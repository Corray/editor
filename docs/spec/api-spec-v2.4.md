# 接口设计 v2.4 delta — 编辑细节打磨包

> **基线：** 共识 v2.4（accepted）+ ADR-020。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.4 | 2026-06-12 | commands +indentSelection；outline +activeOutlineIndex；OutlinePanel +activeIndex；HelpDialog；i18n help.* |

---

## 1. 接口

```ts
// m1-editor/commands.ts
/** Tab/Shift+Tab 缩进（2 空格）。单光标插入/行首删；选区覆盖行整体，单次 replaceRange（一步 undo） */
export function indentSelection(ta: HTMLTextAreaElement, dedent: boolean): void;

// m12-outline/outline.ts
/** ≤ topLine 的最后一个标题 index；无 → -1（纯函数） */
export function activeOutlineIndex(items: OutlineItem[], topLine: number): number;

// m12-outline/OutlinePanel.tsx
export interface OutlinePanelProps {
  items: Accessor<OutlineItem[]>;
  onJump: (item: OutlineItem) => void;
  activeIndex?: Accessor<number>; // 新增：当前 section 高亮
}

// m1-editor/HelpDialog.tsx
export function HelpDialog(props: { open: boolean; onClose: () => void }): JSX.Element;
```

## 2. 装配

- EditorArea keydown +Tab/Shift+Tab（`allowTabOnce` Esc 放行）
- AppShell：helpOpen 信号 + header ⌨ 按钮 + main 级 Cmd+/ 捕获；editor scroll rAF 节流 → topLine → activeIdx memo → OutlinePanel
- i18n：`help.button/help.title` + `help.k.find/bold/italic/link/indent/list/help/esc`

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| indentSelection + EditorArea Tab/Esc 编排 | ✓ | `f780847` |
| activeOutlineIndex + OutlinePanel activeIndex + AppShell scroll 监听 | ✓ | `f780847` |
| HelpDialog + header 按钮 + Cmd+/（**window 级监听**——WebKit 点按钮不转移焦点，main 冒泡收不到 Esc，实现期 e2e 捕获修正）| ✓ | `f780847` |
| i18n help.*（+EXPECTED_KEYS）| ✓ | `f780847` |

> 测试：unit +11（CT-IND×7 / CT-AOI×4）→ 249；e2e +5 用例（ac17，9 pass + 1 webkit undo skip）→ 131 + 3 skip。首屏 87.61KB。
