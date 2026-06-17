# 测试计划 v2.9 delta — 设置面板（M13）

> **基线：** 共识 v2.9 AC-v29-1~8 + ADR-025。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.9 | 2026-06-17 | 持久化 × 快照间隔 × 上限 × 默认零行为变化 4 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v29-1 | ⚙ 开面板 / Esc 关 | e2e ac22 |
| AC-v29-2 | 关闭自动快照 → 不产 auto | unit（CT-SET + manager settings 注入）|
| AC-v29-3 | 改间隔档生效 | unit |
| AC-v29-4 | 改上限档 FIFO 按新值 | unit（putSnapshot maxPerDoc）|
| AC-v29-5 | 持久化 + 坏数据回退默认 | unit（CT-SET）|
| AC-v29-6 | **默认零行为变化** | unit（无 settings 注入 → 原常量；既有 snapshots 测试回归）|
| AC-v29-7 | 语言只读占位 | e2e |
| AC-v29-8 | 零回归 | 既有全量 |

## 家族

- **持久化族**：`存→读往返 × 坏 JSON 回退默认 × 缺字段回退默认 × 非档位值回退默认 × localStorage 不可用回退`
- **间隔族**：`enabled=false → maybeAutoSnapshot 不存 × 间隔改 1min → 按 60000 阈值 × 默认 5min 不变`
- **上限族**：`putSnapshot(rec, 10) → 超 10 FIFO × 默认无参 → 30`
- **零行为族**：`createDocManager 无 settings → 间隔/上限回退原常量（既有 CT-SNAP 全过）`

## 入口

- unit：`tests/unit/m13-settings/settings.test.ts`（持久化/anti-poisoning）+ `m9-doc-manager/snapshots.test.ts`（追加 settings 注入用例）
- e2e：`tests/e2e/ac22-settings.spec.ts`（双引擎：⚙ 开关面板 + 改设置持久化）
