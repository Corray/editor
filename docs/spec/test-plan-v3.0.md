# 测试计划 v3.0 delta — 国际化

> **基线：** 共识 v3.0 AC-v30-1~6 + ADR-026。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.0 | 2026-06-17 | 完整性 × 切换 × 持久化 × 首访检测 4 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v30-1 | en dict key 集 == zh（无缺漏）| unit（CT-I18N：两 dict key 集相等 + 都 == EXPECTED_KEYS）|
| AC-v30-2 | 切 English → UI 即时变 | e2e ac23 |
| AC-v30-3 | 语言持久化（刷新保留）| unit（setLang→localStorage）+ e2e |
| AC-v30-4 | 首访 navigator 检测 | unit（mock navigator.language）|
| AC-v30-5 | 坏值回退 | unit |
| AC-v30-6 | 零回归（默认中文不变）| 既有全量 + unit |

## 家族

- **完整性族**：`en key 集 == zh key 集 == EXPECTED_KEYS × 无裸 key（每 key en 值非空且 ≠ key 本身或允许同名如 app.title）× 占位符 {n}/{m} 保留`
- **切换族**：`setLang('en-US') → t() 返英文 × 设置 select 切换 × Solid 重渲染（e2e）`
- **持久化族**：`setLang → localStorage 写 × 重启 hydrate × 坏值/缺失回退`
- **检测族**：`无持久值 + navigator en-US → en × navigator zh-CN → zh × navigator 缺失 → zh`

## 入口

- unit：`tests/unit/m7-i18n/i18n.test.ts`（扩：en 完整性 + 切换 + 持久化 + 检测）
- e2e：`tests/e2e/ac23-i18n.spec.ts`（双引擎：设置切 English → header 文案变英文）
