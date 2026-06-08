# 测试计划 v2.0 — 账号 + 云同步（mock 后端 + 安全/RLS）

> 新章节。基线：共识 v2.0 AC-v20-1~7 + ADR-013~016。
> **测试后端 = mock**（TBD-v20-6a）：unit/e2e 用内存 fake supabase（含模拟 RLS）；真云隔离验证靠用户 provision 后线上 + SQL 策略人工审。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.0 | 2026-06-08 | sync LWW 矩阵 + 首登并集 + 软删传播 + auth + RLS 隔离 |

---

## 1. 家族维度（枚举）

`登录态(匿名/已登录) × 网络(在线/离线) × 同步(push/pull/首登并集) × 冲突(本地新/云新/同时/删除传播) × 安全(自己 doc/他人 doc)`

mock 后端使 sync/auth/LWW/merge 逻辑**可单测**；UI 登录流 + 集成走 e2e（mock client）。真 RLS 隔离 = 人工审 SQL 策略 + 真项目线上验（mock 仅模拟拒绝行为）。

## 2. AC ↔ 测试映射

| AC | 场景 | 层级 | 测试 |
|----|------|------|------|
| AC-v20-1 | 匿名行为不变（纯本地+离线）无回归 | e2e | 既有 ac10/ac12 在无 env/未登录下仍全过 |
| AC-v20-2 | 登录 → 本地 doc push 到云 | 单测(mock) | UT-SYNC-push |
| AC-v20-3 | 另一会话登录 → pullAll 拉到云 doc | 单测 | UT-SYNC-pull |
| AC-v20-4 | 同 doc 两端改 → LWW(updatedAt 大者胜) | 单测 | UT-SYNC-lww（本地新胜/云新胜）|
| AC-v20-5 | **首登并集不丢数据**（仅本地/仅云/同 id LWW）| 单测 | UT-SYNC-merge-union |
| AC-v20-6 | **RLS 隔离**：A 不能读/写 B（安全发布门槛）| mock 单测 + 真项目人工审 | UT-RLS-deny(mock 拒绝跨 user) + SQL 策略 review + 线上两用户验 |
| AC-v20-7 | 离线/未登录可用无回归 | e2e | env 缺失/离线 → 同步禁用，本地照常 |
| — | 软删传播：一端删 → 另一端 pull 后消失（不复活）| 单测 | UT-SYNC-delete-tombstone |
| — | magic link 发送 + 回调建 session（mock auth）| 单测 | UT-AUTH-signin / onAuthChange |
| — | env 缺失 → 同步降级（不报错，纯本地）| 单测 | UT-CLIENT-no-env |

## 3. 关键测试纪律

- **AC-v20-6（RLS）是安全发布门槛**：mock 后端模拟 RLS（按 user_id 拒绝跨用户读写）只验**调用方行为正确**；真隔离强制在 Supabase RLS → **SQL 策略人工审 + 真项目部署后构造两用户线上验**（security-review，比照 XSS 门槛但属认证/授权新类别）
- **首登并集是数据安全重点**（AC-v20-5）：UT 必造"仅本地/仅云/同 id 两版"三态，断言**无丢失**
- **匿名无回归**（AC-v20-1/7）：env 缺失或未登录时，既有本地多文档/离线 e2e 全过（同步层不侵入匿名路径）
- **不连真云测**（TBD-v20-6a）：所有 CI/本地测用 mock；真云验是 provision 后的人工步骤

## 4. 不测 / 边界

- 不测真 Supabase 服务端（信任 BaaS + RLS 人工审）
- 不测实时/CRDT/协作/E2EE（v2.1+）
- LWW 时钟偏差跨设备误序：已知 MVP 限制（ADR-015 D3），不做时钟同步
- mock RLS ≠ 真 RLS：mock 只验客户端契约，真隔离靠真项目（诚实声明）
