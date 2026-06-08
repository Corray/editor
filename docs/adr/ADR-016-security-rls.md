# ADR-016 — 安全：RLS 行级隔离（v2.0 安全核心 / 发布门槛）

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-08：RLS user_id 隔离 / anon-key 公开 / FE 不信任 / 明文+隐私提示）`[SECURITY REVIEW REQUIRED]` |
| **Date** | 2026-06-08 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v2.0 TBD-v20-5（AC-v20-6 发布门槛）/ ADR-013（anon key 公开）/ security-review rule |

## Decision

### D1 — RLS 是唯一授权边界
Supabase `documents` 表 **启用 RLS**，策略：
```sql
alter table documents enable row level security;
create policy "own rows select" on documents for select using (auth.uid() = user_id);
create policy "own rows insert" on documents for insert with check (auth.uid() = user_id);
create policy "own rows update" on documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows delete" on documents for delete using (auth.uid() = user_id);
```
- `user_id` 数据隔离基于 **identity**（auth.uid()），非业务字段（arch-constraints §4）
- **FE 不做任何安全决策**：FE 持 session token，所有读写经 RLS 在 Supabase 侧强制；FE 端的"登录态/是谁"仅用于 UX，不用于授权

### D2 — anon key 公开（非密钥保护）
`VITE_SUPABASE_ANON_KEY` 进 FE bundle = **公开**，正常。安全靠 RLS 不靠 key 保密。`service_role` key（绕 RLS）**绝不**进 FE/仓库。

### D3 — 威胁模型（MVP）
| 威胁 | 缓解 |
|------|------|
| 用户 A 读/写 B 文档 | RLS `auth.uid()=user_id`（AC-v20-6 发布门槛，须真验或 mock-RLS 验 + 人工审策略）|
| SQL 注入 | supabase-js 参数化，不拼 SQL |
| XSS 窃 session token（localStorage）| 既有 DOMPurify 红线不破（ADR-002）；云端 doc 内容仍过 sanitize 渲染 |
| 中间人 | Supabase HTTPS |
| 越权写他人 user_id | insert/update WITH CHECK 拦 |

### D4 — 隐私（明文 + 提示）
MVP **不做 E2EE**：文档内容明文存 Supabase（运维方可见）。登录/首次同步**须隐私提示**（"内容将明文存云端"）。E2EE 推 v2.1+。

## 发布门槛（security-review）
tag v1.0.0 前**必须**：① RLS 策略人工审 ② 跨用户隔离验证（AC-v20-6：构造两用户，A 不能读/写 B；真 Supabase 或 mock-RLS 模拟 + 真项目部署后线上验）③ anon-key 公开 / service_role 不泄漏 核查 ④ session token XSS 面复核（既有 XSS e2e 不退化）。

## Consequences

- data-model v2.0：documents 表 + 上述 RLS SQL（用户 provision 时执行）
- 隐私提示 i18n + UI（首次同步）
- test-plan：RLS 隔离测试（mock 后端模拟 RLS 拒绝 + 真项目 SQL 策略审）
- security-review 贯穿 v2.0，tag 前门槛

## References

- 共识 v2.0 TBD-v20-5 / arch-constraints §4（identity 隔离）/ security-review rule
- Supabase RLS 官方文档（research-first 实现/审策略时查，核实 auth.uid() 语义 + policy 默认拒绝）
- ADR-002（XSS 红线，session 安全前提）/ ADR-013（anon key 公开模型）
- 实现 commit：`935d3ae`（mock 实现 + 真后端代码；真云连接/真隔离待用户 provision 后验，AC-v20-6 安全门槛 pending）
