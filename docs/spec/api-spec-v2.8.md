# 接口设计 v2.8 delta — 表格编辑辅助

> **基线：** 共识 v2.8（accepted）+ ADR-024。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.8 | 2026-06-17 | commands +insertTable/tableCellNav/isTableRow；FormatToolbar +表格按钮；EditorArea Tab 分流 |

---

## 1. commands 扩展（ADR-024 D1~D3）

```ts
/** 插入 2 列表格模板（表头+分隔+数据行），光标选中首单元格占位。 */
export function insertTable(ta: HTMLTextAreaElement): void;
/** 当前行是否表格行（trim 后 | 起头）。 */
export function isTableRow(line: string): boolean;
/**
 * 表格行内 Tab 单元格导航（reverse=Shift+Tab）。返回 true=已处理（调用方 preventDefault）。
 * 非表格行返 false（交回缩进）。末单元格跳下行/末行新增；行首反向跳上行末。
 */
export function tableCellNav(ta: HTMLTextAreaElement, reverse: boolean): boolean;
```

## 2. 装配

- FormatToolbar +第 9 按钮 `{ key: 'table', label: '⊞', run: insertTable }`
- EditorArea keydown：Tab 分支先试 `tableCellNav`（true → preventDefault return），否则 `indentSelection`（v2.4）；`allowTabOnce` 仍最先
- i18n：`fmt.table`

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| commands insertTable / isTableRow / tableCellNav（含 tableCells `\|` 位置切分）| ✓ | `13a409c` |
| FormatToolbar 表格按钮（9）| ✓ | `13a409c` |
| EditorArea Tab 分流（tableCellNav 先于 indentSelection，allowTabOnce 最先）| ✓ | `13a409c` |
| i18n fmt.table（+EXPECTED_KEYS）| ✓ | `13a409c` |

> 测试：unit +9（CT-TBL：判定/插入/行内跳/反向/跳行/末行新增/非表格行/首行吞）→ 283；e2e +4 用例双引擎（ac21）→ 156+4skip。首屏 91.52KB。
