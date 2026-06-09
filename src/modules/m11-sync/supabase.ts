/**
 * 真 Supabase 后端（ADR-013/014/015/016）—— **唯一**碰 supabase-js 处。
 *
 * ⚠️ **未运行时验证**：本会话无真 Supabase 项目（infra 待用户 provision）。代码按
 *    supabase-js v2 文档 API 写，mock 测的是 Gateway 契约；真隔离/真同步靠用户 provision
 *    后线上验（AC-v20-6 安全发布门槛，security-review）。
 *
 * supabase-js **懒加载**（动态 import）：匿名/未配 env 用户首屏不含（AC-v20-1/7）。
 */
import type {
  AuthGateway,
  AuthUser,
  RemoteDoc,
  SyncBackend,
  SyncGateway,
} from './api';

const TABLE = 'documents';

type Row = {
  id: string;
  user_id: string;
  title: string;
  text: string;
  created_at: number;
  updated_at: number;
  deleted: boolean;
};

const rowToRemote = (r: Row): RemoteDoc => ({
  id: r.id,
  title: r.title,
  text: r.text,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deleted: r.deleted,
});

/** 懒加载 supabase-js + 建 backend。url/anonKey 由调用方从 env 取。 */
export async function createSupabaseBackend(
  url: string,
  anonKey: string,
): Promise<SyncBackend> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(url, anonKey); // 默认持久 session + detectSessionInUrl（magic link 回调）

  // [SECURITY REVIEW REQUIRED] R2（review 2026-06-09 / 对照 supabase-js v2 文档）：
  // magic link 回调必须显式指定落点，否则落 Supabase Site URL 根而非本应用子路径。
  // GitHub Pages 项目页部署在 /editor/（import.meta.env.BASE_URL），回调须带上。
  const emailRedirectTo =
    typeof globalThis !== 'undefined' && globalThis.location
      ? new URL(import.meta.env.BASE_URL, globalThis.location.origin).href
      : undefined;

  const toUser = (u: { id: string; email?: string } | null | undefined): AuthUser | null =>
    u ? { id: u.id, email: u.email ?? '' } : null;

  const auth: AuthGateway = {
    currentUser: () => null, // 同步快照不可靠（session 异步）；onAuthChange 才是真相源
    signIn: async (email) => {
      const { error } = await sb.auth.signInWithOtp({
        email,
        ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    signOut: async () => {
      await sb.auth.signOut();
    },
    onAuthChange: (cb) => {
      // 初始 session（INITIAL_SESSION）+ 后续变化
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        cb(toUser(session?.user));
      });
      return () => data.subscription.unsubscribe();
    },
  };

  // RLS 自动按 auth.uid() 隔离（ADR-016）；FE 不传 user_id 过滤，靠 RLS（仍显式带 user_id 写以过 WITH CHECK）
  //
  // [SECURITY REVIEW REQUIRED] R3（review 2026-06-09）：用 getSession()（本地读）而非
  // getUser()（每次发网络请求验 token）。授权边界是服务端 RLS WITH CHECK（auth.uid()=user_id），
  // 不是 FE 传的 uid —— 即使 FE 填错 uid，RLS 也会拒绝。故拿 uid 只为填列，本地 session 足够，
  // 避免逐文档同步各一次网络往返。
  async function currentUserId(): Promise<string | null> {
    const { data } = await sb.auth.getSession();
    return data.session?.user?.id ?? null;
  }

  const sync: SyncGateway = {
    push: async (doc) => {
      const uid = await currentUserId();
      if (!uid) throw new Error('not authenticated');
      const row: Row = {
        id: doc.id,
        user_id: uid,
        title: doc.title,
        text: doc.text,
        created_at: doc.createdAt,
        updated_at: doc.updatedAt,
        deleted: doc.deleted,
      };
      const { error } = await sb.from(TABLE).upsert(row);
      if (error) throw error;
    },
    pullAll: async () => {
      const { data, error } = await sb.from(TABLE).select('*'); // RLS 只返回自己的行
      if (error) throw error;
      return (data as Row[]).map(rowToRemote);
    },
    pushDelete: async (id, updatedAt) => {
      const uid = await currentUserId();
      if (!uid) throw new Error('not authenticated');
      // 软删 tombstone（不物理删 / ADR-015 D4）
      const { error } = await sb
        .from(TABLE)
        .update({ deleted: true, updated_at: updatedAt })
        .eq('id', id);
      if (error) throw error;
    },
  };

  return { auth, sync };
}
