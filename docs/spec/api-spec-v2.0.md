# 接口设计 v2.0 — M11 同步网关（AuthGateway + SyncGateway）

> 新章节。M11 封装 supabase-js（Gateway / arch §7）。基线：共识 v2.0 + ADR-013~016 + data-model v2.0。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.0 | 2026-06-08 | AuthGateway + SyncGateway 契约 + M9 集成点 + UI 登录态 |

---

## 1. AuthGateway（ADR-014）

```ts
// modules/m11-sync/auth.ts
export interface AuthUser { id: string; email: string; }
export interface AuthGateway {
  currentUser(): AuthUser | null;
  /** 发 magic link 到 email（不立即登录，待用户点链接）。 */
  signIn(email: string): Promise<{ ok: boolean; error?: string }>;
  signOut(): Promise<void>;
  /** 登录态变化订阅（登录/登出 → 触发 sync pull / 清理）。 */
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
}
```

## 2. SyncGateway（ADR-015）

```ts
// modules/m11-sync/sync.ts
export interface RemoteDoc {
  id: string; title: string; text: string;
  createdAt: number; updatedAt: number; deleted: boolean;
}
export interface SyncGateway {
  /** upsert 单 doc 到云（push；登录+在线时 M3 debounce 后调）。 */
  push(doc: RemoteDoc): Promise<void>;
  /** 拉云端全部 doc（pull；登录后/启动/focus）。 */
  pullAll(): Promise<RemoteDoc[]>;
  /** 软删（deleted=true + bump updatedAt）。 */
  pushDelete(id: string, updatedAt: number): Promise<void>;
}
```

## 3. M9 集成（local-first 编排 / ADR-015）

- **push 触发**：M9 saveActiveText 成功 + 登录+在线 → `sync.push(toRemote(doc))`（fire-and-forget，失败 guardStore surface）
- **pull + 首登并集**：onAuthChange(登录) → `pullAll()` → 按 id LWW 合并入 M9 records（本地未同步的反向 push）→ refresh
- **删除**：登录态 remove → 软删（本地 deleted=true + `pushDelete`）；匿名 → 仍硬删（无云）
- **LWW**：`local.updatedAt` vs `remote.updatedAt` 大者胜（含 deleted）
- M9 `docs()` 过滤 `deleted`（不显示软删）

## 4. UI（登录态）

- header 登录入口：未登录"登录"→ email 输入 + 发送 magic link + "检查邮箱"提示；已登录显 email + 登出
- 首次同步隐私提示（"内容将明文存云端"，ADR-016 D4）

## 5. client + mock（ADR-013 D3 / TBD-v20-6）

- `client.ts`：`createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)`；env 缺失 → 同步功能禁用（纯本地降级，不报错）
- `mock.ts`：测试用内存 fake（实现 Auth/Sync Gateway 接口 + 模拟 RLS 拒绝跨用户），unit/e2e 不连真云

## 6. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| client.ts（supabase client + env 降级）| ⏳ | — |
| AuthGateway（magic link / session / onAuthChange）| ⏳ | — |
| SyncGateway（push/pullAll/pushDelete）| ⏳ | — |
| M9 集成（push 触发 / pull+首登并集 / 软删 / LWW）| ⏳ | — |
| UI 登录态 + 隐私提示 + i18n | ⏳ | — |
| mock client（测试 + 模拟 RLS）| ⏳ | — |
