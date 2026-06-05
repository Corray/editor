# 接口设计 v1.8 delta — 多文档增强（rename + search）

> v1.0 接口增量。DocManagerAPI 加 rename + query/setQuery；docs() 语义变过滤后列表。
> **基线：** 共识 v1.8（accepted）+ ADR-012 + data-model v1.8。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.8 | 2026-06-05 | DocManagerAPI +rename +query/setQuery；DocRecord +titleManual |

---

## 1. DocManagerAPI（扩 v1.6 / ADR-012）

```ts
export interface DocManagerAPI {
  readonly docs: Accessor<DocMeta[]>;   // v1.8：返回按 query 过滤后的列表（query 空=全部）
  readonly activeId: Accessor<string>;
  readonly query: Accessor<string>;     // 新增：当前搜索词
  setQuery(q: string): void;            // 新增：设搜索词（实时过滤 docs()）
  saveActiveText(text: string): Promise<void>; // v1.8：titleManual 时跳过 deriveTitle
  create(initialText?: string): Promise<string>;
  switchTo(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  rename(id: string, title: string): Promise<void>; // 新增：手动重命名（空→回退自动）
}
```

**rename 语义（ADR-012 D1）：** title.trim() 非空 → 记录 `title`+`titleManual=true`；空 → `titleManual=false`+`deriveTitle(text)`。putDoc + 刷新列表。

**docs() 过滤（ADR-012 D3）：** query 空=全部（updatedAt desc）；否则 title 或 text 大小写不敏感 includes 命中（records 含 text，无额外 IO）。

## 2. UI（DocList / DocDrawer）

- 顶部搜索框：`oninput → setQuery(value)`；占位 `t('doc.search')`
- 列表项标题双击 → `<input>`（值=title）→ Enter/blur 提交 `rename(id, value)`；Esc 取消（恢复原值，不提交）；`stopPropagation` 防行切换
- 移动抽屉同此

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| DocRecord +titleManual（store）| ⏳ | — |
| manager rename + saveActiveText titleManual 旁路 | ⏳ | — |
| manager query/setQuery + docs() 过滤（title+text）| ⏳ | — |
| DocList 搜索框 + 内联重命名（双击/Enter/Esc）| ⏳ | — |
| i18n doc.search | ⏳ | — |
