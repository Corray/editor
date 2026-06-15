# 数据模型 v2.6 delta — 版本快照（snapshots store + DB v3）

> v1.6（`data-model-v1.6.md`）的增量。新增本地版本快照。
> **基线：** 共识 v2.6（accepted）+ ADR-022。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.6 | 2026-06-15 | 新增 `snapshots` store + index `byDoc` + DB v2→3（additive，零迁移）|

---

## 1. IndexedDB Schema（DB version 2→3 / ADR-022 D1）

| 项 | 值 |
|----|----|
| DB name | `editor`（不变）|
| DB version | **3**（v1.6 是 2）|
| store `kv` / `documents` | **不变**（v3 升级不读不改不删）|
| store `snapshots`（新增）| `keyPath: 'id'`；index `byDoc`（keyPath `docId`，非唯一）|

**onupgradeneeded（version 2→3）：**
```
if (oldVersion < 3 && !db.objectStoreNames.contains('snapshots')) {
  const s = db.createObjectStore('snapshots', { keyPath: 'id' });
  s.createIndex('byDoc', 'docId');
}
// kv / documents 已存在，不动 —— additive，零数据迁移（AC-v26-6 升级零损）
```

### snapshots 记录字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | `SN_<uuid>`（arch-constraints §6 前缀）|
| `docId` | string | 所属文档 `D_<uuid>`（index byDoc）|
| `title` | string | 快照时文档标题（列表展示用）|
| `text` | string | 快照时文档全文 |
| `createdAt` | number | epoch ms（快照产生时；列表排序键 + auto 间隔判定）|
| `kind` | `'auto' \| 'manual' \| 'restore'` | 产生来源（徽标展示；不影响配额规则）|

## 2. 读写映射

| 操作 | 实现 |
|------|------|
| 存快照 | `db.put('snapshots', rec)` → prune（按 byDoc 取全部，超 30 删最旧 createdAt）|
| 列某文档快照 | `db.getAllFromIndex('snapshots', 'byDoc', docId)` → createdAt desc |
| 删某文档全部快照（cascade）| `byDoc` 游标遍历删 / getAllKeys + 批删 |

## 3. 配额（ADR-022 D3）

- `MAX_SNAPSHOTS_PER_DOC = 30`，FIFO 删最旧（不分 kind）
- 超大文档（374KB）30 张 ≈ 11MB/文档；IDB 配额内，耗尽由既有写失败路径兜底

## 4. 不变量

- 快照 immutable（产生后不改）；恢复 = 读快照 text 灌回 documents，不改快照本身
- 快照不进 documents/kv/RLS scope（M11 零变化 / ADR-022 D5）
- 降级态（IDB 不可用）→ snapshots 操作全 no-op
