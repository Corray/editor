# 共识文档 v1.5 — Service Worker 离线（PWA）

> v1.0 共识增量 delta（PRD §7 v1.1 候选「Service Worker 离线」补完）。仅描述本次行为变化。
>
> **状态：** `accepted`（2026-06-05 Corray 经方向问答拍板 TBD-v15-1~4）
> **flow 位置：** 共识 ✓ accepted → **module-list M8 delta（新增 PWA/离线基础设施模块）** → 架构 + ADR-009 → api+test-plan delta → 实现
> **命名：** semver tag 将是 **v0.6.0**（同先例：路线图功能版 semver 不跳号）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.5 | 2026-06-05 | Service Worker precache 离线 + Web App Manifest 可安装；4 TBD 已 accept |

---

## 1. 动机与范围

editor 当前纯在线 SPA（GH Pages `/editor/` 子路径）。文档本就存 IndexedDB（v1.1），但**断网时打不开应用本身**（HTML/JS/CSS 需联网）。PRD §7 v1.1 候选含「Service Worker 离线」。

**范围（仅）：**
- ① **离线可用**：Service Worker precache 静态资源 → 断网仍能打开 + 编辑（文档来自 IndexedDB）
- ② **可安装**：Web App Manifest → 安装到桌面/主屏，独立窗口运行
- ③ **更新提示**：SW 有新版时提示用户刷新

**不在本次：** 多文档、滚动同步、云同步（各按 roadmap 推迟）；后台同步 / push 通知（v2+ 账号体系才有意义）。

---

## 2. 张力

### 张力 A — hashed 资源清单同步
Vite 产物文件名带 hash（`index-[hash].js` / `mermaid-[hash].js`），每次构建变名。precache 清单必须随构建自动同步，否则离线缓存陈旧/破。见 **TBD-v15-1**（已选 vite-plugin-pwa 自动生成）。

### 张力 B — 离线缓存体积 vs 离线功能完整度
懒加载 chunk（mermaid 135KB / katex）要不要 precache？纳入 → 离线也能用公式/图，但首次缓存体积大。见 **TBD-v15-2**。

### 张力 C — SW 更新打断编辑
SW 更新若静默 skipWaiting 立即换版，可能在用户编辑中途刷新打断。见 **TBD-v15-3**。

### 张力 D — GH Pages 子路径 + CSP
SW scope 须对齐 `/editor/`；manifest/SW/图标均 same-origin；CSP `default-src 'self'` 需容纳 manifest（`manifest-src`）。SW 脚本与 Workbox runtime 均自托管（'self'），不破 `script-src 'self'`。见 **TBD-v15-4**。

---

## 3. 待确认项（TBD-v15-x；已 accept；HOW 在 ADR-009）

### TBD-v15-1 — SW 实现方式 ✅ accept (a)
- **(a) vite-plugin-pwa（Workbox generateSW）**〔选定〕— 自动从 Vite 产物生成 precache manifest（含 hashed 资源 + 懒加载 chunk）+ 内建更新生命周期；Workbox runtime 打包进 SW 自托管（CSP 安全）；构建期 devDep，不进首屏 runtime（不碰 150KB 预算）
- (b) 手写 SW → 须额外写构建脚本生成 hashed 资源清单 + 手写更新/缓存清理 → 劣质重造 Workbox + 维护陷阱 → **拒绝**

> 改判说明：与 toast「手写胜引库」相反——toast 是简单 DOM 无构建产物同步问题；PWA precache 的核心难点正是 hashed 多 chunk 清单自动同步，该交构建工具。反例：若离线 scope 极简（单 HTML 无 chunk）则手写更优——但本项目是多 chunk + 懒加载，不适用。

### TBD-v15-2 — 离线缓存范围 ✅ accept (a)
- **(a) precache 首屏 + 懒加载 chunk（mermaid/katex）+ katex 字体**〔选定〕— 离线也能用公式/图；首次缓存体积大（~几百 KB，一次性，非首屏 runtime）
- (b) 仅首屏核心 → 缓存小但离线无公式/图

### TBD-v15-3 — 更新策略 ✅ accept (a)
- **(a) `registerType:'prompt'` + toast 提示「有新版，点刷新」**〔选定〕— 用户控刷新时机，不打断编辑
- (b) autoUpdate 静默 skipWaiting → 可能编辑中途换版 → **拒绝**

### TBD-v15-4 — scope + CSP ✅ accept (a)
- **(a) SW scope = `/editor/`（继承 vite base）；manifest `start_url:'/editor/'` + `scope:'/editor/'`；CSP 加 `manifest-src 'self'`；图标自托管 PNG（192/512 + maskable）**〔选定〕
- (b) 放宽 CSP / 用 CDN workbox → **拒绝**（破自托管红线 + 供应链面）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | **M8 PWA/离线**（新增基础设施模块：SW 注册 + 更新提示）| §M8 |
| 架构 + **ADR-009** | vite-plugin-pwa 1.3.0 选型 + generateSW 配置（globPatterns 含 chunk）+ registerType:prompt 更新编排 + manifest/scope/CSP | L2 |
| api-spec delta | SW 注册契约（`virtual:pwa-register` onNeedRefresh → toast）+ manifest 字段 | 契约 |
| test-plan delta | 家族：`网络(在线/离线) × 资源(首屏/懒加载 chunk) × SW 态(首次装/已缓存/有更新)`；离线打开 + 离线编辑持久化 + 更新提示 | 覆盖 |

---

## 5. 验收条件（v1.5 新增 AC，待 test-plan 细化）

- AC-v15-1：在线访问一次后 → **断网刷新 → 应用仍能打开 + 编辑**（precache 生效）
- AC-v15-2：离线编辑 → 文档存 IndexedDB → 重开仍在（持久化离线不退化）
- AC-v15-3：离线状态打开含公式/图文档 → mermaid/katex chunk 已 precache → **离线也能渲染**（TBD-v15-2 (a)）
- AC-v15-4：部署新版 → SW 检测到更新 → **toast 提示「有新版，点刷新」**，点击后刷新到新版（TBD-v15-3 (a)）
- AC-v15-5：应用可安装（manifest 有效，浏览器显示安装入口）
- AC-v15-6：CSP 不报错（manifest-src/SW 自托管均合规；眼验 console 干净——PP-003 #7）

> 无安全发布门槛（SW 自托管 + 不放宽 CSP）；AC-v15-6 的「console 干净」按 PP-003 #7 列为眼验固定项。
