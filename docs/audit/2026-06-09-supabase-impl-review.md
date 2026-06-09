# Supabase 真实现 review — provision 前降险（2026-06-09）

> **定位：** `src/modules/m11-sync/supabase.ts`（F-V20-1「写了从没运行时验过」）+ `supabase/schema.sql`（RLS）
> **对照 supabase-js v2 + RLS 官方一手文档**逐点核查（research-first MUST），目的：在用户 provision Supabase **之前**修掉文档可证的缺陷，降低 provision 后才暴露的返工。
> **触发：** v1.0.0 解锁准备（用户选 A）。
> **类型：** security-sensitive review（auth + RLS，security-review.md）。
> **运行时状态不变：** 本 review **不能**替代运行时验证——无真项目仍无法验 AC-v20-6 真隔离。review 只提升代码对文档的符合度。

---

## 方法 + 一手文档（访问日期 2026-06-09）

- signInWithOtp / magic link：https://supabase.com/docs/reference/javascript/auth-signinwithotp
- getUser vs getSession：https://supabase.com/docs/reference/javascript/auth-getuser
- implicit flow（默认 / hash fragment）：https://supabase.com/docs/guides/auth/sessions/implicit-flow
- PKCE flow（query `?code=`）：https://supabase.com/docs/guides/auth/sessions/pkce-flow
- RLS + upsert 所需策略：https://supabase.com/docs/guides/database/postgres/row-level-security

---

## 逐点核查

| # | 严重度 | 发现 | 官方依据 | 处置 |
|---|--------|------|----------|------|
| **R1** | 中-高 | `createClient(url, anonKey)` 未设 `flowType`，**supabase-js JS 默认 implicit** → magic link 回调走 URL hash `#access_token`，与本项目 `#doc=<lz>` 分享 hash 同命名空间 | v2 JS/Dart 默认 implicit；PKCE 走 `?code=` query | **决策：保持 implicit**（用户拍板 / 下文）。代码不改 |
| **R2** | 中-高 | `signInWithOtp({ email })` 未传 `emailRedirectTo` → magic link 回调落 Supabase Site URL 根，而非 GitHub Pages 子路径 `/editor/`（项目页部署） | `emailRedirectTo` 控制点链接后回到的 app URL | **已修 `7b840e7`**：带 `emailRedirectTo = new URL(import.meta.env.BASE_URL, location.origin)` |
| **R3** | 中 | 每次 `push` / `pushDelete` 调 `getUser()`（**发网络请求**验 token）→ 逐文档同步各一次往返 | getUser() 发网络请求（authentic，可作授权依据）；getSession() 读本地 | **已修 `7b840e7`**：改 `getSession()`（本地）。授权边界是服务端 RLS `WITH CHECK`，非 FE uid，故本地取 uid 足够 |
| **R4** | 低 | magic link vs OTP code 取决于 **email 模板**（含 `{{ .ConfirmationURL }}` → magic link；含 `{{ .Token }}` → OTP），非方法默认项 | 模板变量决定发什么 | provisioning 文档补：用默认 ConfirmationURL 模板 |
| **R5** | 低(info) | `signInWithOtp` 的 `shouldCreateUser` 文档未明示默认（普遍认知为 true = 开放注册）→ 任意 email 自动注册 | 未在 reference 明确 | provisioning 文档补：MVP 接受开放注册；要限制需在 Dashboard 关 signup |
| ✓ | 通过 | **upsert 的 RLS 策略齐全**：upsert = INSERT（无冲突）+ UPDATE（冲突），分别需 `WITH CHECK` 和 `USING + WITH CHECK`。schema.sql 两者都有 | upsert 需 INSERT + UPDATE 双策略 | 无需改 |
| ✓ | 通过 | RLS 4 策略 `auth.uid() = user_id` 标准写法；`enable row level security` 后默认拒绝、policy 显式放行「仅自己的行」；`insert ... with check` 防越权写他人 user_id | RLS 标准模式 | 无需改 |

---

## R1 决策记录（implicit vs PKCE / ADR-014 子决策）

**决策：保持 implicit（默认，不改代码）。** 用户拍板 2026-06-09。

| 维度 | implicit（选） | PKCE（未选） |
|------|---------------|--------------|
| 回调载体 | hash `#access_token` | query `?code=` |
| 与 `#doc=` 分享 hash | 同命名空间 | 彻底隔离 |
| 跨浏览器点 magic link | ✅ token 在 URL，邮箱 app 内置浏览器打开也能建 session | ❌ code verifier 绑原浏览器 localStorage，换 session 失败 |
| 安全 | token 在 URL（短时） | code 不可重放，更安全（供应商推荐） |

**理由：** 产品形态是「移动端速记 / 邮箱点链接」，跨浏览器打开 magic link 是常见路径，PKCE 在此场景会登录失败 —— 对可用性的伤害大于 hash 隔离的收益。

**hash 共存（F-V20-3）经文档核实后的真实风险评估：** implicit 回调 URL 形如 `…/editor/#access_token=…`（**无** `doc=`）；分享 URL 形如 `…/editor/#doc=…`（**无** `access_token`）。两者不会同时出现在一个 URL。`readSharedDocument()` 读到 `#access_token` 开头 → 不匹配 `doc=` → 返回 null（无害）；`detectSessionInUrl` 读到 `#doc=` → 无 token → 不建 session（无害）。**故实际冲突风险低**，但仍需 provision 后按 F-V20-3 清单线上验时序（detectSessionInUrl 清理 hash vs bootstrap 读 hash 的先后）。

**反例 / 何时该回到 PKCE：** 若未来引入 SSR、或安全要求升级（token 泄漏面收紧）、或放弃移动端邮箱内置浏览器场景 —— 那时切 PKCE 更对，加 `auth: { flowType: 'pkce' }` 一行即可。

---

## 仍 pending（本 review 不解除）

- **F-V20-1**：supabase.ts 真后端**未运行时验证**。本 review 修了 R2/R3 文档可证缺陷，但真 auth/同步行为仍须 provision 后线上验。状态不变。
- **F-V20-2 / AC-v20-6**：RLS 真隔离发布门槛。schema.sql 策略经 review 确认写法正确，但「A 不能读/写 B」必须真项目两用户实测 + 人工审。状态不变。**仍阻 v1.0.0。**

---

## 结论

provision 前能做的代码降险已做（R2 magic link 回调落点 + R3 同步网络往返）；R1 flow 选型拍定 implicit 并文档化取舍 + hash 共存澄清；R4/R5 转 provisioning 文档配置要点。**升 v1.0.0 仍只差用户 provision + 线上验 AC-v20-6**（唯一外部依赖）。
