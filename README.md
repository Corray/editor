# editor

> Web 轻量 Markdown 编辑器 — 纯前端 SPA，单文档，零后端

**Live demo:** https://corray.github.io/editor/
**Release:** [v0.1.0 — MVP](https://github.com/Corray/editor/releases/tag/v0.1.0)（2026-05-20）

---

## Features（v0.1.0）

- 📝 textarea 编辑 + 实时预览（双栏 / 移动端 tab）
- 💾 localStorage 自动持久化（debounce + 1MB 软限）
- 📤 下载 `.md` / 复制 HTML（clipboard + fallback）
- 🎨 浅色 / 深色主题（系统偏好 + 用户覆盖 + 持久化）
- 🌐 zh-CN 文案（i18n 单例 + 15-key dict，方便后续扩展）
- 📱 响应式布局（matchMedia reactive + iPhone SE 起测）

**非目标（v0.1.0 显式不做）：** 多用户协作 / 后端账号 / WYSIWYG / 插件市场 / 多文档管理。

---

## Tech Stack

| 维度 | 选型 | 决策 |
|------|------|------|
| Framework | [Solid.js](https://www.solidjs.com/) 1.8+ | [ADR-003](./docs/adr/ADR-003-framework.md) |
| Markdown 渲染 | [markdown-it](https://github.com/markdown-it/markdown-it) v14 | [ADR-001](./docs/adr/ADR-001-markdown-renderer.md) |
| HTML sanitize | [DOMPurify](https://github.com/cure53/DOMPurify) v3 | [ADR-002](./docs/adr/ADR-002-html-sanitize.md) |
| 构建 | [Vite](https://vitejs.dev/) 5 | — |
| 单元测试 | [Vitest](https://vitest.dev/) 1.6 + jsdom | — |
| E2E | [Playwright](https://playwright.dev/) 1.43（chromium + webkit）| — |
| 状态管理 | Solid Signals 原生 | — |
| 样式 | CSS Variables + BEM | — |
| 持久化 | localStorage（v1.1+ 计划 IndexedDB）| — |
| 部署 | GitHub Pages（PUBLIC + Actions workflow）| [ADR-004](./docs/adr/ADR-004-deployment-target.md) |

---

## Local Development

需要 [pnpm](https://pnpm.io/) 9+（仓库锁定）+ Node 20+。

```bash
pnpm install            # 装依赖
pnpm dev                # 起 dev server（http://localhost:5173）
pnpm build              # 生产构建 → dist/
pnpm preview            # 本地起生产构建
pnpm typecheck          # tsc --noEmit（CI 门禁）
pnpm test:run           # 单测一次性跑（108 用例）
pnpm test:coverage      # 覆盖率（96%+ line coverage）
pnpm e2e                # E2E（chromium + webkit，28 用例）
pnpm e2e:ui             # E2E 交互调试
```

---

## Project Structure

```
src/
├── main.tsx                 # 入口，组装 M1 + M3 + M6 + 反哺 readStoredDocument
├── modules/
│   ├── m1-editor/           # 编辑：textarea + state SoT + EditorAPI
│   ├── m2-preview/          # 预览：markdown-it + DOMPurify pipeline + PreviewArea
│   ├── m3-persistence/      # 持久化：localStorage 状态机 + debounce
│   ├── m4-export/           # 导出：.md 下载 + 复制 HTML + clipboard fallback
│   ├── m5-layout/           # 布局：LayoutAPI reactive + 移动端 tabs
│   ├── m6-theme/            # 主题：light/dark + 3 级 fallback
│   └── m7-i18n/             # i18n：singleton + zh-CN dict
├── shared/
│   └── toast.ts             # imperative stub（完整 UI follow-up 见 #14）
└── styles/
    ├── reset.css
    └── variables.css

tests/
├── unit/                    # Vitest，108 用例
└── e2e/                     # Playwright，6 AC suites × 多 viewport
```

---

## Documentation

| 类别 | 文档 |
|------|------|
| **PRD** | [PRD v1.0 — MVP](./docs/prd/PRD-v1.0-mvp.md) |
| **共识 / 设计** | [consensus](./docs/spec/consensus-v1.0.md) · [module-list](./docs/spec/module-list-v1.0.md) · [architecture](./docs/spec/architecture-v1.0.md) · [api-spec](./docs/spec/api-spec-v1.0.md) · [data-model](./docs/spec/data-model-v1.0.md) · [test-plan](./docs/spec/test-plan-v1.0.md) |
| **架构决策** | [ADR-001 markdown-it](./docs/adr/ADR-001-markdown-renderer.md) · [ADR-002 DOMPurify](./docs/adr/ADR-002-html-sanitize.md) · [ADR-003 Solid](./docs/adr/ADR-003-framework.md) · [ADR-004 GH Pages](./docs/adr/ADR-004-deployment-target.md) |
| **审查** | [findings-registry](./docs/audit/findings-registry.md) · [2026-05-20 multiphase audit](./docs/audit/2026-05-20-mvp-multiphase.md) · [retrospective](./docs/audit/2026-05-20-mvp-retrospective.md) |
| **Release** | [release-history](./docs/release-history.md) |

---

## Roadmap（backlog）

v0.1.0 后续待办按性质装在 3 个 umbrella Issue：

- **tech-debt** — [#14](https://github.com/Corray/editor/issues/14)（M2 PreviewAPI / shared/toast 完整 UI）
- **deferred-feature** — [#15](https://github.com/Corray/editor/issues/15)（行号 / 字号 / perf bench / mobile-safari）
- **process** — [#16](https://github.com/Corray/editor/issues/16)（流程 deviation / commit hash 占位）

---

## License

未指定。仓库 PUBLIC 用于演示，使用前请联系作者。
