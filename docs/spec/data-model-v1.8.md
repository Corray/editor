# 数据模型 v1.8 delta — DocRecord +titleManual（手动标题锁）

> v1.6（`data-model-v1.6.md`）的增量。无 DB 版本升级。
> **基线：** 共识 v1.8（accepted）+ ADR-012。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.8 | 2026-06-05 | DocRecord 加可选 `titleManual?: boolean`；DB version 仍 2（schemaless 加字段）|

---

## 1. DocRecord 字段（v1.6 + 增量）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | `D_<uuid>`（不变）|
| `title` | string | v1.6 自动派生；**v1.8：titleManual=true 时为用户手动名** |
| `text` | string | Markdown 源文（不变）|
| `createdAt` | number | 不变 |
| `updatedAt` | number | 不变 |
| `titleManual` | **boolean?（新增）** | true=手动重命名锁定（saveActiveText 不再 deriveTitle）；缺省/false=自动派生 |

## 2. DB 版本与迁移

- **DB version 仍 2**（不升）。IndexedDB object store 内记录是 schemaless 的 → 新增可选字段无需 `onupgradeneeded`。
- **旧记录兼容**：v1.6/v1.7 写入的记录无 `titleManual` 字段 → 读出为 `undefined` → falsy → 自动派生（AC-v18-6，无迁移、无回归）。
- 无新 store / 无新 key。

## 3. 写路径变化（ADR-012 D1）

| 操作 | 行为 |
|------|------|
| saveActiveText(text) | `titleManual` ? 保留 title : `deriveTitle(text)`（v1.6 行为）|
| rename(id, title) | title 非空 → `title=trim`, `titleManual=true`；title 空 → `titleManual=false` + `deriveTitle(text)` |

## 4. 搜索（无持久化变更）

纯运行时：M9 内存 records（含 text）按 `query` 过滤，不落库、不读额外 IO。无数据模型影响。
