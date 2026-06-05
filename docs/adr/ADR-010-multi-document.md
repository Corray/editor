# ADR-010 — 多文档：documents store + 单→多迁移 + M3/M9 分解

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-05：D1=documents store / D2=`D_<uuid>` / D3=先写后删迁移 / D4=M9 owns store·M3 owns timing / D5=自动派生标题 / D6=涟漪新建语义 / D7=抽屉移动 UI）|
| **Date** | 2026-06-05 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.6（accepted）/ module-list M3 改造 + M9 新增 / ADR-005（IDB 单 doc）/ data-model v1.1（预留 documents store）/ ADR-006（share/import）|
| **Supersedes** | — |

## Context

共识 v1.6 决定支持多文档。约束：无损迁移现有单文档用户（第三次迁移）；data-model v1.1 已预留 `documents` store；arch-constraints §6（应用层 ID + 可读前缀）；PWA 离线不退化（同 IDB）。

本 ADR 定 how：① 存储模型 ② ID ③ 迁移 ④ 模块分解（M3 vs M9）⑤ 标题 ⑥ 涟漪 ⑦ 移动 UI。

---

## D1 — 存储模型（核心）
新增 `documents` object store（`keyPath: 'id'`），记录 `{ id, title, text, createdAt, updatedAt }`；`kv` store 加 `activeDocId`。**DB version 1→2**，onupgradeneeded：`if (oldVersion < 2) db.createObjectStore('documents', { keyPath: 'id' })`（不动 `kv`）。
> 反例 (b)：所有文档塞 kv 单 key 大数组 → 每次全量读写、不 scalable → 拒绝。

## D2 — 文档 ID
`D_<crypto.randomUUID()>`（顶级对象前缀 `D_`，arch-constraints §6）。常量集中在 `m9-doc-manager` 的 `idPrefix.ts`（`EntityIdPrefixes.DOC = 'D_'`）。

## D3 — 单→多迁移（先写后删幂等 / 沿用 v1.1）
`loadInitialDocs()` 内：
```
1. docs = idb.getAll('documents')
2. docs.length>0 → 已是多文档，return（幂等跳过）
3. legacy = idb.get('kv','document')   // v1.1 的单 doc
4. legacy 是 string:
     id=D_*; put('documents',{id,title:派生,text:legacy,ts}); put('kv',id,'activeDocId')
     确认成功 → delete('kv','document')   // 先写后删
5. 否则（新用户）→ 建一个空 doc 作首篇
```
第三次迁移：v1.0 ls→ v1.1 idb单 → **v1.6 idb单→多**。

## D4 — 模块分解（M3 vs M9）
- **M9 文档管理**：拥有 `documents` store 全部 I/O + `activeDocId` + doc 列表模型（signal）+ CRUD（create/switch/delete）+ 迁移 + 标题派生。暴露 `DocManagerAPI`。
- **M3 持久化**：保留自动存盘**状态机**（IDLE/DIRTY/SAVING/ERROR）+ debounce 计时；写目标改为 `m9.saveActiveText(text)`（M3 管时机/状态，M9 管落库）。**单 store 单写者**：只有 M9 写 documents store，M3 不直接碰。
- 切换：M9.switchTo(id) → flush M3 pending → 读目标 doc.text → set M1 `DocumentState` → 更新+持久 activeDocId。

## D5 — 标题（自动派生，无重命名 / TBD-v16-5a）
保存时从 text 派生：首个 `# H1` 或首非空行，trim + 截断 ~40 字；空="Untitled"。列表显示派生标题。MVP 不做手动重命名。

## D6 — 涟漪语义（TBD-v16-7a，改 v1.2 行为）
- **import .md** → `m9.create(text)` 新建文档（不覆盖当前；移除 v1.2 的覆盖 confirm）
- **open-shared `#doc=`** → 新建文档导入（不覆盖；移除 v1.2 的 share.overwrite.confirm）
- **share / export** → 当前 active doc
- **clear** → 清空 active doc **内容**（保留条目）；删除文档走列表删除按钮（独立动作）

## D7 — 移动端 UI（抽屉 / TBD-v16-6a）
桌面左侧 sidebar；移动端 header「文档」按钮 → 抽屉覆盖层列表（新建/选中/删除），选中关闭回编辑。与现有 edit/preview tab 并存。

---

## Consequences

- **module-list**：M3 改造（写目标）+ 新增 **M9 文档管理** + M5 容纳 sidebar/抽屉
- **data-model delta（重点）**：documents store schema + DB v1→2 升级 + activeDocId + 第三次迁移
- **api-spec delta**：`DocManagerAPI`（list/active/create/switch/delete/saveActiveText/rename?无）+ M3 写目标 + share/import 涟漪
- main.tsx 启动序列改：loadInitialDocs（迁移 + active）→ set DocumentState；M9 装配在 M1/M3 之间
- M4 import/share：import→m9.create；open-shared→m9.create；移除 v1.2 两个 overwrite confirm（i18n key 退役）
- i18n：文件列表 UI 文案（新建/删除/文档/Untitled/删除确认）
- test-plan delta：多文档家族 + 迁移（旧单 doc/新用户）+ 涟漪
- PWA：documents store 同 IDB，离线不退化（precache 不含用户数据，无影响）
- 测试：M9 CRUD + 迁移单测（fake-indexeddb）；多文档 e2e（新建/切换/删除/删到空/迁移）

## References

- 共识 v1.6 TBD-v16-1~7
- ADR-005（IDB 单 doc，本 ADR 扩展其 schema）/ data-model v1.1 §1「预留 documents store」
- ADR-006（share/import，本 ADR 改其涟漪语义）
- arch-constraints §6（应用层 ID `D_<uuid>` + 前缀常量集中 `EntityIdPrefixes`）
- `crypto.randomUUID()`（核实：现代浏览器 + GH Pages HTTPS 下可用；Node 18+/jsdom 测试环境原生可用，无需 polyfill）
- 实现 commit：`f2986e2`
- **迁移兜底补强**：实现期 e2e（E2E-v11-001）暴露 v1.0 用户直跳 v1.6 的盖空 case → loadInitialDocs 迁移源补 localStorage `editor.document.v1` 兜底路（D3 谱系 ls→kv→documents 全覆盖）
- **附带修 FOUC**：async bootstrap（await loadInitialDocs 先于 render）使主题应用延迟 → 深色用户闪白 → 新增 `applyInitialTheme()` 同步先于 await（ac6 e2e 暴露）
- 实测：unit 159（M9 13）+ e2e 65/1skip（ac10 多文档 + ac2/ac7 v1.6 语义双引擎）；首屏 80.01KB
