# 测试计划 v1.5 delta — Service Worker 离线（PWA / M8）

> v1.0 测试计划增量。覆盖 M8 PWA。
> **基线：** 共识 v1.5 AC-v15-1~6 + ADR-009。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.5 | 2026-06-05 | 离线家族（网络 × 资源 × SW 态）+ 更新提示 + 可安装 |

---

## 1. 家族维度（枚举，不靠 bug 复现反推）

`网络(在线 / 离线) × 资源(首屏 / 懒加载 chunk mermaid·katex) × SW 态(首次装 / 已缓存 / 有更新)`

PWA 的 SW + Cache 高度依赖**真浏览器**（jsdom 无 SW / Cache API / navigator.onLine 行为不全）→ 核心验收落 **e2e**（Playwright `context.setOffline(true)`）。单测覆盖纯逻辑（toast action 扩展）。

## 2. AC ↔ 测试映射

| AC | 场景 | 层级 | 测试 |
|----|------|------|------|
| AC-v15-1 | 在线访问一次 → 断网 reload → 应用仍打开 + 可编辑 | e2e | E2E-v15-001（`setOffline(true)` 后 reload，editor 可见可输入）|
| AC-v15-2 | 离线编辑 → IndexedDB 持久化 → 重开仍在 | e2e | E2E-v15-002（离线输入 → 离线 reload → 文本还在）|
| AC-v15-3 | 离线打开含公式/图 → mermaid/katex chunk 已 precache → 离线渲染 | e2e | E2E-v15-003（离线状态 fill mermaid/katex → SVG/.katex 出现）|
| AC-v15-4 | 部署新版 → SW 更新 → toast「有新版，点刷新」→ 点击刷新 | e2e（难真实模拟部署）/ 单测（onNeedRefresh 回调 → toast action）| UT-PWA-update（mock registerSW onNeedRefresh → 验 toast 带 action + onClick 调 updateSW）|
| AC-v15-5 | 可安装（manifest 有效）| e2e/手验 | E2E-v15-005（manifest link 存在 + 关键字段；浏览器安装入口手验）|
| AC-v15-6 | CSP 不报错 + console 干净（PP-003 #7）| e2e + 眼验 | E2E-v15-006（在线/离线加载 console 无 error）+ 线上眼验破缓存查 console |
| — | toast action 向后兼容（无 action 时行为不变）| 单测 | UT-toast-action（有/无 action 两路）|

## 3. 关键测试纪律

- **离线 e2e**：Playwright `await context.setOffline(true)` 模拟断网；先在线加载一次让 SW 装好 + precache（SW 装好需等 `navigator.serviceWorker.ready`），再 setOffline + reload
- **SW 在 dev 默认禁用**：vite-plugin-pwa 默认 dev 不启 SW（`devOptions.enabled` 控制）；e2e 须跑 **build + preview**（真 SW），不能 dev server
- **冷加载 + 破缓存（PP-003 #5/#6）**：SW 验证天然涉及缓存——眼验/e2e 注意 SW 缓存与浏览器缓存两层；线上眼验破缓存（`?cb=`）
- **更新提示难真实模拟**：部署新版触发 SW 更新在 e2e 难造（需两次 build + 版本差）→ AC-v15-4 主走单测（mock onNeedRefresh），e2e 仅验注册不报错

## 4. 单测可覆盖部分

- UT-toast-action：`showToast(msg, {action})` 渲染按钮 + 点击调 onClick；`showToast(msg)` 无按钮（向后兼容）
- UT-PWA-update：mock `registerSW`，触发 onNeedRefresh → 验 toast 调用含 action.label + onClick 触发 updateSW(true)

## 5. 不测 / 边界

- 不测 Workbox 内部 precache 正确性（信任库 + e2e 离线打开间接验证）
- 不测浏览器安装 UI 弹窗（手验）
- SW 版本清理 / waiting 生命周期细节信任 Workbox
