# 接口设计 v1.6 delta — 多文档（M9 文档管理 + M3 改造 + 涟漪）

> v1.0 接口增量。新增 M9 DocManagerAPI；M3 写目标改 active doc；M4 import/share 涟漪改语义。
> **基线：** 共识 v1.6（accepted）+ ADR-010 + data-model v1.6。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.6 | 2026-06-05 | M9 DocManagerAPI + M3 saveActiveText 写目标 + import/open-shared 改新建语义 |

---

## 1. M9 文档管理 DocManagerAPI（新增 / ADR-010 D4）

```ts
// modules/m9-doc-manager/api.ts
export interface DocMeta {
  id: string;        // D_<uuid>
  title: string;     // 自动派生
  updatedAt: number;
}
export interface DocManagerAPI {
  readonly docs: Accessor<DocMeta[]>;       // 列表（updatedAt desc）
  readonly activeId: Accessor<string>;
  /** 保存 active doc 文本（M3 debounce 后调用）；重算 title + updatedAt。 */
  saveActiveText(text: string): Promise<void>;
  /** 新建空文档或带初始内容（import/open-shared），切为 active，返回 id。 */
  create(initialText?: string): Promise<string>;
  /** 切换 active：flush 当前 → 加载目标 text → set DocumentState → 持久 activeId。 */
  switchTo(id: string): Promise<void>;
  /** 删除：若删 active 切最新；删到空建空 doc（永远 ≥1）。 */
  remove(id: string): Promise<void>;
}
```

启动：`loadInitialDocs()`（模块级 async）→ 迁移 + 返回 `{ docs, activeId, activeText }`，main.tsx 用 activeText 初始化 DocumentState（替代 v1.1 `loadStoredDocument`）。

## 2. M3 持久化改造（写目标 / ADR-010 D4）

`createPersistence(text, docManager)`：状态机 + debounce 不变；`performWrite` 由 `idb.put('kv',text,'document')` 改为 `await docManager.saveActiveText(text())`。**单 store 单写者**：M3 不再直接碰 IDB documents。clear() 改为清 active doc 内容（`saveActiveText('')`）。

## 3. M4 涟漪（改 v1.2 语义 / ADR-010 D6）

| 动作 | v1.2 | v1.6 |
|------|------|------|
| import .md | 覆盖 active（confirm）| `await docManager.create(text)`（新建，无 confirm）|
| open-shared `#doc=` | 覆盖 active（confirm）| `await docManager.create(shared)`（新建）|
| share / export | active doc | active doc（不变）|

**退役 i18n key**：`share.overwrite.confirm` / `import.overwrite.confirm`（覆盖语义移除）。

## 4. UI（文件列表 / ADR-010 D7）

- 桌面：左侧 `DocList` sidebar（新建按钮 + 列表项[title + 相对时间 + 删除]，active 高亮）
- 移动：header「文档」按钮 → `DocDrawer` 覆盖层（同列表，选中关闭）
- 切换/新建/删除 → 调 DocManagerAPI；列表 reactive 跟随 `docs()` signal

## 5. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| M9 DocManagerAPI（manager.ts：CRUD + active + 标题派生 + no-op-save 防抖）| ✓ | `f2986e2` |
| loadInitialDocs（store.ts：第三次迁移 先写后删 + v1.0 localStorage 直跳兜底路）| ✓ | `f2986e2` |
| M3 saveActiveText 写目标改造 + clear 改清内容（单写者）| ✓ | `f2986e2` |
| M4 import/open-shared → create 新建（退役 share/import overwrite confirm）| ✓ | `f2986e2` |
| DocList(桌面 sidebar) + DocDrawer(移动抽屉) UI + header 文档按钮 | ✓ | `f2986e2` |
| DB v1→2 升级 + idPrefix（D_）+ async bootstrap | ✓ | `f2986e2` |
| 附带修 FOUC：applyInitialTheme 同步先于 await（async bootstrap 深色闪光）| ✓ | `f2986e2` |
