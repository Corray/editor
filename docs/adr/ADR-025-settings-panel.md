# ADR-025 — 设置面板：M13 settings store + 快照常量收口

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-17：D1=M13 signals+localStorage / D2=快照常量收口 M9 读 settings / D3=SettingsDialog header ⚙ / D4=语言段只读占位）|
| **Date** | 2026-06-17 |
| **Decider** | FE (Corray，共识 v2.9 TBD 全拍) |
| **Context** | 共识 v2.9 / ADR-022（快照 MAX/INTERVAL 常量）/ M1 prefs + M6 theme（持久化范式）|

## D1 — M13 settings store（TBD-v29-1a/3a）

`m13-settings/settings.ts`：signal + createEffect 持久化（照搬 M1 prefs 范式）。localStorage `editor.settings.v1`（JSON）。

```ts
interface SettingsAPI {
  autoSnapshotEnabled: Accessor<boolean>;   // 默认 true
  autoSnapshotIntervalMs: Accessor<number>; // 默认 300000（5min）；档 60000/300000/600000
  maxSnapshotsPerDoc: Accessor<number>;     // 默认 30；档 10/30/50
  setAutoSnapshotEnabled / setAutoSnapshotIntervalMs / setMaxSnapshotsPerDoc
}
```
- anti-poisoning：interval 必属档位集 / max 必属档位集 / enabled 必 boolean，否则回默认（prefs readInitial 范式）
- **默认值 = 原硬编码** → 不改设置零行为变化（AC-v29-6）

## D2 — 快照常量收口（TBD-v29-1a）

- `store.ts` `putSnapshot(rec, maxPerDoc = MAX_SNAPSHOTS_PER_DOC)`：prune 上限**参数化**（默认值保留向后兼容 / 既有调用不破）
- `manager.ts` 注入 settings（createDocManager deps +settings?）：
  - `maybeAutoSnapshot`：`settings.autoSnapshotEnabled()` false → skip；间隔读 `settings.autoSnapshotIntervalMs()` 而非常量
  - `putSnapshot` 传 `settings.maxSnapshotsPerDoc()`
  - settings 缺省（未注入）→ 回退原常量（测试/向后兼容）
- **纯 IDB 层 store.ts 不 import M13**（仅收 maxPerDoc 数值参数）；manager 已 Solid-aware，读 settings accessor（张力 B 解法）

## D3 — SettingsDialog（TBD-v29-2a）

- header ⚙ 按钮（AppShell，window 级 keydown 不加——设置低频，按钮足够）→ SettingsDialog 浮层（help/history 同款骨架）
- 控件：自动快照开关（checkbox）+ 间隔档（radio/select 1/5/10min）+ 上限档（10/30/50）+ 语言段（只读"中文"占位）
- Esc/遮罩关闭

## D4 — 语言占位（TBD-v29-4a）

设置面板含"语言"段，v2.9 显示只读"中文"；v3.0 接 setLang 切换。结构先到位，避免 v3.0 再动面板布局。

## Consequences

- module-list：M13 新增（薄设置模块）
- data-model：localStorage `editor.settings.v1` schema（非 IDB）
- api-spec delta：SettingsAPI；putSnapshot +maxPerDoc?；createDocManager deps +settings?；SettingsDialog
- i18n：`settings.*`（button/title/autoSnapshot/interval/max/language/分钟档等）
- test-plan delta：持久化(存/读/坏数据回退) × 间隔(关→不存/改档) × 上限(改档 FIFO) × 默认零行为变化
- 无安全面：纯数字/布尔 localStorage
- **架构价值**：快照常量从散落硬编码 → 收口 M13 单一来源（消除魔法值 / arch-constraints §10.3）
