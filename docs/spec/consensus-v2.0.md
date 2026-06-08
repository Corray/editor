# 共识文档 v2.0 — 账号 + 云同步（local-first + Supabase）

> **新产品章节**（非 delta）。共识 v1.0 §跨系统集成明文："如未来引入云同步（v2+），需新建共识文档章节并走 ADR" → 本文档即该章节。
>
> **状态：** `accepted`（2026-06-08；TBD-v20-2~7 AI 倾向 + v20-1=(a) magic link 拍板，全盘 accept）
> **flow 位置：** 共识 draft → 业务模块清单 M11 + 架构**重评估** → **多份 ADR**（后端选型/auth/同步/安全RLS）→ api/data-model/test-plan → 实现（**security review 强制**）
> **命名：** semver tag 将是 **v1.0.0**（首个含后端的正式版；破纯 FE，major 跳号）。
> **风险标记：** L3 架构跳变 + 一人项目 + 烂尾风险高（已知情，scope 收紧 MVP 对冲）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.0-draft | 2026-06-08 | 账号登录 + 文档云同步（local-first + Supabase + LWW）；7 TBD |

---

## 0. 定位（与既有架构的关系，最关键）

editor 至今是**纯 FE local-first**（v1.6 本地多文档 IndexedDB + v1.5 离线 PWA）。v2.0 **不推翻**它，而是**叠加云同步层**：

- **匿名用户**：行为完全不变（纯本地 IndexedDB，离线可用）—— 登录是**可选增益**，不是前置
- **登录用户**：本地仍是主（local-first，离线照常）+ 后台同步到云端 + 多设备拉取
- 即：**local-first + 云作镜像/备份/跨设备通道**，不是 cloud-first（不破坏离线核心价值）

## 1. 范围（紧 MVP）

**做（仅）：**
- ① **账号**：Supabase Auth 登录/登出（方式见 TBD-v20-1）
- ② **云存**：登录后本地 documents 同步到 Supabase（per-user 隔离，RLS）
- ③ **多设备拉取**：另一设备登录 → 拉到云端文档
- ④ **LWW 冲突**：同文档多端改 → updatedAt 大者胜（简单，TBD-v20-3）

**明确不在本次（推 v2.1+）：** 实时同步（Supabase Realtime）/ 离线编辑回来后的智能合并（CRDT/字段级 merge）/ 协作多人编辑 / 分享给他人账号 / 富权限。

## 2. 激活的休眠 rule（纯 FE 期一直没真正适用）

| Rule | 本版如何适用 |
|------|------|
| architecture-constraints §7（第三方走 Gateway）| supabase-js 调用 **must** 封装在 Gateway 层（M11），不在 service/UI 直接 call SDK（strategy/Gateway pattern）|
| security-review（强制人工审）| auth / PII（email）/ RLS 策略 / 网络调用——**安全核心**，实现后 `[SECURITY REVIEW REQUIRED]` + 人工审才能 tag |
| research-first（一手文档）| Supabase Auth + RLS + JS client API **must** 查官方文档核实（参数/行为/安全语义），不靠印象 |
| architecture-constraints §4（API 设计）| 云端表/RLS 是数据隔离边界，**must** 基于 identity（user_id），不基于业务字段 |

## 3. 张力

### 张力 A — 双源真相（local IndexedDB ↔ cloud）
登录后两处都有文档 → 同步方向 + 冲突。LWW（updatedAt）是 MVP 解，但跨端时钟偏差、首次登录的本地↔云合并是难点。见 **TBD-v20-3/4**。

### 张力 B — 基础设施在用户侧（infra 阻塞）
真 Supabase 项目/密钥/RLS 策略须**用户 provision**。FE 代码 + 架构 + mock 测试本会话可做，**真云连接卡在 infra**。见 **TBD-v20-6**。

### 张力 C — 部署模型变（GH Pages 静态）
GH Pages 仍托管静态 FE；Supabase 是独立托管后端。FE 经 env（`VITE_SUPABASE_URL`/`ANON_KEY`）连。ADR-004 部署仍有效（FE 不变），新增 Supabase 侧配置。anon key 是**公开**的（RLS 才是真安全边界）——见 **TBD-v20-5 安全**。

---

## 4. 待确认项（TBD-v20-x；HOW 在各 ADR）

### TBD-v20-1 — 登录方式〔需拍板：产品 + 安全〕
- (a) Email + magic link（无密码，Supabase 内建）— 无密码管理负担，弱依赖邮件
- (b) Email + 密码 — 经典，需密码策略 + 重置流程
- (c) OAuth（GitHub/Google）— 一键，但需注册 OAuth app（额外 infra）
- 〔AI 倾向 (a) magic link：一人 MVP 最省，无密码安全面〕

### TBD-v20-2 — 同步触发〔需拍板〕
- (a) 自动（登录后 + 编辑 debounce 后台 push + 启动/聚焦时 pull）〔AI 倾向〕
- (b) 手动（"同步"按钮）— 简单可控但体验差

### TBD-v20-3 — 冲突策略（已选 LWW，细化粒度）
- (a) **per-doc LWW**（updatedAt 大者整篇胜）〔AI 倾向，MVP〕— 简单；代价：晚改端覆盖早改端的整篇
- (b) per-field / CRDT → 推 v2.1+（共识范围外）

### TBD-v20-4 — 首次登录的本地↔云合并〔需拍板：数据安全重点〕
- (a) **并集**：本地未同步 doc 上传 + 云端 doc 下拉，按 id 去重，同 id 走 LWW〔AI 倾向，不丢数据〕
- (b) 云覆盖本地 / 本地覆盖云 → 有丢数据风险，拒绝

### TBD-v20-5 — 安全 / RLS〔`[SECURITY REVIEW REQUIRED]` / 发布门槛〕
- (a) **Supabase RLS：documents 表 `user_id = auth.uid()` 行级隔离**，anon key 公开但 RLS 拦跨用户访问；不在 FE 信任任何鉴权（FE 只持 session token）〔AI 倾向 / 安全红线〕
- 文档内容存云端 = 明文（除非端到端加密，MVP 不做 E2EE，需隐私提示）

### TBD-v20-6 — dev/test（绕 infra 阻塞）〔需拍板〕
- (a) **Mock Supabase client（MSW / 内存 fake）跑 unit/e2e**，真连接靠用户 env〔AI 倾向〕— 不阻塞开发
- (b) Supabase CLI 本地 stack — 更真但需 Docker + 本会话难持久

### TBD-v20-7 — 模块 / Gateway
- (a) **新增 M11 同步网关**：封装 supabase-js（auth + documents CRUD + sync），暴露 SyncGateway/AuthGateway 接口（arch-constraints §7）；M9 不直接碰 supabase〔AI 倾向〕

---

## 5. 下游影响（评审通过后产出）

| 节点 | 产物 |
|------|------|
| module-list | **M11 同步网关 + 账号**（Gateway 封装 supabase-js）；M9 加 syncedAt / 远端协同字段 |
| 架构**重评估** | 引后端的分层（FE↔Gateway↔Supabase）；部署拓扑（GH Pages FE + Supabase）；env/secret 处理 |
| **多 ADR** | ADR-013 后端选型(Supabase) / ADR-014 Auth(TBD-1) / ADR-015 同步+LWW+首登合并 / ADR-016 安全RLS（security 核心）|
| data-model | Supabase `documents` 表 schema + RLS 策略 + 本地 DocRecord 加同步元（syncedAt/remoteUpdatedAt）|
| api/test-plan | SyncGateway/AuthGateway 契约 + mock 后端测试 + 安全/RLS 测试矩阵 |

## 6. 验收条件（v2.0 新增 AC，待 test-plan 细化）

- AC-v20-1：匿名用户行为不变（纯本地，离线可用）—— 登录可选不破坏现有
- AC-v20-2：登录 → 本地文档同步到云（per-user）
- AC-v20-3：另一设备/会话登录同账号 → 拉到云端文档
- AC-v20-4：同文档两端改 → LWW（updatedAt 大者胜）
- AC-v20-5：首次登录 → 本地 + 云端文档**并集**，不丢任一侧（数据安全重点）
- AC-v20-6：**RLS 隔离**：用户 A 无法读/写用户 B 的文档（安全发布门槛 / SECURITY REVIEW）
- AC-v20-7：离线/未登录可用性无回归（PWA + 本地多文档照常）

> AC-v20-6 是安全发布门槛（RLS）。比照前面 XSS 门槛严格度，但这是**新类别**（认证/授权/数据隔离），security-review rule 全程适用。
