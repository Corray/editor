# 测试计划 v1.6 delta — 多文档（M9 + 迁移 + 涟漪）

> v1.0 测试计划增量。覆盖 M9 文档管理 + 第三次迁移 + 涟漪。
> **基线：** 共识 v1.6 AC-v16-1~8 + ADR-010 + data-model v1.6。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.6 | 2026-06-05 | 多文档家族 + 迁移（旧单doc/新用户）+ 涟漪新建语义 |

---

## 1. 家族维度（枚举）

`文档数(0→自动建1 / 1 / 多) × 操作(新建/切换/删除/删active/删到空) × 迁移(旧单doc / 新用户 / 已多doc幂等) × 涟漪(import新建 / open-shared新建 / share·export·clear作用active)`

迁移 + CRUD 逻辑可单测（fake-indexeddb，已有 v1.1 先例）；UI 切换/抽屉/列表走 e2e。

## 2. AC ↔ 测试映射

| AC | 场景 | 层级 | 测试 |
|----|------|------|------|
| AC-v16-1 | 新建→列表+1→切换互不干扰（独立持久化）| 单测+e2e | UT-M9-create / E2E-v16-001 |
| AC-v16-2 | 切换→加载对应 doc；切换前 flush 当前存盘 | 单测+e2e | UT-M9-switch-flush / E2E-v16-002 |
| AC-v16-3 | 删除→移除；删 active→切最新；删到空→建空 | 单测 | UT-M9-remove / UT-M9-remove-active / UT-M9-remove-last |
| AC-v16-4 | **旧单doc迁移**：现有内容→第一条 doc，不丢；幂等（刷新不重复迁）| 单测 | UT-M9-migrate-legacy / UT-M9-migrate-idempotent |
| AC-v16-5 | import .md → 新建文档（不覆盖当前）| 单测+e2e | UT-M4-import-creates / E2E-v16-005 |
| AC-v16-6 | 刷新→回上次 active doc（activeDocId 持久）| e2e | E2E-v16-006 |
| AC-v16-7 | 移动端抽屉：切换/新建/删除 | e2e | E2E-v16-007（mobile context）|
| AC-v16-8 | 多文档离线可用（PWA 不退化）| e2e(pwa project) | E2E-v16-008 |
| — | 标题自动派生（首H1/首行/空=Untitled）| 单测 | UT-M9-title-derive |
| — | open-shared → 新建（不覆盖）| 单测 | UT-M4-shared-creates |

## 3. 迁移测试纪律（数据安全重点 / 比照 v1.1）

- **先写后删验证**：迁移中 documents.put 成功后才 delete `kv/document`；put 失败 → 不删旧（数据不丢），下次重试
- **幂等**：documents 非空 → 跳过迁移（UT-M9-migrate-idempotent：跑两次迁移，doc 数不翻倍）
- **fake-indexeddb**：单测用 fake-indexeddb（v1.1 已引），含 DB v1→2 onupgradeneeded 升级路径测试（旧 v1 DB → 打开 v2 → documents store 建出）
- **crypto.randomUUID polyfill**：jsdom 测试环境需确认 randomUUID 可用（不可用则 setup 注入 polyfill）

## 4. 不变量测试

- 永远 ≥1 篇（UT-M9-remove-last：删唯一 doc → 自动建空 doc，list.length===1）
- activeId 必有效（UT-M9-remove-active：删 active → activeId 切到现存最新）
- 单写者：仅 M9 写 documents（设计约束，code review 保证；M3 测试 mock docManager.saveActiveText 验证 M3 不直接碰 store）

## 5. 不测 / 边界

- 不测大量文档（100+）的列表性能（MVP，静态推断；超量另议）
- 不测拖拽排序 / 分组（非本次范围）
- DB 升级 race（多 tab 同时打开触发 versionchange）—— 记为已知边界（v1.6.x 评估），MVP 单 tab 假设
