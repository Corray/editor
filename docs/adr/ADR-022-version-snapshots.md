# ADR-022 — 文档版本快照：DB v3 snapshots store + 写路径 piggyback + FIFO 配额 + 恢复保护

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-15：D1=DB v3 additive snapshots store / D2=saveActiveText piggyback / D3=每文档 30 FIFO + cascade / D4=恢复存 restore 保护快照 / D5=纯本地不上云）|
| **Date** | 2026-06-15 |
| **Decider** | FE (Corray，共识 v2.6 TBD 全拍) |
| **Context** | 共识 v2.6（accepted）/ ADR-010（M9 documents store）/ ADR-015（M11 云同步 scope）/ data-model v1.6 |
| **Supersedes** | — |

## D1 — DB v2→v3：additive snapshots store（TBD-v26 / AC-v26-6）

- `DB_VERSION` 2→3；upgrade 块加 `if (oldVersion < 3 && !contains(SNAPS))` 建 `snapshots`（keyPath `id`）+ index `byDoc`（keyPath `docId`）
- **纯增量**：不读不改不删 v2 既有 store（documents/kv）→ 零数据迁移，升级零损（比 v1.6 单→多迁移低一档风险）
- `SnapRecord { id: 'SN_<uuid>', docId, text, title, createdAt, kind: 'auto'|'manual'|'restore' }`

## D2 — 自动快照：saveActiveText 写路径 piggyback（TBD-v26-1a）

- M9 saveActiveText 是 documents 的**单写者入口**——auto 快照挂这里，**无新定时器**（零空转、不写不快照、无多写者竞态）
- 触发条件：`now − 该文档上一张快照 createdAt > AUTO_INTERVAL_MS(5min)` 且 `text ≠ 上张快照 text`
- 异步 fire-and-forget（`void guardStore(...)`），不阻塞保存主路径；首次保存（无历史快照）也存一张作基线
- 上一张快照时间内存缓存（`lastSnapAt: Map<docId, ms>`），避免每次保存查 store

## D3 — 配额：每文档 30 张 FIFO + 删文档 cascade（TBD-v26-2a / AC-v26-4/5）

- 存快照后按 docId 取该文档全部快照，超 30 → 按 createdAt 升序删最旧（不分 kind，规则单一可预期）
- M9 `remove(id)` → 连带 `deleteSnapshotsByDoc(id)`（cascade，无孤儿快照）
- 上限常量 `MAX_SNAPSHOTS_PER_DOC = 30`

## D4 — 恢复：先存 restore 保护快照再覆盖（TBD-v26-3a / AC-v26-3）

- `restoreSnapshot(snapId)`：① 先对当前 active 内容存一张 `kind:'restore'` 保护快照（防误恢复丢当前未存版本）→ ② 把目标快照 text 经 saveActiveText 灌入编辑器 + 持久化
- 恢复 = 覆盖当前文档内容（非新建），编辑区/预览随 setEditorText 更新

## D5 — 边界：纯本地，M11 零变化（TBD-v26-4a / AC-v26-7/8）

- 快照 **不进 documents 表 / 不进 RLS scope / 不调 syncHooks** —— M11 push/pull/mergeRemote 契约零变化
- IDB 不可用降级态（`isIdbUnavailable()`）→ 快照 API 全 no-op + UI 入口不渲染（AC-v26-7）

## Consequences

- **module-list**：M9 delta（+snapshots store + 快照 API + HistoryDialog）
- **data-model delta**：snapshots store 定义（DB v3）
- **api-spec delta**：store +put/listByDoc/deleteByDoc/pruneByDoc；DocManagerAPI +snapshotNow/listSnapshots/restoreSnapshot；HistoryDialog 组件
- **M11**：零变化（快照不上云）
- test-plan delta：`自动快照(间隔/内容去重/基线) × 手动 × 配额 FIFO × cascade × 恢复(保护快照/覆盖) × DB v3 升级零损 × 降级隐藏`
- 无安全面：快照=用户自己文档文本，纯本地 IDB，列表 textContent 渲染，不动 sanitize/RLS
- 风险：30 张 × 374KB 级超大文档 ≈ 11MB/文档，IndexedDB 配额内但非无界——配额耗尽由既有 IDB 写失败路径兜底（guardStore toast）
