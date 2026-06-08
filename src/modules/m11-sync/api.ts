/**
 * M11 同步网关 + 账号（v2.0 / ADR-013~016）。
 *
 * **唯一**封装 supabase-js 的模块（Gateway / arch-constraints §7）；M9/UI 不直接碰 SDK。
 * supabase-js 懒加载（匿名用户首屏不含 / AC-v20-1/7）。真云连接靠 env，缺失则禁用（纯本地降级）。
 * 测试用 mock 实现（不连真云 / TBD-v20-6a）。
 */

export interface AuthUser {
  id: string;
  email: string;
}

/** 远端文档（云端 documents 行的形态 / data-model v2.0）。 */
export interface RemoteDoc {
  id: string; // D_<uuid>（复用本地 id）
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

/** 认证网关（ADR-014 magic link）。 */
export interface AuthGateway {
  currentUser(): AuthUser | null;
  /** 发 magic link 到 email（不立即登录，待用户点链接）。 */
  signIn(email: string): Promise<{ ok: boolean; error?: string }>;
  signOut(): Promise<void>;
  /** 登录态变化订阅；返回取消订阅。 */
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
}

/** 同步网关（ADR-015 / 仅在登录态使用）。 */
export interface SyncGateway {
  /** upsert 单 doc 到云（push）。 */
  push(doc: RemoteDoc): Promise<void>;
  /** 拉云端全部 doc（pull）。 */
  pullAll(): Promise<RemoteDoc[]>;
  /** 软删（deleted=true + bump updatedAt）。 */
  pushDelete(id: string, updatedAt: number): Promise<void>;
}

export interface SyncBackend {
  auth: AuthGateway;
  sync: SyncGateway;
}
