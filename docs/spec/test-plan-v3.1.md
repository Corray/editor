# 测试计划 v3.1 delta — 预览任务清单交互

> **基线：** 共识 v3.1 AC-v31-1~8 + ADR-027。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.1 | 2026-06-17 | 渲染 × 翻转 × 定位 × XSS 4 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v31-1 | `[ ]`→未勾 / `[x]`/`[X]`→勾 checkbox | unit（render 含 task-checkbox + checked）+ e2e ac24 |
| AC-v31-2 | 点击 → 源行翻转 + 编辑器同步 | unit（toggleTaskAtLine）+ e2e |
| AC-v31-3 | 多任务各自定位准 | unit（toggleTaskAtLine 指定 line）+ e2e |
| AC-v31-4 | 翻转持久化 | e2e（reload 保留）|
| AC-v31-5 | **XSS 门槛**：任务项恶意内容剥离 | unit + e2e 双引擎 |
| AC-v31-6 | 非任务列表不误渲 | unit（普通 `- item` 无 checkbox）|
| AC-v31-7 | 移动预览 tab 可点 | e2e（mobile viewport）|
| AC-v31-8 | 零回归 | 既有全量 |

## 家族

- **渲染族**：`[ ]→空checkbox × [x]/[X]→checked × data-source-line 标在 checkbox × 普通列表项不渲 × 行内 [ ] 非行首不误渲`
- **翻转族**：`toggleTaskAtLine: [ ]→[x] × [x]→[ ] × [X]→[ ] × 指定行精确(多任务不串) × 非任务行原样返回 × 越界行原样`
- **XSS 族**：`任务项含 <script>/onerror/javascript: → 经 sanitize 剥离无 alert`
- **持久化族**：`点击翻转 → M3 防抖 → reload 保留`

## 入口

- unit：`tests/unit/m2-preview/task-list.test.ts`（render + toggleTaskAtLine）
- e2e：`tests/e2e/ac24-tasklist.spec.ts`（双引擎 + mobile viewport；XSS + 持久化）
