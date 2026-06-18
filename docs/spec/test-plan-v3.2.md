# 测试计划 v3.2 delta — 文档统计面板

> **基线：** 共识 v3.2 AC-v32-1~7 + ADR-028。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.2 | 2026-06-18 | 字符 × 词/CJK 一致 × 标题/段落 × 空文档 4 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v32-1 | status bar 点击开/关弹层 | e2e ac25 |
| AC-v32-2 | 字符含/不含空格 | unit（CT-STATS）|
| AC-v32-3 | 词/CJK 与 countWords 一致 | unit（同输入两函数一致）|
| AC-v32-4 | 标题数/段落数 | unit |
| AC-v32-5 | 阅读时长与 countWords 一致 | unit |
| AC-v32-6 | 空文档全零 | unit |
| AC-v32-7 | 零回归（status bar 摘要不变）| 既有 ac14（字数）+ 全量 |

## 家族

- **字符族**：`含空格=text.length × 不含空格=非空白 × 含换行/制表符`
- **一致族**：`computeStats.words/cjk/minutes === countWords 同字段（同输入）`
- **结构族**：`标题数(# ~ ######) × 段落数(空行分隔非空块) × 单段无空行=1 × 全空行=0`
- **边界族**：`空文档全零 × 纯空白 charsNoSpaces=0`

## 入口

- unit：`tests/unit/m1-editor/stats.test.ts`（computeStats）
- e2e：`tests/e2e/ac25-stats.spec.ts`（双引擎：点 status bar 开弹层 + 字段显示）
