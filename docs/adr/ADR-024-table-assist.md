# ADR-024 — 表格编辑辅助：insertTable + Tab 单元格导航

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-17：D1=insertTable 2 列模板 / D2=isTableRow `\|` 起头判定 / D3=tableCellNav Tab 分流 + 新行 / D4=EditorArea keydown 集成）|
| **Date** | 2026-06-17 |
| **Decider** | FE (Corray，共识 v2.8 TBD 全拍) |
| **Context** | 共识 v2.8 / ADR-020（Tab 缩进 indentSelection）/ ADR-023（FormatToolbar）|

## D1 — insertTable（TBD-v28-1a）

`insertTable(ta)`：插入 2 列模板（经 replaceRange 保 undo），光标选中首单元格占位文本：
```
| 列1 | 列2 |
| --- | --- |
| 单元格 | 单元格 |
```
工具栏第 9 按钮「⊞」触发。

## D2 — 表格行判定（TBD-v28-3a）

`isTableRow(line)`：`line.trim().startsWith('|')`。简单稳健；非 `|` 起头的表格变体（无前导管道）不支持 → 文档化限制。

## D3 — tableCellNav（TBD-v28-2a）

`tableCellNav(ta, reverse): boolean`（返回 true = 已处理，调用方 preventDefault）：

- 仅当光标所在行 `isTableRow` 才处理；否则返 false（交回 v2.4 缩进）
- **单元格 = 行内 `|` 分隔的区间**（去首尾空 segment）。定位光标当前单元格 index → 目标 = index ± 1
- 行内还有下一单元格 → 选中其 trim 后文本区间（无文本则光标置该单元格内）
- 行末单元格 + 正向 → 跳下一行首单元格；**下一行非表格行/不存在 → 在当前表格末尾新增一行**（同列数空单元格 `| 单元格 | 单元格 |`），光标落新行首单元格
- 行首单元格 + 反向（Shift+Tab）→ 跳上一行末单元格；已是首行 → 不动作（返 true 吞掉，不缩进）
- 经 replaceRange（新增行）/ setSelectionRange（纯跳转）

## D4 — EditorArea keydown 集成

Tab 分流（在既有 v2.4 Tab 分支前插）：
```
if (e.key === 'Tab' && !mod && !allowTabOnce) {
  if (tableCellNav(taRef, e.shiftKey)) { e.preventDefault(); return; }  // 表格行 → 单元格导航
  // 否则落入既有 indentSelection（v2.4）
}
```
`allowTabOnce`（a11y 逃逸）仍先于二者——Esc 后 Tab 放行焦点，不进表格导航也不缩进。

## Consequences

- api-spec delta：commands +insertTable / tableCellNav / isTableRow；FormatToolbar +表格按钮（9）；EditorArea Tab 分流
- i18n：`fmt.table`
- test-plan delta：插入 × Tab 导航（行内/跳行/末行新增/反向）× 判定 × 非表格行缩进零回归
- 无 data-model / 无安全面
- 限制：无列宽对齐美化（textarea 等宽下管道符不齐）；非 `|` 起头表格不支持单元格导航
