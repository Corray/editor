# 接口设计 v2.6 delta — 版本快照

> **基线：** 共识 v2.6（accepted）+ ADR-022 + data-model v2.6。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.6 | 2026-06-15 | store snapshots CRUD；DocManagerAPI +快照三 API；HistoryDialog；i18n history.* |

---

## 1. M9 store 扩展（ADR-022 D1/D3）

```ts
export interface SnapRecord {
  id: string;       // SN_<uuid>
  docId: string;    // D_<uuid>
  title: string;
  text: string;
  createdAt: number;
  kind: 'auto' | 'manual' | 'restore';
}
/** 存快照 + prune（超 MAX_SNAPSHOTS_PER_DOC FIFO）。降级 no-op。 */
export function putSnapshot(rec: SnapRecord): Promise<void>;
/** 列某文档快照（createdAt desc）。降级返 []。 */
export function listSnapshotsByDoc(docId: string): Promise<SnapRecord[]>;
/** 删某文档全部快照（cascade）。降级 no-op。 */
export function deleteSnapshotsByDoc(docId: string): Promise<void>;
/** 该文档最近一张快照 createdAt（auto 间隔判定）；无 → null。 */
export function latestSnapshotAt(docId: string): Promise<number | null>;
export const MAX_SNAPSHOTS_PER_DOC = 30;
export const AUTO_SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;
```

## 2. DocManagerAPI 扩展（ADR-022 D2/D4）

```ts
export interface DocManagerAPI {
  // …既有…
  /** 立即对 active 文档存 manual 快照。 */
  snapshotNow(): Promise<void>;
  /** 列某文档快照（默认 active）。 */
  listSnapshots(docId?: string): Promise<SnapRecord[]>;
  /** 恢复快照：先存 restore 保护快照（当前内容）→ 灌入目标 text + 持久化。 */
  restoreSnapshot(snapId: string): Promise<void>;
}
```

- **自动快照**（piggyback）：saveActiveText 内部，写后异步检查间隔 + 内容去重 → `void putSnapshot(auto)`；`lastSnapAt` 内存缓存
- **remove cascade**：remove(id) → `deleteSnapshotsByDoc(id)`
- 降级态（isIdbUnavailable）→ 三 API 全 no-op / 返 []

## 3. UI（HistoryDialog / DocList ⏱ 入口）

```ts
// m9-doc-manager/HistoryDialog.tsx
export function HistoryDialog(props: {
  open: boolean; onClose: () => void;
  snapshots: Accessor<SnapRecord[]>;
  onSnapshotNow: () => void;
  onRestore: (snapId: string) => void;
}): JSX.Element;
```

- DocList active 项加 ⏱ 按钮（仅 IDB 可用时渲染）→ 开 HistoryDialog（app 层持 open 态 + 拉 listSnapshots）
- 列表项：相对时间 + 字数 + kind 徽标 + 「恢复」；顶部「立即快照」按钮；恢复 confirm
- i18n：`history.button/title/empty/snapshotNow/restore/restore.confirm/kind.auto/kind.manual/kind.restore`

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| store DB v3 + snapshots CRUD + prune（getAllFromIndex byDoc）| ✓ | `4f3afb0` |
| manager piggyback（lastSnap 缓存 + seed）+ cascade + snapshotNow/listSnapshots/restoreSnapshot | ✓ | `4f3afb0` |
| HistoryDialog + DocList ⏱ 入口（IDB-gated）+ AppShell 装配（snapshots 信号 + confirm 恢复）| ✓ | `4f3afb0` |
| i18n history.*（+EXPECTED_KEYS）| ✓ | `4f3afb0` |

> 测试：unit +8（CT-SNAP store×3 / 升级×1 / manager×4，fake-indexeddb）→ 263；e2e +2 用例双引擎（ac19：手动快照 + 恢复+保护快照）→ 138 + 3 skip。首屏 90.52KB。
> **附带回归修复**：DB_VERSION 2→3 后 e2e `_storage.ts` helper（resetStorage/readActiveDocText）硬编码 open v2 → VersionError 静默失败 → 测试串扰；升 v3 + 建/清 snapshots store + 删死代码 readIdbDoc。同步既有 doc-manager unit 硬编码 `openDB('editor',2)` → 3。
