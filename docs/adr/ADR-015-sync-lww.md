# ADR-015 — 同步模型：local-first + 自动 + per-doc LWW + 首登并集 + 软删 tombstone

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-08：local-first / auto push+pull / per-doc LWW / 首登并集 / 软删）|
| **Date** | 2026-06-08 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v2.0 TBD-v20-2/3/4 / ADR-010（本地 documents / D_uuid）/ ADR-013（Supabase）|

## Decision

### D1 — local-first（本地主，云作镜像/跨设备通道）
本地 IndexedDB documents 仍是主（离线照常 / AC-v20-7）。登录后叠加同步层；匿名纯本地不变。doc `id` = `D_<uuid>`（ADR-010）**复用为云端 PK** → 跨设备同一 doc 同 id，天然对齐。

### D2 — 自动同步（TBD-v20-2a）
- **push**：登录 + 在线时，本地 doc 变更（M3 debounce 后）→ upsert 到云
- **pull**：登录后 + 启动 + 窗口 focus → 拉云端 doc → 按 LWW 合并入本地
- 离线/未登录：跳过同步（本地照常），上线/登录后补同步

### D3 — per-doc LWW（TBD-v20-3a）
冲突按 `updatedAt`（epoch ms）大者整篇胜，作用于 `{title, text, deleted}`。
- **代价（诚实）**：晚改端覆盖早改端整篇；跨设备**时钟偏差**可致 LWW 误序（客户端 updatedAt）。MVP 接受；字段级/CRDT 推 v2.1。

### D4 — 软删 tombstone（多设备删除正确性）
删除 = 软删（`deleted=true` + bump updatedAt），**不**物理删行。理由：纯物理删 + union pull 会**复活**已删 doc（设备 B 本地还有 → 重新 push）。软删让"删除"也走 LWW，跨设备一致。本地 UI 过滤 `deleted` 的 doc（不显示）；物理 GC 推后。

### D5 — 首次登录并集（TBD-v20-4a / 数据安全重点）
首登：本地全部 doc（含匿名期创建）打 user_id 上传 + 云端 doc 下拉 → 按 id：
- 仅本地有 → 上传
- 仅云端有 → 下拉
- 两边都有（同 id）→ LWW
**不丢任一侧**（AC-v20-5）。

## Consequences

- 本地 DocRecord +同步元（`syncedAt?`/`remoteUpdatedAt?`）+ `deleted?`（软删）
- 云 documents 表 + `deleted` 列（data-model v2.0）
- M11 SyncGateway：push(doc) / pullAll() / 首登 merge；M9 集成（保存后触发 push / 登录触发 pull+merge）
- M9 列表过滤 deleted；remove() 改软删（登录态）或仍硬删（匿名本地）——细节 data-model/api
- 测试：mock 后端 + LWW 矩阵（本地新/云新/同时/删除传播/首登并集/离线补同步）

## References

- 共识 v2.0 TBD-v20-2/3/4 / ADR-010（id 复用为云 PK）/ ADR-016（RLS）
- LWW / 软删 tombstone（分布式同步常见模式；CRDT 留 v2.1）
- 实现 commit：`935d3ae`（mock 实现 + 真后端代码；真云连接/真隔离待用户 provision 后验，AC-v20-6 安全门槛 pending）
