# 测试计划 v3.7 delta — 主题增强（强调色）

> **基线：** 共识 v3.7 AC-v37-1~6 + ADR-033。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.7 | 2026-06-22 | 持久化 × 应用 × 默认零变化 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v37-1 | 选强调色 → accent 即时变 | unit（setAccentColor + data-accent）+ e2e ac30 |
| AC-v37-2 | 持久化 | unit（往返）+ e2e |
| AC-v37-3 | 浅深各有值 | unit（CSS 规则存在性弱验）/ 人工 |
| AC-v37-4 | 默认蓝零变化 | unit（默认无 data-accent）|
| AC-v37-5 | 坏值回退默认 | unit |
| AC-v37-6 | 零回归 | 既有全量 |

## 家族

- **持久化族**：`set→localStorage→hydrate × 坏值/非档位回 blue × 缺字段回 blue`
- **应用族**：`accentColor='green' → dataset.accent='green' × 'blue' → 删 data-accent`
- **回归族**：`默认 blue → 无 data-accent（变量默认）× 既有 settings 项不受影响`

## 入口

- unit：`tests/unit/m13-settings/settings.test.ts`（追加 accentColor 用例）
- e2e：`tests/e2e/ac30-accent.spec.ts`（双引擎：选色 → data-accent + 持久化）
