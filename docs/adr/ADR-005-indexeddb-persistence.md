# ADR-005 — IndexedDB 持久化 + 迁移层

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-03 Corray：D1 选 B `idb`+手写 fallback；D2~D5 提议确认）|
| **Date** | 2026-06-03 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.1（accepted）/ module-list M3 delta / 架构 §4.1 启动序列 |
| **Supersedes** | — （不 supersede；扩展 M3 存储后端）|

## Context

共识 v1.1 决定 M3 持久化 localStorage → IndexedDB（解 PRD R2 配额）。TBD-v11-1~5 已 accept：异步 hydrate / 迁移后删旧 key / IDB 不可用降级 localStorage / 取消 1MB 提示 / init 改异步。

本 ADR 定 **how**：① IDB 访问库选型 ② 异步 PersistenceAPI 契约 ③ 迁移机制 ④ 启动序列重写 ⑤ IDB schema。

约束：
- bundle 预算 150 KB gz（当前 64.6 KB，余 ~85 KB）—— 库开销需可控
- 存储模型极简：本质就**一个文档字符串**（+ 旧 notice flag 待退役）
- TBD-v11-3 要求 IDB 不可用时降级 localStorage
- architecture-constraints §8 异步约束（traceId / try-catch / 不裸 Promise 吞异常）适用

---

## D1 — IndexedDB 访问库（**需 Decider 拍板**）

存储模型 = 单 object store、单 key（文档），get/put/delete 三操作。

### A. 原生 IndexedDB API
- **Pros:** 0 bytes 依赖；完全可控
- **Cons:** IDBRequest 事件模型样板多（open/onupgradeneeded/onsuccess/onerror）；易写错；单测要 mock 整套事件流；降级 localStorage 需手写
- 估算代码量：~40-60 行 wrapper

### B. `idb`（Jake Archibald，promise 包装）〔AI 倾向〕
- **Pros:** 极小（~1 KB gz `[推断: 需 install 实测]`）；promise 化 IDB，get/put/del 一行；维护活跃、事实标准；TS 类型好
- **Cons:** +1 依赖；降级 localStorage 仍需自己加（但单 key 场景 ~10 行）
- 估算代码量：M3 store ~15 行 + fallback ~10 行

### C. `localForage`
- **Pros:** localStorage-like 异步 API（getItem/setItem）；**内置自动降级** IDB→WebSQL→localStorage（直接满足 TBD-v11-3，零额外代码）
- **Cons:** 较大（~8 KB gz `[推断]`）；为单文档场景引入多后端抽象偏重；WebSQL 分支已废弃属死代码

### 决策：**B (`idb`) + 手写 localStorage fallback**〔Decider accepted 2026-06-03〕
单文档单 key 场景，idb 的 1KB + 10 行 fallback 比 localForage 8KB 抽象更轻、更可控，且 fallback 逻辑显式可测。**反例**：若未来要存多对象 / 复杂查询 / 想要零 fallback 代码，localForage (C) 的自动降级更省心 —— 届时可换。raw (A) 仅在"绝不加依赖"硬约束下选。

> **第三方一手文档（research-first MUST）**：选定后 install 时核对 `idb` 官方 README 的 API 签名 + 实测 bundle gz；ADR References 附链接 + 访问日期。

---

## D2 — 异步 PersistenceAPI 契约（TBD-v11-5 (a)）〔提议〕

```ts
export interface PersistenceAPI {
  readonly status: Accessor<SaveStatus>;
  clear(): Promise<void>;       // 异步（IDB delete）
  enable(): void;
  disable(): void;
}
// 移除同步 init(): string / readStoredDocument()
// 新增模块级异步加载入口：
export async function loadStoredDocument(): Promise<string>;  // IDB（失败→localStorage→''）
```

启动用 `loadStoredDocument()` 异步取初始文档 + 顺带跑迁移；`createPersistence(text)` 仍订阅 text 写 IDB。api-spec v2 / 架构 §4.1 同步改。

## D3 — 迁移机制（TBD-v11-2 (a)：先写后删、幂等）〔提议〕

`loadStoredDocument()` 内一次性迁移：
1. 读 IDB `document/current` → 有则直接返回（已迁移，幂等跳过）
2. IDB 空 → 读旧 `localStorage['editor.document.v1']`
3. 有旧值 → 写 IDB → **确认写成功** → 删旧 localStorage key（含 `editor.notice.large-doc.v1`）→ 返回该值
4. 无旧值 → 返回 `''`

不可逆删除前先确认 IDB 写成功（artifact-based-handoff「删前确认」精神）。

## D4 — 启动序列重写（TBD-v11-1 (a)：空闪现 hydrate）〔提议〕

`main.tsx`：
```
const state = createDocumentState('')        // 先空
... render(AppShell) ...                      // 首帧空 editor
loadStoredDocument().then(text => state.setText(text))  // resolve 后填入
const persist = createPersistence(state.text)
```
首帧空→hydrate 跳变；IDB 单 key 读通常 <50ms，可忽略（共识 TBD-v11-1 已接受此代价）。

## D5 — IndexedDB schema（data-model v2）〔提议〕

- DB name `editor`，version `1`
- object store `kv`（通用 key-value，keyPath 无、out-of-line key）
- 文档记录：key `document`，value = string（源文）
- 留扩展：未来多文档可加 `documents` store 而不动本 store

---

## Consequences（选定后）

- api-spec v2：PersistenceAPI 异步契约 + `loadStoredDocument`；§3.3 / 5.x 启动时序图重画
- data-model v2：IDB schema + 迁移层 + `editor.document.v1` 标退役
- test-plan delta：家族维度 `后端(IDB/localStorage-fallback) × 加载(首次迁移/已迁/无旧数据) × 异步态`
- architecture §4.1 启动序列 + §数据层更新
- bundle 预算复核（+库 gz）跑 `pnpm size` 闸

## References

- 共识 v1.1 TBD-v11-1~5
- `idb` v8.0.3（github.com/jakearchibald/idb）—— API 对照已安装包 `node_modules/idb/build/entry.d.ts` 核实（2026-06-03）：`openDB(name,version,{upgrade})` / `db.get(store,key)` / `db.put(store,value,key)` / `db.delete(store,key)`
- **实测 bundle 影响**：idb 引入后 64.64 → 66.08 KB gz（+~1.5KB；ADR 估 ~1KB 略低）；远低于 150KB 闸
- `fake-indexeddb` v6.2.5（dev）—— jsdom 无 IDB，单测用 `fake-indexeddb/auto` + `new IDBFactory()` per-test 隔离
- 实现 commit `5252add`
