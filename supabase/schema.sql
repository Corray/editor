-- editor v2.0 云同步 — Supabase schema + RLS（ADR-016 / data-model v2.0 §1）
--
-- 用法：Supabase 项目 → SQL Editor → 粘贴本文件 → Run。幂等（可重复跑）。
-- 安全核心：RLS 行级隔离 user_id = auth.uid()，是【唯一】授权边界（FE 不做授权）。
--
-- ⚠️ 跑完务必验隔离（AC-v20-6 安全发布门槛）：见文件末尾"验证"。

-- ── 表 ──────────────────────────────────────────────
create table if not exists public.documents (
  id          text  primary key,                       -- 复用本地 doc id（D_<uuid>）
  user_id     uuid  not null references auth.users(id) on delete cascade,
  title       text  not null default '',
  text        text  not null default '',
  created_at  bigint not null,                          -- epoch ms（与本地一致）
  updated_at  bigint not null,                          -- LWW 比较键
  deleted     boolean not null default false            -- 软删 tombstone（防多设备复活 / ADR-015 D4）
);

-- 常用查询：按 user_id 拉全量（RLS 已隔离，无需额外 where）；updated_at 辅助
create index if not exists documents_user_idx on public.documents (user_id);

-- ── RLS（行级安全 / ADR-016 D1）──────────────────────
-- 启用后默认【拒绝一切】，必须由下方 policy 显式放行"仅自己的行"。
alter table public.documents enable row level security;

-- 幂等：先删同名 policy 再建（可重复跑本脚本）
drop policy if exists "own select" on public.documents;
drop policy if exists "own insert" on public.documents;
drop policy if exists "own update" on public.documents;
drop policy if exists "own delete" on public.documents;

create policy "own select" on public.documents
  for select using (auth.uid() = user_id);
create policy "own insert" on public.documents
  for insert with check (auth.uid() = user_id);              -- 防越权写他人 user_id
create policy "own update" on public.documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on public.documents
  for delete using (auth.uid() = user_id);

-- ── Auth 配置（在 Dashboard，非 SQL）──────────────────
--  Authentication → Providers → Email：启用 "Email"；
--    magic link 模式无需密码（signInWithOtp）。
--  Authentication → URL Configuration → Site URL / Redirect URLs：
--    加 https://corray.github.io/editor/（magic link 回调落点）。

-- ── 验证隔离（AC-v20-6 / 务必跑）──────────────────────
--  1. 注册两个用户 A / B（各自 magic link 登录一次）。
--  2. 用 A 的 session 调 select/insert → 只见/只能写 A 自己的行。
--  3. 尝试用 A 读/写 B 的 id → 应被 RLS 拒绝（0 行 / 报错）。
--  （可在 SQL Editor 用 `set request.jwt.claims` 模拟，或前端两账号实测。）
--  通过 + 人工审本 policy → 才可升 v1.0.0。
