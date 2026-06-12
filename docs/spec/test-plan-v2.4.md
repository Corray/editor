# 测试计划 v2.4 delta — 编辑细节打磨包

> **基线：** 共识 v2.4 AC-v24-1~7 + ADR-020。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.4 | 2026-06-12 | 缩进 × 帮助 × TOC 高亮 3 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v24-1/2 | 单光标插入/行删；多行整体加减 + 选区保持 | unit（CT-IND）+ e2e ac17 |
| AC-v24-3 | 缩进 undo | e2e（chromium，F-V21-1 同限）|
| AC-v24-4 | Esc 后 Tab 放行焦点 | e2e |
| AC-v24-5 | 按钮/Cmd+/ 唤起 + Esc 关 + 条目齐全 | e2e |
| AC-v24-6 | 滚动跟随高亮；无标题无高亮 | unit（CT-AOI 纯函数）+ e2e |
| AC-v24-7 | 零回归 | 既有全量 |

## 家族

- **缩进族**：`单光标 Tab(插2空格) × 单光标 Shift+Tab(行首删≤2/不足删尽/0 no-op) × 多行选区加(每行+2 选区扩) × 多行减 × 部分行无缩进的混合减 × undo`
- **高亮族**：`topLine 在两标题间(取前者) × 首标题前(-1) × 恰在标题行 × 空 items(-1)`
- **帮助族**：`按钮开 × Cmd+/ 开 × Esc 关 × 遮罩点击关 × 条目数=8`

## 入口

- unit：`tests/unit/m1-editor/commands.test.ts`（追加 CT-IND）/ `tests/unit/m12-outline/outline.test.ts`（追加 CT-AOI）
- e2e：`tests/e2e/ac17-polish.spec.ts`（双引擎；undo 用例 chromium only）
