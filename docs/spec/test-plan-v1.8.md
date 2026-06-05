# 测试计划 v1.8 delta — 多文档增强（rename + search）

> v1.0 测试计划增量。覆盖重命名 + 标题锁 + 搜索过滤。
> **基线：** 共识 v1.8 AC-v18-1~6 + ADR-012 + data-model v1.8。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.8 | 2026-06-05 | 重命名(提交/空回退/Esc) + titleManual 锁 + 搜索(标题/内容/清空) |

---

## 1. 家族维度（枚举）

`重命名(提交非空 / 提交空→回退自动 / Esc 取消) × 标题锁(改名后编辑内容不覆盖 / 自动文档编辑仍派生) × 搜索(标题命中 / 内容命中 / 无果 / 清空恢复) × 兼容(旧记录无 titleManual → 自动)`

rename + titleManual + search 过滤逻辑可单测（M9 manager，fake-indexeddb）；内联编辑 UI + 搜索框走 e2e。

## 2. AC ↔ 测试映射

| AC | 场景 | 层级 | 测试 |
|----|------|------|------|
| AC-v18-1 | 双击标题→改名→Enter→列表显示新名 | e2e | E2E-v18-001 |
| AC-v18-2 | **改名后编辑内容→标题不被覆盖（titleManual 锁 / 解 F-V16-2）** | 单测+e2e | UT-M9-rename-lock / E2E-v18-002 |
| AC-v18-3 | 重命名为空→回退自动派生 | 单测 | UT-M9-rename-empty |
| AC-v18-4 | Esc/失焦取消→保留原标题 | e2e | E2E-v18-004 |
| AC-v18-5 | 搜索标题或内容命中过滤；清空恢复全部 | 单测+e2e | UT-M9-search（标题/内容/清空）+ E2E-v18-005 |
| AC-v18-6 | 旧记录无 titleManual→仍自动派生（兼容） | 单测 | UT-M9-legacy-autotitle |

## 3. 关键测试纪律

- **titleManual 锁是核心**（解 F-V16-2）：UT-M9-rename-lock 必验"rename → saveActiveText(新内容) → title 不变"（锁住）；对照 UT 验自动文档 saveActiveText 仍派生
- **搜索内容命中**：UT-M9-search 造两篇——标题不含 query 但 text 含 → query 命中（验内容搜，非仅标题）
- **空重命名回退**：UT-M9-rename-empty 验 titleManual 回 false + title 重新派生自 text
- **e2e 内联编辑**：双击 → input 出现 → 填值 + Enter → 列表更新；Esc → 原值（取消语义）

## 4. 不测 / 边界

- 不测搜索高亮/跳转（仅过滤列表，共识范围外）
- 不测分组/标签/拖拽（非本次）
- 超大量文档搜索 perf（同 F-V16-5，未压测）
