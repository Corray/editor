# 共识文档 v1.6 — 多文档（文件列表）

> v1.0 共识增量 delta（PRD §7 v1.1 候选「多文档（左侧文件列表）」补完）。
>
> **状态：** `accepted`（2026-06-05；TBD-v16-1~4 AI 倾向 + v16-5/6/7 经方向问答拍板：v16-5=(a) 自动派生不重命名 / v16-6=(a) 抽屉 / v16-7=(a) import·open-shared 新建文档）
> **flow 位置：** 共识 draft → module-list（M3 改造 + 新增 M9 文档管理）→ 架构 + ADR-010（数据模型/迁移核心）→ api/data-model/test-plan delta → 实现
> **命名：** semver tag 将是 **v0.7.0**（同先例）。**本版是迄今最大改动（L3）**：动 M3 持久化根基 + 新 UI + 单→多迁移 + 涟漪 share/import/export。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.6-draft | 2026-06-05 | 多文档存储（documents store）+ 文件列表 UI + 单→多迁移 + 涟漪；7 TBD 待 accept |

---

## 1. 动机与范围

editor 当前是**单文档**：M3 持久化一个 `kv/document`。PRD §7 v1.1 候选含「多文档（左侧文件列表）」。本版让用户管理**多个文档**：新建 / 切换 / 删除 / 列表。

**范围（仅）：**
- ① **多文档存储**：IndexedDB 新增 `documents` store（每文档独立记录），`activeDocId` 指针
- ② **文件列表 UI**：桌面左侧 sidebar（列表 + 新建 + 删除）；移动端入口（TBD-v16-6）
- ③ **单→多迁移**：现有单文档迁成第一条文档（沿用 v1.1 先写后删幂等范式）
- ④ **涟漪适配**：share / import / export / clear 在多文档下的语义（TBD-v16-7）

**不在本次：** 文档分组/文件夹 / 标签 / 全文搜索 / 云同步（v2.0 后端）/ 拖拽排序。

---

## 2. 张力

### 张力 A — 持久化根基变更（单→多）
M3 当前持久化单个 `kv/document`。多文档需独立 store + active 指针 + CRUD。这是数据模型根基改动，且要无损迁移现有用户的单文档。**第三次迁移**（v1.0 ls→ v1.1 idb 单 doc → v1.6 多 doc）。见 **TBD-v16-1/3**。

### 张力 B — 涟漪改既有语义
share「分享当前」/ import「覆盖当前」/ open-shared「覆盖当前」是 v1.2 单文档语义。多文档下「覆盖当前」可能不再合理（import 一个文件应该新建而非毁掉当前文档）。见 **TBD-v16-7**——**这是会改 v1.2 已发布行为的决策**。

### 张力 C — 移动端多文档 UX
桌面有空间放 sidebar；移动端是单栏 tab（edit/preview），塞文件列表需抽屉/下拉。见 **TBD-v16-6**。

---

## 3. 待确认项（TBD-v16-x；HOW 在 ADR-010）

### TBD-v16-1 — 多文档存储模型〔核心〕
- **(a) 新增 `documents` object store（keyPath `id`），每条 `{id, title, text, createdAt, updatedAt}`；`kv` store 加 `activeDocId` 指针。DB version 1→2（onupgradeneeded 加 store，不动 kv）**〔AI 倾向〕— 符合 data-model v1.1 预留；每文档独立记录，可单独读写，scalable
- (b) 所有文档塞进 kv 单 key 的大数组 → 每次存全量、不 scalable → **拒绝**

### TBD-v16-2 — 文档 ID 方案
- **(a) app 层生成 `D_<uuid>`（顶级对象前缀 `D_`，`crypto.randomUUID()`）**〔AI 倾向〕— 符合 architecture-constraints §6（可读前缀 + 应用层 ID，非表自增、非纯 UUID）
- (b) 纯 UUID 无前缀 / 自增 → 违反 arch-constraints → **拒绝**

### TBD-v16-3 — 单→多迁移
- **(a) 首次加载：`documents` 空 + `kv/document` 有旧单文档 → 迁成一条 doc（id=新 `D_*`，title 派生，set active），确认写成功后删旧 `kv/document` key（先写后删幂等，沿用 v1.1）**〔AI 倾向〕
- (b) 不迁移 → 旧用户文档"消失" → **拒绝**

### TBD-v16-4 — active doc 选择 + 边界
- **(a) `kv/activeDocId` 存当前；启动读它 → 加载该 doc；无效/无 → 取 `updatedAt` 最新的；一篇都没有 → 自动建一个空 doc。删除 active → 切到最新的；删到空 → 自动建空 doc（永远至少 1 篇）**〔AI 倾向〕

### TBD-v16-5 — 标题策略〔需你拍板：产品 UX〕
- **(a) 自动从首个 H1 / 首非空行派生（截断 ~40 字），无内容="Untitled"；不做手动重命名（MVP）**〔AI 倾向：零摩擦，合"草稿/速记"场景〕
- (b) 自动派生 + **支持手动重命名**（列表项可改名，覆盖自动标题）
- (c) 纯手动命名（新建时必须输入）→ 增摩擦，不合速记场景

### TBD-v16-6 — 移动端文件列表 UI〔需你拍板：UX〕
- **(a) 桌面左侧 sidebar；移动端「文档」按钮 → 打开抽屉式列表（覆盖层），选中后关闭回编辑**〔AI 倾向〕
- (b) 移动端顶部下拉选择器（dropdown 切文档，新建/删除入口在内）
- (c) 移动端不支持多文档列表（仅桌面）→ 功能割裂，不推荐

### TBD-v16-7 — 涟漪语义（改 v1.2 行为）〔需你拍板：产品行为变更〕
- **(a) import .md → 新建文档（不覆盖当前）；open-shared 链接 → 新建文档导入；share/export/清空 → 作用于 active doc**〔AI 倾向：多文档下"导入/打开=新增"更合理，不毁当前〕
- (b) 保持 v1.2 语义（import/open-shared 覆盖 active doc）→ 多文档下易误删当前文档内容
- 清空(clear)：清空 **active doc 内容**（保留该文档条目）；删除文档走列表删除按钮（两个不同动作）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | **M3 改造**（多文档存储后端）+ **新增 M9 文档管理**（doc 列表模型 + CRUD + active + 迁移）+ M5 容纳 sidebar/抽屉 | §M3/M9/M5 |
| 架构 + **ADR-010** | documents store schema + DB v1→2 升级 + ID 方案 + 单→多迁移 + 模块分解（M3 vs M9 职责）+ 涟漪语义 | L3 |
| api-spec delta | M9 DocManagerAPI（list/create/switch/delete/active）+ M3 写目标改 active doc + share/import 涟漪契约 | 契约 |
| **data-model delta** | documents store schema + DB v2 升级 + activeDocId + 第三次迁移层 | **重点**（本版核心）|
| test-plan delta | 家族：`文档数(0/1/多) × 操作(新建/切换/删除/删到空) × 迁移(旧单doc/新用户) × 涟漪(import新建/share active)` | 覆盖 |

---

## 5. 验收条件（v1.6 新增 AC，待 test-plan 细化）

- AC-v16-1：新建文档 → 列表新增 → 切换编辑互不干扰（各自独立持久化）
- AC-v16-2：切换文档 → 编辑区/预览加载对应文档；当前编辑已 debounce 存盘
- AC-v16-3：删除文档 → 列表移除；删 active → 切到最新；删到空 → 自动建空 doc
- AC-v16-4：**旧单文档用户**升级 → 现有内容迁成第一条文档，不丢（幂等，刷新不重复迁）
- AC-v16-5：import .md → 新建文档（TBD-v16-7a）；不覆盖当前
- AC-v16-6：刷新/重开 → 回到上次 active 文档（activeDocId 持久）
- AC-v16-7：移动端可切换/新建/删除文档（TBD-v16-6 选定形态）
- AC-v16-8：多文档各自离线可用（PWA 不退化；documents store 同 IDB）

> 无安全发布门槛（无新外部输入面；import 仍过 DOMPurify）。迁移正确性（AC-v16-4）是数据安全重点，比照 v1.1 迁移测试严格度。
