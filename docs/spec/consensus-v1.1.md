# 共识文档 v1.1 — 持久化升级（IndexedDB）

> **定位：** v1.0 共识（`consensus-v1.0.md`，accepted 2026-05-18）的**增量 delta**，仅描述 v1.1 持久化升级带来的行为变化。v1.0 其余条款不变、继续生效。
>
> **状态：** `accepted`（2026-06-03 Corray 全盘接受 TBD-v11-1~5 的 AI 倾向 (a)）
> **spec-to-code-flow 位置：** v1.1 入口节点（共识 ✓ accepted）→ **module-list delta** → 架构 + ADR-005 → api+data-model v2 → test-plan delta → 实现

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.1 | 2026-06-03 | 持久化 localStorage → IndexedDB；TBD-v11-1~5 全 accept (a)：异步 hydrate / 迁移后删旧 key（先写后删幂等）/ IDB 不可用降级 localStorage / 取消 1MB 提示 / init 改异步 |
| v1.1-draft | 2026-06-03 | 初稿，5 TBD 待 accept |
| v1.0 | 2026-05-18 | MVP 初版（accepted）|

---

## 1. 动机

v1.0 用 localStorage（PRD R2 已标风险：配额 5–10MB，长文档会超）。v1.1 切 IndexedDB：配额数量级提升（通常 ≥ 浏览器磁盘配额的一定比例，几十 MB~GB），解 R2，为后续大文档 / 多文档（v1.2+）铺路。

**本次范围（仅）：** M3 持久化后端从 localStorage 换 IndexedDB + 旧数据迁移。
**明确不在本次：** 多文档、Service Worker、云同步（仍各自按 roadmap 推迟）。

---

## 2. 行为变化（相对 v1.0 已定）

### 2.1 核心张力：同步 seed → 异步加载

v1.0 启动序列（架构 §4.1 / #7 反哺）依赖 **`readStoredDocument()` 同步读** localStorage，首帧即带内容。**IndexedDB 只能异步读** → 此同步路径必须改，首屏出现"文档尚未加载完"的瞬间。这是 v1.1 唯一用户可感知的行为变化，决策见 **TBD-v11-1**。

### 2.2 已定的 delta（不留 TBD）

| 维度 | v1.0 | v1.1 |
|------|------|------|
| 持久化后端 | localStorage（`editor.document.v1`）| IndexedDB（库 / schema 由 ADR-005 + data-model v2 定）|
| 写入时机 | text 变更 debounce 500ms | **不变**（500ms 防抖语义保留）|
| 状态机 | IDLE/DIRTY/SAVING/ERROR | **保留**；SAVING 从"同步瞬时"变为"真异步态"（更贴合原设计）|
| 多 tab 竞争 | 后写覆盖 + 不提示（consensus v1.0 §多 tab）| **不变**（本次不引入 `storage`/IDB 跨 tab 协同）|
| 清空 | `clear()` 删 key | **不变**（语义同，落到 IDB delete）|

---

## 3. 待确认项（TBD-v11-x，PM 拍板）

> 格式同 v1.0：每条给 AI 倾向 + 备选，PM accept / 改判。**这些是"做什么"层决策；"怎么做"（库选型/事务）在 ADR-005。**

### TBD-v11-1 — 异步加载首屏 UX（最关键）
IndexedDB 读是异步，首帧拿不到文档。三选一：
- **(a) 空编辑器闪现后 hydrate**〔AI 倾向〕— 先渲染空 editor，IDB resolve（通常 <50ms）后 `setText` 填入。最简，闪烁极短；代价：极慢设备/大文档下可见空→满跳变。
- (b) "加载中" placeholder — editor 区显 loading 占位直到 IDB resolve。无跳变；代价：多一个加载态 UI + 文案 i18n。
- (c) skeleton/禁用输入 — 加载期 textarea disabled。最稳但最重。

**AI 倾向 (a)**：editor 是单文档轻量场景，IDB 单 key 读极快，闪烁可忽略；(b)/(c) 的 UI 复杂度对收益不值。反例：若首屏文档常态 >数 MB，(a) 的空→满跳变会明显，届时升 (b)。

### TBD-v11-2 — 旧 localStorage 数据迁移后是否删除
首次 v1.1 加载：IDB 空 + localStorage 有 `editor.document.v1` → 迁入 IDB。迁移后旧 key：
- **(a) 删除旧 key**〔AI 倾向〕— 迁移即清，避免双源 drift。
- (b) 保留旧 key 一个版本作回滚后路 — 防 IDB 迁移 bug 丢数据；代价：双写/双源短期共存。

**AI 倾向 (a)** + 迁移做成幂等（IDB 已有则跳过），并在迁移成功后才删旧 key（先写新、确认、再删旧 — 不可逆操作前确认）。反例：若担心 IDB 首版稳定性，(b) 更保守。

### TBD-v11-3 — IndexedDB 不可用时的降级
隐私模式 / 老浏览器 / IDB 被禁 时：
- **(a) 降级回 localStorage**〔AI 倾向〕— IDB 不可用则 fallback localStorage（保持 v1.0 行为），toast 告知"大文档可能受限"。
- (b) 纯 IDB + 报错不降级 — 简单但隐私模式用户彻底失去持久化。

**AI 倾向 (a)**：渐进增强，不让隐私模式用户裸奔（v1.0 已有 localStorage 不可用的 try/catch 容错，复用）。反例：双后端增加 M3 复杂度 + 测试矩阵翻倍（IDB-path × localStorage-path）。

### TBD-v11-4 — 1MB 大文档提示是否保留
v1.0 在 >1MB 时一次性 toast「内容较长，性能可能下降」（localStorage 配额预警）。IDB 下 1MB 不再是配额问题：
- **(a) 取消 1MB 提示**〔AI 倾向〕— IDB 容量充裕，提示无意义。
- (b) 保留但提高阈值（如 5MB，渲染性能预警而非配额）— markdown-it 渲染大文档仍可能卡。

**AI 倾向 (a)** 先取消（配额动机消失）；渲染性能预警是另一回事（属 M2，可单列）。反例：若实测大文档渲染卡顿明显，(b) 保留一个渲染向的预警。

### TBD-v11-5 — PersistenceAPI `init()` 同步契约的处置
`init(): string` 当前同步返回初始文档。异步后此契约破裂（api-spec §3.3）：
- **(a) `init()` 改 `Promise<string>` / 或新增 `hydrate(setText)` 异步入口，移除同步 `readStoredDocument`**〔AI 倾向〕— 诚实反映异步本质。属契约变更，api-spec v2 + 架构 §4.1 启动序列同步改。
- (b) 保留同步 `readStoredDocument` 返回空 + 异步补 — 兼容旧调用形态但语义误导。

**AI 倾向 (a)**：契约层不撒谎；启动序列本就要为 TBD-v11-1 重写。具体异步签名在 ADR-005 / api-spec v2 定。

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M3 责任边界 delta | 删"不做 IndexedDB"；加迁移层职责 |
| 架构 + **ADR-005** | IDB 库选型 + 异步契约 + 迁移层 + 启动序列重写 | L3，必出 ADR |
| api-spec v2 + data-model v2 | PersistenceAPI 异步契约 + IDB schema + 迁移层 + `editor.document.v1` 退役 | 契约 + 数据层 |
| test-plan delta | 迁移用例 / 异步态 / IDB 不可用降级 / 旧→新 兼容矩阵 | 家族维度：`后端(IDB/localStorage) × 加载态 × 迁移(首次/已迁/无旧数据)` |

---

## 5. 验收条件（v1.1 新增 AC，待 test-plan 细化）

- AC-v11-1：v1.0 老用户（localStorage 有文档）首次开 v1.1 → 文档无损迁入 IDB，可继续编辑 + 持久
- AC-v11-2：编辑 → 刷新 → 内容存活（IDB 路径，替代 v1.0 AC-2）
- AC-v11-3：>5–10MB 文档（旧 localStorage 配额会爆的量级）→ IDB 正常存取
- AC-v11-4：IDB 不可用（隐私模式模拟）→ 按 TBD-v11-3 决策的降级行为
- AC-v11-5：清空 → IDB + 任何遗留 localStorage 旧 key 一并清

> 待 TBD-v11-1~5 accept 后，AC 细化进 test-plan delta。
