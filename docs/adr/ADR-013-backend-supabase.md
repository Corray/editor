# ADR-013 — 后端选型：Supabase BaaS（经 M11 Gateway 封装）

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-08：BaaS=Supabase / Gateway 封装 / anon-key+RLS / 部署拓扑）|
| **Date** | 2026-06-08 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v2.0（accepted，紧 MVP）/ ADR-004（GH Pages 静态）/ architecture-constraints §7（第三方走 Gateway）|
| **Supersedes** | — |

## Context

v2.0 引后端（账号 + 云同步），破纯 FE。需定后端形态 + 与现有静态部署/架构的关系。

## Decision

### D1 — BaaS = Supabase〔选定〕
- **Pros:** 托管 Postgres + Auth + RLS 行级安全 + JS client；一人项目无服务器运维；RLS 提供声明式数据隔离（安全核心交给成熟实现）
- **Cons:** 锁 Supabase；anon key 公开（靠 RLS 而非密钥保护）；明文存云（MVP 不 E2EE）
- **反例（何时不选）:** 若需自定义复杂后端逻辑/避免 vendor lock → 自建；但一人 MVP 工程量/烂尾风险最高，拒绝。Firebase 亦可但文档型 + 锁 Google，Postgres+RLS 的关系模型 + SQL 对本项目（结构化 doc 表）更合。

### D2 — Gateway 封装（arch-constraints §7）
supabase-js **must** 封装在 **M11 同步网关**（AuthGateway + SyncGateway 接口）；M9/UI/service **must not** 直接 import supabase SDK。理由：第三方 SDK 经 Gateway dispatch，便于 mock 测试（TBD-v20-6）+ 未来换后端不扩散。

### D3 — anon key + RLS 安全模型
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` 经 env 注入（anon key **公开**，进 FE bundle，正常）
- **真安全边界 = RLS**（ADR-016），非 anon key 保密；FE 只持 session token，不在 FE 信任任何鉴权判断
- secret（service_role key 等）**绝不**进 FE

### D4 — 部署拓扑
- GH Pages 仍托管**静态 FE**（ADR-004 不变）；Supabase 独立托管后端
- FE 经 env 连 Supabase；CI build 时 env 注入（GitHub Secrets → build env）
- **infra 在用户侧**：Supabase 项目/表/RLS 策略须用户 provision（共识张力 B）；本会话用 mock client 开发测试

## Consequences

- module-list +M11 同步网关（Gateway）
- 新依赖 `@supabase/supabase-js`（2.107.0，研 first 核实）
- env：`.env` 模板 + `VITE_SUPABASE_*`；CI 注入；env.d.ts 声明
- 测试：mock Supabase client（ADR-015/test-plan），不连真云
- 关联 ADR-014（auth）/ ADR-015（sync）/ ADR-016（安全 RLS）

## References

- 共识 v2.0 §0/§4 TBD-v20-6/7
- **`@supabase/supabase-js` 2.107.0**（npm 核实 2026-06-08）— research-first：Auth（magic link）+ RLS + from().select/upsert API 实现时查官方文档定稿
- architecture-constraints §7（Gateway/strategy）/ §4（数据隔离基于 identity）
- ADR-004（GH Pages 静态部署，FE 不变）
- 实现 commit：`<TBD>`
