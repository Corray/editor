# 测试计划 v2.7 delta — 格式工具栏

> **基线：** 共识 v2.7 AC-v27-1~8 + ADR-023。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.7 | 2026-06-17 | 包裹 × 行前缀 × 围栏 3 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v27-1 | B/I/code toggle 包裹/解包 | unit（CT-CODE 复用 CT-FMT 范式）+ e2e ac20 |
| AC-v27-2 | 链接占位 | 既有 CT-FMT-8 回归 |
| AC-v27-3 | 引用/无序/有序行前缀 + 有序递增 | unit（CT-LP）+ e2e |
| AC-v27-4 | 行前缀 toggle 去除 | unit |
| AC-v27-5 | 代码块围栏 | unit（CT-CB）+ e2e |
| AC-v27-6 | 工具栏操作 undo | e2e（chromium，F-V21-1 同限）|
| AC-v27-7 | 移动端工具栏可见可点 | e2e（mobile viewport）|
| AC-v27-8 | 零回归 | 既有全量 |

## 家族

- **包裹族**：`code 单 ` toggle（包裹/选区自带解/紧邻解）× 无选区空包裹 × 不误吞既有 B/I`
- **行前缀族**：`quote/ul 单行 × 多行整体 × ol 逐行递增(1.2.3.) × toggle 全带→去除 × 部分带→补齐 × 选区保持`
- **围栏族**：`有选区包 ``` × 无选区空围栏光标置内`

## 入口

- unit：`tests/unit/m1-editor/commands.test.ts`（追加 CT-CODE/CT-LP/CT-CB）
- e2e：`tests/e2e/ac20-toolbar.spec.ts`（双引擎 + 移动 viewport；undo chromium only）
