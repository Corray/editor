# 数据模型 v2.0 — 云端 documents 表 + RLS + 本地同步元

> **新章节**（账号 + 云同步）。基线：共识 v2.0 + ADR-013/015/016。
> 本地 IndexedDB（data-model v1.6）**不变**为主；本节加云端 schema + 本地同步元字段。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.0 | 2026-06-08 | Supabase documents 表 + RLS 策略 + 本地 DocRecord 同步元（syncedAt/deleted）|

---

## 1. 云端 Supabase `documents` 表（ADR-016）

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | `text` PK | `D_<uuid>`（**复用本地 doc id** / ADR-010，跨设备对齐）|
| `user_id` | `uuid` | = `auth.uid()`（RLS 隔离键 / identity）|
| `title` | `text` | 文档标题 |
| `text` | `text` | Markdown 源文（明文，MVP 不 E2EE）|
| `created_at` | `bigint` | epoch ms（与本地一致）|
| `updated_at` | `bigint` | epoch ms；**LWW 比较键** |
| `deleted` | `boolean` default false | 软删 tombstone（ADR-015 D4）|

**建表 + RLS（用户 provision 时执行 / ADR-016 D1）：**
```sql
create table documents (
  id text primary key,
  user_id uuid not null references auth.users(id),
  title text not null default '',
  text text not null default '',
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false
);
alter table documents enable row level security;
create policy "own select" on documents for select using (auth.uid() = user_id);
create policy "own insert" on documents for insert with check (auth.uid() = user_id);
create policy "own update" on documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on documents for delete using (auth.uid() = user_id);
```

## 2. 本地 DocRecord 同步元（增量 / 无 DB 升级）

DocRecord（data-model v1.6/v1.8）+ 可选字段（IndexedDB schemaless，无 onupgradeneeded）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `deleted` | boolean? | 软删（登录态删除 = 软删 + 同步；匿名仍可硬删）；M9 列表过滤 deleted |
| `syncedAt` | number? | 上次成功 push/pull 的时间（判定"本地未同步"用于首登 union）|
| `remoteUpdatedAt` | number? | 上次见到的云端 updatedAt（辅助 LWW / 调试）|

旧记录无这些字段 = undefined = 未同步/未删（兼容，无迁移）。

## 3. LWW 映射（ADR-015 D3）

| 场景 | 解 |
|------|----|
| 本地 doc.updatedAt > 云 updated_at | push（本地胜）|
| 云 updated_at > 本地 | pull 覆盖本地（云胜）|
| 仅一侧有（按 id）| 同步到另一侧（首登并集 / D5）|
| deleted（任一侧 updatedAt 新且 deleted=true）| 另一侧标删（软删走 LWW）|

## 4. env / secret（ADR-013 D3）

| 变量 | 性质 |
|------|------|
| `VITE_SUPABASE_URL` | 公开（FE bundle）|
| `VITE_SUPABASE_ANON_KEY` | **公开**（RLS 才是边界）|
| service_role key | **绝不**进 FE/仓库 |

## 5. 不变量

- 数据隔离基于 `user_id=auth.uid()`（RLS），非业务字段（arch §4）
- doc id 跨本地/云一致（`D_<uuid>` 复用）
- 软删不物理删行（多设备 LWW 正确性）
- 匿名用户无 user_id / 不触云（纯本地不变）
