# 测试计划 v2.6 delta — 版本快照

> **基线：** 共识 v2.6 AC-v26-1~8 + ADR-022。fake-indexeddb 单测主战场（v1.1 迁移先例）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.6 | 2026-06-15 | 自动 × 手动 × 配额 × cascade × 恢复 × 升级 × 降级 7 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v26-1 | 自动快照间隔 + 内容去重 | unit（fake-idb + 注入 now）|
| AC-v26-2 | 手动快照即刻出现 | unit + e2e ac19 |
| AC-v26-3 | 恢复 → 内容变 + 多一张 restore 保护快照 | unit + e2e |
| AC-v26-4 | 配额 30 FIFO | unit |
| AC-v26-5 | 删文档 cascade 删快照 | unit |
| AC-v26-6 | **DB v2→v3 升级零损** | unit（预置 v2 DB → 开 v3 → documents/active 完整 + snapshots 可用）|
| AC-v26-7 | 降级态隐藏入口 | unit（store no-op）+ e2e（mock idb 不可用，入口不渲染）|
| AC-v26-8 | M11 零变化 | 既有 m11 unit 回归 |

## 家族维度（设计期枚举）

- **自动族**：`间隔内不重复 × 超间隔且内容变才存 × 内容相同不存 × 首次保存存基线 × piggyback 不阻塞主保存`
- **配额族**：`存第 31 张 → 删最旧 × 总数恒 ≤30 × FIFO 按 createdAt 不分 kind`
- **cascade 族**：`删文档 → 其快照清零 × 不误删他文档快照`
- **恢复族**：`restore 前存保护快照 × 恢复后编辑器=目标 text × 保护快照=恢复前内容 × kind 标记正确`
- **升级族**：`v2 DB（documents+kv 有数据）→ 开 v3 → 数据完整 + snapshots store 可写 × 全新装直接 v3`
- **降级族**：`isIdbUnavailable → putSnapshot/list/delete 全 no-op/[]・UI 入口不渲染`

## 测试入口

- unit：`tests/unit/m9-doc-manager/snapshots.test.ts`（store + manager piggyback/restore/cascade，fake-indexeddb）
- e2e：`tests/e2e/ac19-snapshots.spec.ts`（双引擎：手动快照 → 历史列表 → 恢复 → 保护快照）
- 既有全量：unit 255 + e2e 134 不退
