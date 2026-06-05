# 共识文档 v1.8 — 多文档增强（重命名 + 搜索）

> v1.0 共识增量 delta（多文档 v1.6 的增强：手动重命名 + 文档搜索）。
>
> **状态：** `accepted`（2026-06-05；TBD-v18-2/4 AI 倾向 + v18-1=(a) 内联编辑 / v18-3=(a) 标题+内容 拍板）
> **flow 位置：** 共识 draft → module-list M9 delta → 架构 + ADR-012 → api/data-model/test-plan delta → 实现
> **命名：** semver tag 将是 **v0.9.0**（同先例）。L2（扩 M9，不动渲染/持久化根基）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.8-draft | 2026-06-05 | 文档手动重命名（解 F-V16-2）+ 标题/内容搜索过滤；4 TBD 待 accept |

---

## 1. 动机与范围

v1.6 多文档用**自动派生标题**（首行/H1），导致两个痛点：① 多篇同首行 → 列表全显同名，无法区分（F-V16-2）；② 文档多了找不到。本版补：手动重命名 + 搜索过滤。

**范围（仅）：** M9 文档列表的重命名 + 搜索。
**不在本次：** 分组/文件夹 / 标签 / 拖拽排序 / 全文高亮定位（仅过滤列表，不跳转到匹配位置）。

---

## 2. 张力

### 张力 A — 重命名 vs 自动标题
v1.6 标题保存时从 text 派生。手动重命名后若仍自动派生 → 用户改的名被下次编辑覆盖。需"手动标题锁"——重命名后不再自动派生。见 **TBD-v18-2**（数据模型加标志）。

### 张力 B — 搜索范围与成本
仅标题搜（快、弱）vs 标题+内容搜（有用、需扫全部 doc 的 text）。M9 已有 records 内存缓存（含 text）→ 内容搜无额外 IO。见 **TBD-v18-3**。

---

## 3. 待确认项（TBD-v18-x；HOW 在 ADR-012）

### TBD-v18-1 — 重命名 UI〔需你拍板：UX〕
- **(a) 列表项内联编辑**：双击标题 → 变输入框 → Enter/失焦提交，Esc 取消〔AI 倾向：零额外 chrome〕
- (b) 每项一个 ✎ 按钮 → 弹 `prompt()` 输入
- (c) 选中项后 header 加重命名按钮

### TBD-v18-2 — 手动标题锁（数据模型）
- **(a) DocRecord 加 `titleManual?: boolean`**：重命名 → `title`=用户输入 + `titleManual=true`；此后 saveActiveText **不**再 deriveTitle；重命名为空 → 回退自动（`titleManual=false`）〔AI 倾向〕— 无 DB 版本升级（IndexedDB store 内 schemaless，旧记录无该字段 = falsy = 自动，无迁移）
- (b) 单独 manualTitle 字段 → 冗余 → 拒绝

### TBD-v18-3 — 搜索范围〔需你拍板：产品〕
- **(a) 标题 + 内容**：query 匹配 title 或 text（M9 records 已含 text，无额外 IO）〔AI 倾向：notes 场景"找那篇讲 X 的"最有用〕
- (b) 仅标题：快但弱（多篇同名时尤其无力）

### TBD-v18-4 — 搜索 UI/行为
- **(a) 文档列表顶部搜索框 → 实时过滤列表（空 query=全部）；不跳转匹配位置（仅筛列表）**〔AI 倾向〕

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M9 delta（+rename + search + titleManual）| §M9 |
| 架构 + **ADR-012** | titleManual 锁 + 内联重命名编排 + 搜索过滤（title+text） | L2 |
| api-spec delta | DocManagerAPI +rename(id,title) + 列表搜索（filtered docs 或 query signal）| 契约 |
| **data-model delta** | DocRecord +`titleManual?:boolean`（无 DB 升级 / 旧记录兼容）| 轻量 |
| test-plan delta | 家族：`重命名(提交/空回退/Esc 取消) × 标题锁(改名后编辑不覆盖) × 搜索(标题命中/内容命中/无果/清空)` | 覆盖 |

---

## 5. 验收条件（v1.8 新增 AC，待 test-plan 细化）

- AC-v18-1：双击文档标题 → 输入框 → 改名 + Enter → 列表显示新名（TBD-v18-1a）
- AC-v18-2：重命名后**继续编辑文档内容 → 标题不被自动派生覆盖**（titleManual 锁 / 解 F-V16-2）
- AC-v18-3：重命名为空 → 回退自动派生标题
- AC-v18-4：Esc / 失焦取消 → 保留原标题（取消语义）
- AC-v18-5：搜索框输入 → 列表按标题**或内容**命中过滤（TBD-v18-3a）；清空 → 恢复全部
- AC-v18-6：旧文档（无 titleManual 字段）→ 仍自动派生（无迁移回归）

> 无安全门槛（无新外部输入面 / 不动 sanitize）。重命名输入作为文档标题，纯文本显示（不 innerHTML），无 XSS 面。
