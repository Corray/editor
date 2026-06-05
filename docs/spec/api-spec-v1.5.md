# 接口设计 v1.5 delta — Service Worker 离线（PWA / M8）

> v1.0 接口增量。新增 M8 PWA 基础设施；M1-M7 业务契约不变。
> **基线：** 共识 v1.5（accepted）+ ADR-009（D1=vite-plugin-pwa）。
> **data-model：** 无变更（离线复用 IndexedDB v1.1，不改 schema）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.5 | 2026-06-05 | SW 注册 + 更新提示编排；manifest 字段；vite PWA 插件配置契约 |

---

## 1. 构建配置（vite.config.ts / ADR-009 D1,D2,D4）

```ts
VitePWA({
  registerType: 'prompt',            // D3：不静默更新
  // base 继承 vite base '/editor/'（D4 scope）
  manifest: {
    name: 'editor — Markdown 编辑器',
    short_name: 'editor',
    start_url: '/editor/',
    scope: '/editor/',
    display: 'standalone',
    theme_color: '<浅色主基色>',
    background_color: '<浅色背景>',
    icons: [
      { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,woff2,svg,webmanifest}'],  // D2：含懒加载 chunk + katex 字体
  },
})
```

## 2. SW 注册 + 更新编排（main.tsx / ADR-009 D3）

```
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // 新版 SW 进 waiting → toast 提示
    showToast(t('pwa.updateAvailable'), {
      action: { label: t('pwa.refresh'), onClick: () => updateSW(true) },  // skipWaiting + reload
    })
  },
  onOfflineReady() {
    // 可选：首次离线就绪提示（MVP 可省或轻提示）
  },
})
```

**契约要点：**
- `virtual:pwa-register` 是 vite-plugin-pwa 注入的虚拟模块；类型经 `vite-plugin-pwa/client` 三斜线引用进 env.d.ts
- `updateSW(true)` = skipWaiting + 自动 reload（用户点刷新才触发，D3）
- toast 复用 shared/toast（若现有 toast 无 action 按钮能力，本版扩 toast 支持可选 action——见 §3）

## 3. toast action 扩展（按需，shared/toast.ts）

现有 toast（API-T-001）为纯文本 + 自动消失。PWA 更新提示需「点刷新」交互。两条路：
- **(a) toast 加可选 `action: { label, onClick }`**（推荐：复用单一 toast 通道，更新提示 = 带按钮的 toast）
- (b) 单独的更新条 UI（独立组件）

选 (a)：扩 `showToast(msg, opts?)` 的 `opts.action`；无 action 时行为不变（向后兼容，现有调用不动）。

## 4. CSP（index.html / ADR-009 D4）

`default-src 'self'; ... ; manifest-src 'self'; ...` —— 加 `manifest-src 'self'`（manifest 同源 fetch）。SW 脚本 + Workbox runtime 自托管（'self'，不动 `script-src`）。图标 same-origin PNG。

## 5. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| vite.config VitePWA 配置（manifest + globPatterns 含 chunk + devOptions off）| ✓ 已实现（2026-06-05）| `296294e` |
| main.tsx registerSW（virtual:pwa-register）+ m8-pwa/register wireUpdatePrompt → toast | ✓ | `296294e` — register 逻辑解耦虚拟模块（DI，可单测）|
| toast action 扩展（持久 + 向后兼容 3-arg）| ✓ | `296294e` — `showToast(msg,level,ms,action?)` |
| index.html CSP manifest-src + worker-src + 图标资源 | ✓ | `296294e` — 自绘 PNG 192/512/maskable |
| env.d.ts vite-plugin-pwa/client 类型 | ✓ | `296294e` |
| workbox-window 运行时依赖（prompt 模式必需）| ✓ | `296294e` — 首屏 +0.84KB |
