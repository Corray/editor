# 数据模型 v1.6 delta — 多文档（documents store + DB v2 + 第三次迁移）

> v1.1（`data-model-v1.1.md`）的增量。单文档 → 多文档。
> **基线：** 共识 v1.6（accepted）+ ADR-010。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.6 | 2026-06-05 | 新增 `documents` store + `kv/activeDocId` + DB v1→2 升级 + 单→多迁移 |

---

## 1. IndexedDB Schema（DB version 1→2 / ADR-010 D1）

| 项 | 值 |
|----|----|
| DB name | `editor`（不变）|
| DB version | **2**（v1.1 是 1）|
| store `kv` | 不变 + 新增 key `'activeDocId'` → value `string`（当前文档 id）|
| store `documents`（新增）| `keyPath: 'id'`；记录 `{ id, title, text, createdAt, updatedAt }` |

**onupgradeneeded（version 1→2）：**
```
if (oldVersion < 2) db.createObjectStore('documents', { keyPath: 'id' });
// kv store 已存在（v1），不动；'document' 旧 key 由迁移层处理
```

### documents 记录字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | `D_<uuid>`（ADR-010 D2 / arch-constraints §6 前缀）|
| `title` | string | 自动派生（首 H1/首非空行截断 ~40，空=`Untitled`）；保存时重算 |
| `text` | string | Markdown 源文 |
| `createdAt` | number | epoch ms（创建时）|
| `updatedAt` | number | epoch ms（每次保存更新；列表排序键）|

## 2. 读写映射（替代 v1.1 单 doc 操作）

| 操作 | v1.1（单 doc）| v1.6（多 doc）|
|------|------|------|
| 列表 | — | `idb.getAll('documents')` → 按 updatedAt desc |
| 读 active | `get('kv','document')` | `get('kv','activeDocId')` → `get('documents', id)` |
| 写 active | `put('kv', text, 'document')` | `put('documents', {…doc, text, title:派生, updatedAt:now})` |
| 新建 | — | `put('documents', {id:D_*, title, text, createdAt, updatedAt})` + set activeDocId |
| 切换 | — | `put('kv', id, 'activeDocId')` |
| 删除 | `delete('kv','document')` | `delete('documents', id)`（+ active 失效则切最新/建空）|
| 清空(clear) | 删 doc | 清 **active doc 内容**（`text=''`，保留条目）|

## 3. 第三次迁移层（ADR-010 D3 / 先写后删幂等）

在 `loadInitialDocs()` 内（替代 v1.1 `loadStoredDocument` 的单 doc 逻辑）：
```
1. docs = idb.getAll('documents')
2. docs.length > 0 → return { docs, activeId: get('kv','activeDocId') ?? docs[最新].id }  // 幂等
3. legacy = idb.get('kv','document')      // v1.1 单 doc
4. typeof legacy === 'string':
     id = 'D_' + randomUUID()
     put('documents', { id, title:派生(legacy), text:legacy, createdAt:now, updatedAt:now })
     put('kv', id, 'activeDocId')
     确认成功 → delete('kv','document')    // 先写后删（不可逆前确认）
     return { docs:[那条], activeId:id }
5. 否则（新用户）：建一个空 doc 作首篇（永远 ≥1 篇 / ADR-010 D4）
```

迁移谱系：`editor.document.v1`(ls, v1.0) → `kv/document`(idb, v1.1) → **`documents/D_*`(idb v2, v1.6)**。

## 4. Key/迁移退役清单（增量）

| 项 | v1.6 处置 |
|------|----------|
| `kv/document`（v1.1 单 doc key）| 迁移到 `documents/D_*` 后**删除** |
| `kv/activeDocId` | **新增**（指针）|
| `editor.theme.v1` / `editor.prefs.v1`（localStorage）| **保留**（仍不在范围）|

## 5. 不变量

- 永远 ≥ 1 篇文档（删到空自动建空 doc / ADR-010 D4）
- `activeDocId` 必指向一条存在的 doc（失效则修正为最新）
- 单 store 单写者：仅 M9 写 `documents`（M3 经 `m9.saveActiveText` 间接，ADR-010 D4）
- 迁移幂等：`documents` 非空即视为已迁移，不重复（防刷新重复迁）
