# 接口设计 v2.9 delta — 设置面板（M13）

> **基线：** 共识 v2.9（accepted）+ ADR-025。data-model = localStorage（非 IDB）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.9 | 2026-06-17 | M13 SettingsAPI；putSnapshot +maxPerDoc?；createDocManager deps +settings?；SettingsDialog；i18n settings.* |

---

## 1. M13 SettingsAPI（ADR-025 D1）

```ts
// m13-settings/settings.ts
export interface SettingsAPI {
  readonly autoSnapshotEnabled: Accessor<boolean>;   // 默认 true
  readonly autoSnapshotIntervalMs: Accessor<number>; // 默认 300000；∈ {60000,300000,600000}
  readonly maxSnapshotsPerDoc: Accessor<number>;     // 默认 30；∈ {10,30,50}
  setAutoSnapshotEnabled(v: boolean): void;
  setAutoSnapshotIntervalMs(ms: number): void;
  setMaxSnapshotsPerDoc(n: number): void;
}
export function createSettings(): SettingsAPI;
export const SNAPSHOT_INTERVAL_PRESETS = [60000, 300000, 600000] as const;
export const SNAPSHOT_MAX_PRESETS = [10, 30, 50] as const;
```

## 2. M9 收口改造（ADR-025 D2）

```ts
// store.ts —— prune 上限参数化（默认值向后兼容）
export function putSnapshot(rec: SnapRecord, maxPerDoc?: number): Promise<void>;

// manager.ts —— deps +settings?；缺省回退原常量
export interface DocManagerDeps {
  // …既有…
  settings?: Pick<SettingsAPI, 'autoSnapshotEnabled' | 'autoSnapshotIntervalMs' | 'maxSnapshotsPerDoc'>;
}
// maybeAutoSnapshot：enabled false→skip；间隔/上限读 settings（无 settings→原常量）
```

## 3. SettingsDialog + 装配（ADR-025 D3/D4）

```ts
// m13-settings/SettingsDialog.tsx
export function SettingsDialog(props: {
  open: boolean; onClose: () => void; settings: SettingsAPI;
}): JSX.Element;
```
- AppShell：createSettings() → 传入 createDocManager deps.settings + SettingsDialog；header ⚙ 按钮开
- 语言段：只读"中文"（v3.0 接切换）
- i18n：`settings.button/title/autoSnapshot/autoSnapshot.off/interval/interval.1min/interval.5min/interval.10min/maxSnapshots/language/language.zh`

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| M13 settings.ts（signals + localStorage + anti-poisoning）| ⏳ | — |
| store putSnapshot maxPerDoc 参数化 + manager settings 注入 | ⏳ | — |
| SettingsDialog + header ⚙ + AppShell 装配 | ⏳ | — |
| i18n settings.*（+EXPECTED_KEYS）| ⏳ | — |
