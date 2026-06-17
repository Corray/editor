# 共识文档 v2.9 — 设置面板（M13，收口散落常量）

> v1.0 共识增量 delta（2026-06-17 四项打磨 scope 第三项）。
>
> **状态：** `accepted`（2026-06-17；TBD-v29-1~4 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M13 新增 → ADR-025 → data-model/api/test-plan delta → 实现
> **命名：** semver tag **v1.9.0-rc.1**。L2（新增 M13 薄设置模块 + 消费方读取改造）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.9-draft | 2026-06-17 | 设置面板：快照间隔/上限可调 + 持久化；承载 v3.0 语言切换入口；4 TBD |
| v2.9 | 2026-06-17 | TBD-v29-1~4 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

多版本积累的散落常量（快照间隔 5min / 上限 30 / …）此前硬编码无从调整（F-V26-2）。本版建 M13 设置模块**收口**这些值，暴露为用户可调 + localStorage 持久化；并为 v3.0 语言切换预留入口。

**范围（仅）：** M13 设置 store（signals + localStorage）+ 设置面板 UI + 快照相关常量收口（M9 改读 settings）。
**不在本次：** 语言切换实现（v3.0，本版只预留 UI 占位）/ 字号档（已有 A−/A+）/ 行号默认（已有 # toggle）/ 主题（已有切换）。

---

## 2. 张力

### 张力 A — 收口范围（过度工程风险）
F-V26-2 曾判"硬编码 MVP 接受"。暴露太多设置 = UI 表面膨胀 + 用户从不调 = ceremony。取舍：只收口**有实际调整价值**的——快照间隔（含关闭）+ 每文档上限。字号/行号/主题已有专门入口，不重复进设置。

### 张力 B — 纯 IDB 层不耦合 Solid
M9 `store.ts`（纯 IDB）不应 import 设置 signal。收口方式：M13 暴露 plain accessor，M9 `manager.ts`（已 Solid-aware）读取并传入；`putSnapshot` 的 prune 上限改为参数（默认值保留向后兼容）。

---

## 3. 待确认项（TBD-v29-x）

### TBD-v29-1 — 收口哪些设置〔需你拍板：范围〕
- **(a) 2 项**：自动快照（开/关 + 间隔档：1/5/10 min）+ 每文档快照上限（10/30/50）〔AI 倾向：仅收口有调整价值的，避免膨胀〕
- (b) +自动保存防抖延迟（技术性强，用户难判，不建议）
- (c) +字号/行号也搬进设置（与现有 A−/A+ / # 入口重复）

### TBD-v29-2 — 设置入口
- **(a) header ⚙ 按钮 → 设置对话框**（与 ⌨ help 同款浮层）〔AI 倾向〕
- (b) 并入帮助面板（混淆"帮助"与"设置"语义）

### TBD-v29-3 — 持久化与默认
- **(a) localStorage `editor.settings.v1`（JSON）+ 启动 hydrate**，默认值 = 现有硬编码（快照 5min/30，零行为变化）；坏数据/缺字段回退默认〔AI 倾向：M6 theme / M1 prefs 同范式〕
- (b) 进 IndexedDB kv（设置非文档数据，localStorage 够）

### TBD-v29-4 — 语言入口预留
- **(a) 设置面板含"语言"段，v2.9 仅显示当前语言（中文）只读占位，v3.0 接切换**〔AI 倾向：结构先到位〕
- (b) v2.9 完全不提语言（v3.0 再加段）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | **M13 设置**（新增）| 新行 |
| **ADR-025** | M13 settings store（signals + localStorage hydrate/persist）+ M9 改读 settings（putSnapshot maxPerDoc 参数化 + manager 间隔读 settings）+ SettingsDialog | L2 |
| data-model | localStorage `editor.settings.v1` schema（非 IDB）| 轻量 |
| api-spec delta | SettingsAPI（autoSnapshot enabled/intervalMs + maxSnapshotsPerDoc + set*）；M9 putSnapshot 签名 +maxPerDoc?；SettingsDialog | 契约 |
| test-plan delta | 家族：`持久化(存/读/坏数据回退默认) × 快照间隔(关闭→不存/改档生效) × 上限(改档 FIFO 按新值) × 默认零行为变化` | 覆盖 |

---

## 5. 验收条件（AC-v29-x）

- AC-v29-1：header ⚙ → 设置面板；Esc/遮罩关闭
- AC-v29-2：自动快照关闭 → 编辑不再产生 auto 快照（手动仍可）
- AC-v29-3：改快照间隔档（1/5/10min）→ 新间隔生效（auto 快照按新阈值）
- AC-v29-4：改每文档上限（10/30/50）→ FIFO 按新值裁剪
- AC-v29-5：设置持久化 → 刷新后保留；localStorage 坏数据 → 回退默认不崩
- AC-v29-6：**默认值 = 原硬编码（快照 5min/30）→ 不改设置时零行为变化**（M9 既有行为回归）
- AC-v29-7：语言段显示当前语言（只读占位，v3.0 接切换）
- AC-v29-8：既有零回归（快照/字号/行号/主题）

> 无安全面：设置值纯数字/布尔，localStorage 存储；不动 sanitize/RLS。
