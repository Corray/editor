# 云同步 provisioning 指南（v2.0 → 升 v1.0.0）

> v1.0.0-rc.1 的代码已就绪（mock 验证），但**真云全路径未验**（F-V20-1/2，AC-v20-6 安全发布门槛 PENDING）。
> 本指南把"升 v1.0.0 PENDING 清单"落成可执行步骤。**provisioning 在你侧**（需真 Supabase 账号）。
>
> 关联：ADR-013（Supabase）/ ADR-016（RLS 安全）/ data-model v2.0 / `supabase/schema.sql` / `.env.example`。

---

## 前提

- 一个 Supabase 账号（免费档够 MVP）
- 本仓库的 GitHub repo 管理权限（配 Secrets）

---

## 步骤

### 1. 建 Supabase 项目
supabase.com → New project → 记下 **Project URL** 和 **anon public key**（Settings → API）。

### 2. 跑建表 + RLS SQL
项目 → SQL Editor → 粘贴 [`supabase/schema.sql`](../../supabase/schema.sql) → Run。
建 `documents` 表 + 启用 RLS + 4 条 `auth.uid()=user_id` 策略（幂等，可重复跑）。

### 3. 配 Auth（Dashboard）
- Authentication → Providers → **Email** 启用（magic link 无需密码）
- Authentication → URL Configuration → **Site URL / Redirect URLs** 加 `https://corray.github.io/editor/`（magic link 回调落点）
  - ⚠️ **必须含 `/editor/` 子路径**：代码已自动带 `emailRedirectTo=<origin>/editor/`（review R2 / 2026-06-09），但 Supabase 只放行 allowlist 内的 redirect —— Redirect URLs 没加 `/editor/` 则该回调被拒、登录失败。
- Email 模板（Authentication → Email Templates → Magic Link）：保持**默认含 `{{ .ConfirmationURL }}`**（→ 发 magic link）；若改成含 `{{ .Token }}` 会变成发 OTP 码（review R4）。
- 开放注册：`signInWithOtp` 默认 `shouldCreateUser` 开放（任意 email 即发即注册），MVP 接受；要限制 → Authentication → Sign In / Up 关闭 email signup（review R5）。

> 真实现 review（auth flow / API 用法 / RLS 策略对照 supabase-js v2 官方文档）见 [`docs/audit/2026-06-09-supabase-impl-review.md`](../audit/2026-06-09-supabase-impl-review.md)。flow 决策 = implicit（跨浏览器 magic link 友好）。

### 4. 配置 env

**本地开发**（`.env`，已 gitignore）：
```bash
cp .env.example .env   # 填真 URL + anon key
pnpm dev               # 此时登录入口出现
```

**CI / 线上部署**（GitHub Secrets）：
repo → Settings → Secrets and variables → Actions → New repository secret，加两条：
| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | 你的 Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

deploy.yml 的 Build step 已接这两个 Secret（未设 → 空串 → env-less / 同步禁用；设了 → with-env build，supabase 成 lazy chunk）。**anon key 公开无妨**（RLS 才是边界 / ADR-016）。

### 5. 部署
push 到 master → CI with-env build + 部署。线上出现"登录"入口。

### 6. 验证清单（AC-v20-x / 安全发布门槛）

> 真浏览器 + 破 SW 缓存层（PP-003 #6b：unregister SW + caches.delete，否则看旧版）。

- [ ] **AC-v20-1/7**：不登录 → 纯本地+离线照常（无回归）
- [ ] **AC-v20-2**：登录（收 magic link 邮件 → 点链接）→ 本地文档同步到云（Supabase Table Editor 见行）
- [ ] **AC-v20-3**：另一浏览器/设备登录同账号 → 拉到云端文档
- [ ] **AC-v20-4**：两端改同一 doc → updatedAt 大者胜（LWW）
- [ ] **AC-v20-5**：首登 → 本地 + 云端文档**并集**，不丢任一侧
- [ ] **AC-v20-6 安全门槛**：注册两用户 A/B → **A 不能读/写 B 的文档**（RLS 隔离）+ **人工审 `supabase/schema.sql` 的 RLS 策略**
- [ ] **F-V20-3**：magic link 回调 × `#doc=` 分享链接共存（先打开分享链接再登录，互不破坏）
- [ ] console 干净（PP-003 #7）

### 7. 升 v1.0.0
上面全过 + security review 签字（尤其 AC-v20-6）→ findings F-V20-1/2 标 resolved → bump 1.0.0-rc.1 → 1.0.0 + tag v1.0.0 + GitHub release（正式，非 prerelease）。

---

## 排错

| 现象 | 排查 |
|------|------|
| 登录入口不出现 | env 没配/没生效（`syncEnv()` null）；本地查 `.env`，线上查 Secrets + 重新 build |
| 看到旧版（无登录入口但已配 env）| SW precache 旧版 → 破 SW 缓存层（PP-003 #6b）|
| 登录后同步无反应 | 浏览器 console 看 supabase 报错；核 RLS 策略已跑、Auth Email 已启用、Redirect URL 已加 |
| supabase-js API 与代码不符 | `supabase.ts` 按 v2.107.0 文档写，若版本/参数有出入按官方文档复核（research-first / F-V20-1）|
