# ADR-012 — 多文档增强：手动标题锁（titleManual）+ 内联重命名 + 标题/内容搜索

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-05：D1=titleManual 锁 / D2=内联双击重命名 / D3=标题+内容过滤 / 内存 records 复用）|
| **Date** | 2026-06-05 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.8（accepted）/ ADR-010（M9 多文档 / 自动派生标题）/ data-model v1.6（documents store）|
| **Supersedes** | — |

## Context

v1.6 自动派生标题导致同名（F-V16-2）+ 难检索。本 ADR 定 how：① 重命名后标题不被自动覆盖 ② 内联重命名 UI ③ 搜索过滤。

---

## D1 — 手动标题锁（titleManual / 数据模型）
`DocRecord` 加 `titleManual?: boolean`。
- 重命名（非空）→ `title=用户输入.trim()` + `titleManual=true`；此后 `saveActiveText` **跳过** deriveTitle（保住手动名）
- 重命名为空 → `titleManual=false` + 立即 `deriveTitle(text)`（回退自动）
- **无 DB 版本升级**：IndexedDB store 内记录 schemaless，旧记录无 `titleManual` = `undefined` = falsy = 自动派生（无迁移，AC-v18-6）

## D2 — 内联重命名 UI（TBD-v18-1a）
DocList 列表项标题双击 → 替换为 `<input>`（值=当前 title）→ Enter / blur 提交 `rename(id, value)`；Esc 取消（恢复原值，不提交）。`stopPropagation` 防触发行切换。移动抽屉同此交互。

## D3 — 搜索过滤（TBD-v18-3a / TBD-v18-4a）
M9 manager 持 `query` 信号 + `setQuery`。`docs()` 返回**按 query 过滤**的 meta 列表：query 空 = 全部；否则 `title` 或 **`text`**（records 已含，无额外 IO）大小写不敏感 includes 命中。DocList 顶部搜索框 → setQuery。仅过滤列表，不跳转匹配位置（共识范围）。
- 过滤在 manager（持 records+text），DocMeta 不需带 text。

---

## Consequences

- **module-list**：M9 delta（+rename + query/setQuery + titleManual）
- **data-model delta**：DocRecord +`titleManual?:boolean`（无 DB 升级 / 旧记录兼容）
- **api-spec delta**：DocManagerAPI +`rename(id,title)` +`query`/`setQuery`；`docs()` 语义变"过滤后列表"
- DocList：搜索框 + 内联重命名（双击）；DocDrawer 同步
- i18n：搜索占位符（`doc.search`）
- test-plan delta：重命名（提交/空回退/Esc）+ 标题锁（改名后编辑不覆盖）+ 搜索（标题/内容命中/清空）+ 旧记录无 titleManual 兼容
- 无安全面（重命名输入纯文本显示，不 innerHTML；不动 sanitize）
- 测试：M9 单测（rename + titleManual 锁 + search 过滤）；e2e（内联重命名 + 搜索过滤）

## References

- 共识 v1.8 TBD-v18-1~4
- ADR-010（M9 / saveActiveText 自动派生标题——本 ADR 加 titleManual 旁路）
- data-model v1.6（documents store / DocRecord 字段）；IndexedDB store 内 schemaless（加可选字段无需 onupgradeneeded）
- F-V16-2（同名问题 / 本 ADR resolve）
- 实现 commit：`<TBD 实现后回填>`
