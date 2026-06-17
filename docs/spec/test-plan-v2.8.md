# 测试计划 v2.8 delta — 表格编辑辅助

> **基线：** 共识 v2.8 AC-v28-1~6 + ADR-024。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.8 | 2026-06-17 | 插入 × Tab 导航 × 判定 3 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v28-1 | 插入模板 + 光标落首单元格 | unit（CT-TBL）+ e2e ac21 |
| AC-v28-2 | 行内 Tab 跳单元格 + Shift+Tab 反向 | unit + e2e |
| AC-v28-3 | 末单元格跳下行 / 末行新增行 | unit |
| AC-v28-4 | 非表格行 Tab 仍缩进（零回归）| unit + e2e |
| AC-v28-5 | 插入/导航 undo | e2e（chromium）|
| AC-v28-6 | 零回归 | 既有全量 |

## 家族

- **插入族**：`模板 3 行结构正确 × 光标选中首单元格占位`
- **导航族**：`行内跳下一单元格(选中文本) × Shift+Tab 反向 × 末单元格→下行首 × 末行末单元格→新增同列数空行 × 首行行首 Shift+Tab 不动作(吞掉)`
- **判定族**：`| 起头 → true × 普通行 → false × 非表格行 Tab 落 indentSelection`

## 入口

- unit：`tests/unit/m1-editor/commands.test.ts`（追加 CT-TBL）
- e2e：`tests/e2e/ac21-table.spec.ts`（双引擎；undo chromium only）
