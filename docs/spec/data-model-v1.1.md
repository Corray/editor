# 数据模型 v1.1 delta — IndexedDB + 迁移层

> v1.0（`data-model-v1.0.md`）的增量。持久化后端 localStorage → IndexedDB。
> **基线：** 共识 v1.1（accepted）+ ADR-005（accepted，D5 schema）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.1 | 2026-06-03 | IndexedDB schema + 迁移层；`editor.document.v1` localStorage key 退役 |

---

## 1. IndexedDB Schema（ADR-005 D5）

| 项 | 值 |
|----|----|
| DB name | `editor` |
| DB version | `1` |
| object store | `kv`（out-of-line key，无 keyPath / 无 autoIncrement）|
| 文档记录 | key `'document'` → value `string`（Markdown 源文）|

**onupgradeneeded（version 0→1）：** `db.createObjectStore('kv')`。

**扩展预留：** 未来多文档（v1.2+）新增 `documents` store，不动 `kv`。

## 2. 读写映射（替代 v1.0 localStorage 操作）

| 操作 | v1.0 | v1.1 |
|------|------|------|
| 读初始文档 | `localStorage.getItem('editor.document.v1')`（同步）| `idb.get('kv','document')`（异步）|
| 写文档 | `localStorage.setItem(...)` | `idb.put('kv', text, 'document')` |
| 清空 | `localStorage.removeItem(...)` | `idb.delete('kv','document')` |

## 3. 迁移层（共识 TBD-v11-2 (a) / ADR-005 D3）

一次性、幂等，在 `loadStoredDocument()` 内执行：

```
1. v = idb.get('kv','document')
2. v !== undefined → return v                      // 已迁移/已有，幂等跳过
3. old = localStorage['editor.document.v1']
4. old != null:
     idb.put('kv', old, 'document')                // 先写新
     确认 put resolve 成功                           // 确认
     localStorage.removeItem('editor.document.v1')  // 再删旧（不可逆前确认）
     localStorage.removeItem('editor.notice.large-doc.v1')  // 旧 notice flag 一并退役
     return old
5. return ''                                        // 新用户
```

## 4. Key 退役清单

| 旧 localStorage key | v1.1 处置 |
|---------------------|----------|
| `editor.document.v1` | 迁移到 IDB `kv/document` 后**删除** |
| `editor.notice.large-doc.v1` | **删除**（1MB 提示取消，共识 TBD-v11-4）|
| `editor.theme.v1` | **保留**（M6 主题仍用 localStorage，不在本次范围）|
| `editor.prefs.v1` | **保留**（M1 prefs 仍用 localStorage）|

> 仅文档持久化迁 IDB；主题 / 编辑器偏好这类小配置仍留 localStorage（同步读、量小、无配额压力）—— 本次不扩散。

## 5. 降级后端（共识 TBD-v11-3）

IDB 不可用时，文档读写回落 localStorage `editor.document.v1`（即 v1.0 行为），迁移层不触发（IDB 不可用则无"迁移到 IDB"动作）。降级是 best-effort，保证隐私模式用户不裸奔。
