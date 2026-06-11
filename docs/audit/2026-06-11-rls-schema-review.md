# RLS schema 静态人工审（AC-v20-6 门槛的"人工审策略"部分）

**日期：** 2026-06-11
**范围：** `supabase/schema.sql`（全文 53 行）× `src/modules/m11-sync/supabase.ts`（client 侧交叉核对）
**定位：** AC-v20-6 安全发布门槛 = ①两用户线上验 RLS 隔离（**仍 pending provision**）+ ②人工审 RLS 策略（**本报告**）。本报告只完成 ②，不解除 F-V20-2。
**方法：** 逐条策略读文本 + client 调用点交叉核对。静态审查，无运行时证据。

---

## 1. 逐项核查（通过项）

| # | 检查点 | 结论 | 依据 |
|---|--------|------|------|
| 1 | RLS 已启用，默认拒绝一切 | ✅ | schema.sql:24 `enable row level security`；无 policy 放行即全拒 |
| 2 | SELECT 隔离 | ✅ | schema.sql:32-33 `using (auth.uid() = user_id)` |
| 3 | INSERT 防越权写他人 user_id | ✅ | schema.sql:34-35 `with check (auth.uid() = user_id)` |
| 4 | UPDATE 双闸（读侧 USING + 写侧 WITH CHECK） | ✅ | schema.sql:36-37；WITH CHECK 防把自己的行改派给他人 |
| 5 | DELETE 隔离（纵深防御，client 实际不物理删） | ✅ | schema.sql:38-39；client 软删走 UPDATE（supabase.ts:111-120） |
| 6 | 匿名（未登录）访问 | ✅ 全拒 | `auth.uid()` 对 anon 为 null → 所有 policy 求值 false [推断，标准 RLS 语义] |
| 7 | 授权边界不在 FE | ✅ | supabase.ts:79-88：FE 填 user_id 仅为过 WITH CHECK，授权完全靠服务端 RLS（review R3 已定性） |
| 8 | client Row 形状 ↔ schema 列 一致 | ✅ | 7 列逐一对得上（id/user_id/title/text/created_at/updated_at/deleted） |
| 9 | 账号删除连带清数据 | ✅ | schema.sql:11 `references auth.users(id) on delete cascade` |
| 10 | 脚本幂等（可重复跑） | ✅ | `if not exists` + `drop policy if exists` 先删再建 |
| 11 | pushDelete 不带 user 过滤 | ✅ 可接受 | supabase.ts:118 `.eq('id', id)`，RLS USING 限定可见行；他人 id → 0 行静默 no-op，无越权面 |

## 2. 发现（均 info 级，不阻发布）

### F-V20-8 — 全局 PK 跨用户存在性探测（info）

`id` 是全表唯一 PK 且由 client 生成（`D_<uuid>`，schema.sql:10）。恶意已登录用户 B 若**已知** A 的某 doc id，upsert 同 id 时 insert 撞 PK → ON CONFLICT 的 update 路径被 RLS 拦（A 的行对 B 不可见）→ B 写不进，但**能从报错与否推断该 id 是否存在**（存在性 oracle）；理论上也可抢注 id。
**定性：** uuid v4 不可枚举、id 不出现在公开渠道（分享链接编码的是内容不是 id [已验证: data-model v1.2 `#doc=1.<lz>`]），实际不可利用 → info，MVP 接受。**消除方案**（若将来要）：复合 PK `(user_id, id)`。

### F-V20-9 — 无 payload 尺寸约束（info）

`title`/`text` 无长度上限（schema.sql:12-13），已登录用户可写超大行，free 档存储滥用面。单用户自害 + RLS 隔离不扩散 → info，MVP 接受。将来可加 `check (length(text) < N)` 或依赖 Supabase 配额。

## 3. 反例段 / 盲点（按全局规则 4）

- **静态审 ≠ 运行时证据**：本报告无法证明真项目里 policy 实际生效（schema.sql 是否被跑过、Supabase 默认 grant 行为是否如预期均为 [推断]）。这正是 AC-v20-6 ①两用户线上实测不可省的原因——**F-V20-2 状态不变**。
- ON CONFLICT × RLS 的具体报错形态（error vs 0 行）未实测，§2 F-V20-8 的 oracle 细节是 [推断]；线上验证时顺手覆盖。

## 4. 结论

RLS 策略文本通过人工审：四操作全覆盖、INSERT/UPDATE 双 WITH CHECK 齐全（与 2026-06-09 impl review 结论一致）、匿名全拒、无策略缺口。AC-v20-6 剩余部分 = 真项目两用户线上验，待 provision。
