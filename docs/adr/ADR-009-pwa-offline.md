# ADR-009 — Service Worker 离线（PWA）：vite-plugin-pwa + prompt 更新

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-05：D1=A vite-plugin-pwa / D2=含懒加载 chunk / D3=prompt 更新 / D4=scope+CSP）|
| **Date** | 2026-06-05 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.5（accepted）/ module-list M8 delta / ADR-004（GH Pages `/editor/` 子路径）/ 现有 CSP（index.html）|
| **Supersedes** | — |

## Context

共识 v1.5 决定加 PWA 离线 + 可安装。约束：GH Pages `/editor/` 子路径；现有 CSP `default-src 'self'; script-src 'self'`；150KB 首屏闸（PWA 不得进首屏 runtime）；自托管红线（不引 CDN）。

本 ADR 定 how：① SW 实现方式 ② 缓存范围 ③ 更新策略 ④ scope + CSP + 图标。

---

## D1 — SW 实现方式（核心 fork）

### A. vite-plugin-pwa（Workbox generateSW）〔选定〕
- **Pros:** 自动从 Vite 产物生成 precache manifest（hashed 资源 + 懒加载 chunk 自动纳入，构建即同步）；内建更新生命周期（waiting/skipWaiting/版本清理）；Workbox runtime **打包进 SW 自托管**（无 CDN，CSP `script-src 'self'` 安全）；纯**构建期 devDep**，不进首屏 runtime（不碰 150KB 预算）
- **Cons:** 拉 Workbox 依赖树（供应链面增，但构建期）；子路径历史有 base 摩擦（1.3.0 已支持 vite base 继承）

### B. 手写 SW
- **Pros:** 零依赖、透明、合项目 no-lib 调性（toast 先例）
- **Cons:** **须自写构建脚本生成 hashed 资源清单**（每构建变名，否则离线缓存陈旧）+ 手写 skipWaiting/clients.claim/缓存版本清理/更新提示 → 劣质重造 Workbox + 维护陷阱（忘重生成清单→离线破）

### 决策：**A（vite-plugin-pwa 1.3.0）**〔accepted 2026-06-05〕
本项目是**多 chunk + 懒加载**的 Vite 应用，手写 SW 的核心难点正是"hashed 多 chunk 清单自动同步"——该交构建工具。与 toast「手写胜引库」改判：toast 无构建产物同步问题，PWA precache 有。**反例**：离线 scope 极简（单 HTML 无 chunk）则手写更优——本项目不适用。
> research-first：vite-plugin-pwa **1.3.0**（npm 核实 2026-06-05）/ peer `vite ^5.0.0`（本项目 5.2 ✓）/ `workbox-build`+`workbox-window` ^7.4.1 / generateSW 模式 Workbox runtime 内联自托管。

---

## D2 — 缓存范围

`workbox.globPatterns: ['**/*.{js,css,html,woff2,svg,webmanifest}']` —— precache 首屏 + 懒加载 chunk（mermaid 135KB / katex）+ katex woff2 字体。离线也能渲染公式/图（共识 AC-v15-3）。
- mermaid chunk 135KB gz / ~580KB raw > Workbox 默认 `maximumFileSizeToCacheInBytes`（2MB）以内，无需调；若未来超限再加 `maximumFileSizeToCacheInBytes`。
- 代价：首次缓存体积 ~几百 KB（一次性，非首屏 runtime，不碰 150KB 闸）。

## D3 — 更新策略

`registerType: 'prompt'`（非 autoUpdate）。`virtual:pwa-register` 的 `registerSW({ onNeedRefresh })` → 新版 SW 进 waiting → toast 提示「有新版，点刷新」→ 用户点击 → `updateSW(true)`（skipWaiting + reload）。不静默换版，不打断编辑（共识 AC-v15-4）。

## D4 — scope + CSP + 图标

- **scope**：SW 与 manifest 继承 vite `base: '/editor/'`；`start_url` / `scope` = `/editor/`
- **CSP**：index.html CSP 加 `manifest-src 'self'`（manifest 同源 fetch）；SW 脚本 + Workbox runtime 自托管（'self'，不动 `script-src`）；图标 same-origin PNG（不依赖 data:）
- **图标**：自托管 PNG 192×192 + 512×512 + maskable（`public/` 下）；`display: 'standalone'`；`theme_color` / `background_color` 跟随浅色主题基色
- **HTTPS**：GH Pages 原生 HTTPS，满足 SW 注册前提

---

## Consequences

- vite.config 加 `VitePWA({...})` 插件；`package.json` devDep `vite-plugin-pwa`
- index.html：CSP 加 `manifest-src 'self'`（manifest link 由插件注入或手写）
- main.tsx：import `virtual:pwa-register` → 注册 + onNeedRefresh → toast
- 新增 `public/` 图标（192/512/maskable）+ manifest（插件 `manifest` 配置生成）
- i18n：更新提示文案（`pwa.updateAvailable` / `pwa.refresh`）
- test-plan delta：离线家族（在线/离线 × 首屏/chunk × SW 态）
- 首屏闸不变（PWA 不进首屏 runtime）；新增 e2e 离线场景（Playwright `context.setOffline`）
- TS：`vite-plugin-pwa/client` 类型加进 tsconfig/env.d.ts（`virtual:pwa-register` 模块声明）

## References

- 共识 v1.5 TBD-v15-1~4
- **vite-plugin-pwa 1.3.0**（npm 核实 2026-06-05）：peer vite ^5.0.0；generateSW 默认；`registerType:'prompt'|'autoUpdate'`；`virtual:pwa-register` 暴露 `registerSW({onNeedRefresh,onOfflineReady})→updateSW`
- [vite-plugin-pwa subdirectory / base path](https://github.com/vite-pwa/vite-plugin-pwa/issues/263)（GH Pages 子路径继承 vite base）
- Workbox 7.4.1（随插件，runtime 内联 SW 自托管 → CSP script-src 'self' 安全）
- ADR-004（GH Pages `/editor/`）/ index.html CSP（F-V13-4 修复后含 font-src）
- 实现 commit：`296294e`（vite-plugin-pwa 1.3.0 + workbox-window 7.4.1）
- **实测产物**：`dist/sw.js`（5.8KB）+ `workbox-*.js`（自托管 runtime）+ manifest + 3 PNG 图标；precache **82 entries / 3.7MB**（含 mermaid 全部 diagram 子 chunk：cytoscape 142KB gz / wardley 145KB gz 等——D2 含 chunk 的代价，见增量 audit F-V15-1）
- **首屏影响**：workbox-window +0.84KB → 78.18KB gz（<150 闸）
- **验证**：unit 155 + e2e pwa project 4 场景（build+preview 真 SW，含离线 mermaid/katex 渲染 + console 干净），full e2e 63 pass/1 skip 无回归
