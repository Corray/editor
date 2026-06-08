# ADR-014 — 认证：Email Magic Link（Supabase Auth）

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-08：magic link / session 持久 / AuthGateway）`[SECURITY REVIEW REQUIRED]` |
| **Date** | 2026-06-08 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v2.0 TBD-v20-1=(a) / ADR-013（Supabase）|

## Decision

### D1 — 登录方式 = Email Magic Link〔选定〕
Supabase Auth `signInWithOtp({ email })` → 邮件含登录链接 → 点击回站建 session。
- **Pros:** 无密码（无密码存储/重置/泄露面）；一人 MVP 最省；Supabase 内建
- **Cons:** 依赖邮件送达；链接是凭证（钓鱼/转发风险，Supabase 链接短时效 + 一次性缓解）

### D2 — Session 持久 + 状态
- Supabase client 默认持久 session 到 localStorage（key `sb-*`）；刷新/重开免重登
- AuthGateway 暴露 `signIn(email)` / `signOut()` / `currentUser()` / `onAuthChange(cb)`
- UI：header 加登录入口（未登录"登录"/已登录显 email + 登出）

### D3 — 回调处理
magic link 回到 `/editor/`（带 token hash）→ Supabase client `detectSessionInUrl` 自动解析建 session → 清 URL。注意与现有 `#doc=` 分享 hash **不冲突**（Supabase 用 `access_token=` 等不同参数；回调检测优先，处理后再走既有 hash 逻辑）。

## Security（`[SECURITY REVIEW REQUIRED]`）
- magic link token 经 Supabase 验，FE 不自验
- session token 存 localStorage（XSS 可窃 → 依赖既有 DOMPurify XSS 防线不破，ADR-002）
- 不在 FE 做任何"是否登录/是谁"的信任判断用于安全决策——真授权在 RLS（ADR-016）
- PII = email（Supabase 侧存储）；FE 仅显示当前用户 email

## Consequences

- M11 +AuthGateway（封装 supabase.auth.*）
- UI：登录表单（email 输入 + 发送链接）+ 登录态显示
- i18n：登录/登出/发送链接/检查邮箱 文案
- 回调 + `#doc=` 共存测试（回归既有分享）
- 测试：mock auth（signInWithOtp / onAuthStateChange）

## References

- 共识 v2.0 TBD-v20-1 / ADR-013（Supabase）/ ADR-016（RLS 才是授权边界）
- Supabase Auth `signInWithOtp` + `detectSessionInUrl`（research-first 实现时查官方）
- ADR-002（XSS 红线——session token 在 localStorage，XSS 防线不破是前提）
- 实现 commit：`<TBD>`
