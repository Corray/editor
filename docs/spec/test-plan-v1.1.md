# 测试计划 v1.1 delta — IndexedDB 持久化

> v1.0 测试计划（`test-plan-v1.0.md`）的增量。覆盖 M3 持久化升级的新验收 + 家族维度。
> **基线：** 共识 v1.1 AC-v11-1~5 + ADR-005 + api-spec v1.1 + data-model v1.1。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.1 | 2026-06-03 | 持久化迁移 / 异步态 / 降级 家族矩阵 |

---

## 1. 验收条件矩阵（共识 AC-v11-x → 测试场景）

| AC | 场景 | 测试 ID | 层 |
|----|------|---------|----|
| AC-v11-1 | 老用户 localStorage 有文档 → 首开 v1.1 无损迁入 IDB + 可继续编辑 | UT-MIG-001 / E2E-v11-001 | unit + e2e |
| AC-v11-2 | 编辑 → 刷新 → 内容存活（IDB 路径，替代 v1.0 AC-2）| E2E-v11-002 | e2e |
| AC-v11-3 | >5MB 文档（旧 localStorage 会爆量级）→ IDB 正常存取 | UT-IDB-003 | unit |
| AC-v11-4 | IDB 不可用（隐私模式模拟）→ 降级 localStorage + toast | UT-FALLBACK-004 | unit |
| AC-v11-5 | 清空 → IDB + 遗留 localStorage 旧 key 一并清 | UT-CLEAR-005 | unit |

## 2. 家族维度枚举（设计期定，非 bug 复现反推）

**核心家族：`后端 × 加载场景 × 异步态`**

| 维度 | 取值 |
|------|------|
| 后端 | IDB（正常）/ localStorage（IDB 不可用降级）|
| 加载场景 | 首次迁移（IDB 空 + 旧 localStorage 有）/ 已迁移（IDB 有）/ 无旧数据（新用户，都空）|
| 异步态 | IDLE / DIRTY / SAVING（真异步）/ ERROR |
| 迁移幂等 | 迁移后再开（IDB 已有）不重复迁、不重写旧 key |

**必测组合（不漏网）：**
- 迁移 × {成功删旧 key / IDB put 失败不删旧 key（数据不丢）}
- 降级 × {读 / 写 / 清空} 三操作都落 localStorage
- 幂等 × 二次加载（已迁移）跳过迁移
- 清空 × {纯 IDB / 降级 localStorage / 有遗留旧 key}

## 3. 用例清单（关键）

| ID | 场景 | 前置 | 步骤 | 预期 |
|----|------|------|------|------|
| UT-MIG-001 | 迁移成功 | IDB 空 + localStorage['editor.document.v1']='# old' | loadStoredDocument() | 返回 '# old'；IDB kv/document='# old'；旧 key 已删 |
| UT-MIG-002 | 迁移幂等 | IDB kv/document='# x'（已迁）| loadStoredDocument() | 返回 '# x'；不读 localStorage；不重写 |
| UT-MIG-003 | 迁移 put 失败保旧 | IDB put 抛错 | loadStoredDocument() | 旧 localStorage key **不删**（数据不丢）；降级返回旧值 |
| UT-IDB-001 | 写往返 | — | createPersistence + setText → debounce | IDB kv/document = 新值；status IDLE |
| UT-FALLBACK-004 | IDB 不可用 | mock indexedDB undefined | load + 写 + clear | 全落 localStorage；一次性 toast |
| UT-CLEAR-005 | 清空全清 | IDB 有 + 遗留旧 key | clear() | IDB document 删 + 旧 key 删 |
| E2E-v11-001 | 迁移端到端 | localStorage 注入旧文档 | 开页 → reload | 文档显示 + IDB 有 + 旧 key 无 |
| E2E-v11-002 | IDB 持久化往返 | — | 输入 → reload | 内容存活 |

## 4. 测试基础设施注意（PP-003）

- **fake-IndexedDB**：jsdom 无 IDB → 单测需 `fake-indexeddb` 或 mock `idb`。选型 install 时定（fake-indexeddb 是事实标准，~轻量）。research-first 核对其 API。
- **异步态测试**：IDB 操作是真 Promise，配合 Solid effect microtask + debounce fake timer → 沿用 PP-003 #2 的 flushMicrotasks 模式
- **降级测试**：`vi.stubGlobal('indexedDB', undefined)` 模拟不可用
- **e2e 迁移**：用 `page.evaluate` 注入 localStorage 旧 key 后 reload，断言 IDB（`page.evaluate` 读 idb）+ 旧 key 清除

## 5. 回归基线

- v1.0 AC-2（localStorage 持久化往返）→ 被 AC-v11-2（IDB 往返）替代；旧 E2E-AC2-* 改走 IDB 路径或保留作 fallback 路径覆盖
- bundle 预算复核：+idb gz 后跑 `pnpm size`（150KB 闸）
