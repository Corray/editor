# 接口设计 v1.1 delta — M3 持久化异步契约

> v1.0（`api-spec-v1.0.md`）的增量。仅 M3 PersistenceAPI 因 IndexedDB 异步化而变更；其余模块契约不变。
> **基线：** 共识 v1.1（accepted）+ ADR-005（accepted，D1=idb）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.1 | 2026-06-03 | M3 PersistenceAPI 异步契约（init→loadStoredDocument / clear→Promise）；启动序列重画 |

---

## 1. M3 PersistenceAPI（替代 v1.0 §3.3）

```ts
// modules/m3-persistence/api.ts
import type { Accessor } from 'solid-js';

export type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'ERROR';

export interface PersistenceAPI {
  readonly status: Accessor<SaveStatus>;
  /** 清空：删 IDB 文档 + 遗留 localStorage 旧 key。异步（IDB delete）。 */
  clear(): Promise<void>;
  enable(): void;
  disable(): void;
  // ❌ 移除 init(): string —— 同步契约破裂（ADR-005 D2）
}

/**
 * 模块级异步加载初始文档（替代 readStoredDocument 同步版）。
 * 顺带跑一次性迁移（旧 localStorage → IDB）。
 * 失败链：IDB 读失败 → localStorage fallback → ''。
 */
export async function loadStoredDocument(): Promise<string>;

export function createPersistence(text: Accessor<string>): PersistenceAPI;
```

**变更点（相对 v1.0）：**
- `init(): string` / `readStoredDocument(): string` **移除** → `loadStoredDocument(): Promise<string>`
- `clear(): void` → `clear(): Promise<void>`
- `status` / `enable` / `disable` / `createPersistence` 签名**不变**（状态机保留）

**消费方变更：** 仅 `main.tsx`（chrome 装配）—— 启动序列改异步（见 §2）。M1/M2/M4 不消费 M3，无影响。

## 2. 启动序列（替代 v1.0 架构 §4.1 同步版 / ADR-005 D4）

```
render(AppShell) 内：
  1. state = createDocumentState('')            // 先空，首帧空 editor
  2. persist = createPersistence(state.text)    // 订阅 text（debounce 写 IDB）
  3. editor / theme / exporter / layout / prefs  // 其余同步装配不变
  4. loadStoredDocument().then(text => {         // 异步 hydrate
       if (text) state.setText(text)             // resolve 后填入（共识 TBD-v11-1 (a)：空闪现）
     })
```

时序（替代 v1.0 §3.3 chicken-and-egg 说明）：
```
页面加载
  ↓
createDocumentState('')  →  首帧渲染（空 editor）
  ↓ (async, 通常 <50ms)
loadStoredDocument()
  ├─ IDB get 'document' → 命中 → setText
  ├─ IDB 空 + 旧 localStorage 有 → 迁移（写 IDB→确认→删旧）→ setText
  ├─ 都空 → '' （新用户）
  └─ IDB 不可用 → localStorage fallback（共识 TBD-v11-3）
```

## 3. 错误 / 降级协议（共识 TBD-v11-3 / architecture-constraints §8 异步）

- IDB 写失败（极罕见）→ status=ERROR + toast（同 v1.0 ERROR 态 + 5s fallback IDLE）
- IDB **不可用**（隐私模式 / 老浏览器 / 被禁）→ 整个 M3 降级 localStorage 后端 + 一次性 toast 告知"大文档可能受限"
- 所有异步任务体 try/catch 包裹，catch 分支 log + 不裸吞（architecture-constraints §8）

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | Issue / commit |
|------|------|---------------|
| `loadStoredDocument()` + 迁移 | ✓ 已实现（2026-06-03）| commit `5252add` — idb get + 先写后删幂等迁移；12 单测 + E2E-v11-001 |
| `createPersistence` 异步写 IDB + fallback | ✓ 已实现 | commit `5252add` — idb put；IDB 不可用降级 localStorage + storage.degraded toast |
| `clear()` 异步 | ✓ 已实现 | commit `5252add` — idb delete + 遗留 localStorage key 清理 |
| main.tsx 启动序列重写 | ✓ 已实现 | commit `5252add` — 异步 hydrate（空闪现）+ 竞争防护（已输入不覆盖）|
