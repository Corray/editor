# 共识文档 v2.6 — 文档版本快照（历史 + 恢复）

> v1.0 共识增量 delta（2026-06-12 四项拍板 scope 压轴，**L3**：动持久化根基）。
>
> **状态：** `accepted`（2026-06-15；TBD-v26-1~4 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M9 delta → ADR-022 → data-model/api/test-plan delta → 实现
> **命名：** semver tag **v1.6.0-rc.1**。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.6-draft | 2026-06-12 | 自动+手动快照 / 历史列表 / 恢复（含保护快照）；DB v2→v3；4 TBD |
| v2.6 | 2026-06-15 | TBD-v26-1~4 全部拍板（全 a）→ accepted |

---

## 1. 【背景 / 方向】

编辑器只有"当前态"——误删段落、错误替换全部、想找回上周的版本都无解（undo 栈刷新即失）。本版给每篇文档加**本地版本快照**：自动+手动存档、历史列表、一键恢复。

**L3 定性**：第四次动 IndexedDB schema（DB v2→v3），但**纯增量**（新 store，零旧数据迁移）——比 v1.6 单→多迁移风险低一档。

## 2. 【关键决策 / TBD-v26-x】

### TBD-v26-1 — 自动快照策略
- **(a) saveActiveText 写路径 piggyback**：M9 单写者入口处检查「距该文档上一张快照 >5 分钟 且 内容 ≠ 上张」→ 异步存 auto 快照。**无新定时器**（零空转、不写不快照），挂在既有唯一写路径上〔AI 倾向〕
- (b) 仅手动快照（功能弱一半）
- (c) 独立 interval 定时器（空转 + 多写者隐患）

### TBD-v26-2 — 配额与清理
- **(a) 每文档上限 30 张，FIFO 删最旧（不分 kind）**；删除文档连带删其全部快照（cascade）。30 张 × 平均文档体量，单文档快照占用可控；超大文档（374KB 级）30 张 ≈ 11MB，IndexedDB 配额内〔AI 倾向：规则单一可预期〕
- (b) 分 kind 配额（auto 20 / manual 50，规则复杂）

### TBD-v26-3 — 入口与恢复语义
- **(a) doc-list 项 ⏱ 按钮 → 历史弹层**（列表：相对时间 + 字数 + auto/manual 徽标 + 「立即快照」按钮）；恢复 = confirm → **先存一张 `restore` 保护快照**（当前内容，防误恢复丢数据）→ 覆盖编辑器内容〔AI 倾向〕
- (b) 恢复为新建文档（不覆盖，但文档列表膨胀）

### TBD-v26-4 — 边界（降级 / 云同步）
- **(a) IDB 不可用（隐私模式降级态）→ 快照功能整体隐藏**；云同步（M11）**不含快照**——快照纯本地，不进 documents 表/RLS scope〔AI 倾向：M11 契约零变化〕
- (b) 快照也同步上云（动 schema + RLS + 流量，本版不做）

## 3. 【模块结构 / 影响范围】

| 触点 | 变更 |
|------|------|
| M9 store.ts | DB_VERSION 2→3；+store `snapshots`（keyPath id，index byDoc on docId）；SnapRecord {id:`SN_*`, docId, text, title, createdAt, kind:'auto'\|'manual'\|'restore'}；put/list/delete/cascade API |
| M9 manager.ts | saveActiveText piggyback（TBD-v26-1a）；remove() cascade 删快照；+snapshotNow()/listSnapshots()/restoreSnapshot() |
| M9 HistoryDialog.tsx（新）| 历史弹层（doc-list ⏱ 入口）|
| data-model | +snapshots store 定义（DB v3）|
| M11 | **零变化**（快照不进同步 scope）|

## 4. 【ADR？】

是 → **ADR-022**（DB v3 schema + piggyback 策略 + 配额 + 恢复保护快照）。

## 5. 验收条件（AC-v26-x）

- AC-v26-1：编辑超过快照间隔后继续输入 → 自动产生 auto 快照（不足间隔不重复存）
- AC-v26-2：「立即快照」→ manual 快照即刻出现在历史列表
- AC-v26-3：恢复某快照 → confirm → 编辑器/预览变为该版本内容，且历史里**多一张 restore 保护快照**（恢复前内容可找回）
- AC-v26-4：每文档快照数达上限 → 新快照挤出最旧（FIFO），总数不超上限
- AC-v26-5：删除文档 → 其快照连带清除（孤儿快照不存在）
- AC-v26-6：**DB v2→v3 升级零损**：升级后既有文档/活跃态完整（additive，旧 store 不动）
- AC-v26-7：IDB 不可用降级态 → 快照入口不出现，其余功能照常
- AC-v26-8：云同步行为零变化（M11 契约不动，快照不上云）

> 安全面：快照内容 = 用户自己的文档文本（纯本地存储/textContent 列表展示）；无新外部输入面，不动 sanitize / RLS。
