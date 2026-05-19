# 架构设计 v1.0 — editor MVP

| 字段 | 值 |
|------|----|
| **状态** | `accepted` (TBD-A1~A3 / A5~A8 ✓ 采纳；TBD-A4 部署 🕒 推迟到 release 前) |
| **版本** | v1.0 |
| **基线** | PRD v1.0 + 共识 v1.0 + 模块清单 v1.0 |
| **首版日期** | 2026-05-19 |
| **最近评审** | 2026-05-19 (v0.1 → v1.0) |
| **owner** | FE (Corray) |
| **关联 ADR** | ADR-001 accepted / ADR-002 accepted / ADR-003 accepted / **ADR-004 deferred** |
| **下游** | → 接口设计 + 数据模型 → 测试计划 → 代码 |

---

## 0. 定位

架构设计回答「**怎么搭**」。输入是共识 + 模块清单 + 技术约束，输出是技术结构 + 选型。

按 spec-to-code-flow §架构设计：有明显取舍的决策产 ADR；本文档汇总所有决策（含未产 ADR 的次要决策）+ 运行时拓扑 + 性能预算 + 安全设计。

按全局 CLAUDE.md ai-collaboration-principles，架构是**唯一鼓励 AI 给多方案对比**的阶段——以下每个决策点都给候选 + Pros/Cons + AI 推荐 + ADR ref。

---

## 1. 版本史

| 版本 | 日期 | 摘要 |
|------|------|------|
| v0.1 | 2026-05-19 | AI 起草，含 4 ADR (001-004) + 4 次要决策 + 性能预算 + 部署架构 |
| v1.0 | 2026-05-19 | Corray 评审：TBD-A1~A3 / A5~A8 全盘接受；**TBD-A4 部署推迟**（ADR-004 → deferred，MVP 实现期不出 deploy.yml）；ADR-001/002/003 升 accepted；进入下游接口设计阶段 |

---

## 2. 架构总览

### 2.1 高层视图

editor 是**纯客户端 Web SPA**——单页面应用，所有逻辑在浏览器执行，无后端，无登录。

```
┌────────────────────── Browser ──────────────────────┐
│                                                       │
│  ┌────────────────┐    ┌────────────────┐            │
│  │ M1 EditorArea  │──→│ M2 PreviewArea │            │
│  │ (textarea/CE) │    │ (parse+sanitize)│            │
│  └────────────────┘    └────────────────┘            │
│         │ onChange              ↑ read DOM           │
│         ↓                       │                     │
│  ┌────────────────┐    ┌────────────────┐            │
│  │ M3 Persistence │    │ M4 Export      │            │
│  │ (localStorage) │    │ (Blob/Clipboard)│           │
│  └────────────────┘    └────────────────┘            │
│                                                       │
│  ┌── M5 Layout / M6 Theme / M7 i18n (chrome) ──┐    │
│  │  AppShell 容器层                              │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
              ↓
        Static CDN (HTML/JS/CSS) — GitHub Pages
```

### 2.2 技术栈速览（决策汇总）

| 维度 | 选型 | 来源 |
|------|------|------|
| 语言 | TypeScript | 模块清单已锁定 Node/TS |
| 框架 | **Solid.js 1.8+** | ADR-003 |
| Markdown 渲染 | **markdown-it v14** | ADR-001 |
| HTML sanitize | **DOMPurify v3** | ADR-002 |
| 部署 | **GitHub Pages** | ADR-004 |
| 构建工具 | Vite | §3.1 |
| 状态管理 | Solid Signals 原生 | §3.2 |
| CSS | CSS Variables + 模块化 BEM | §3.3 |
| 测试 | Vitest + Playwright | §3.4 |
| 包管理 | pnpm | 已确认 |

---

## 3. 次要决策（不产 ADR）

> 这些决策没有"明显取舍"——候选大致等价、行业默认明显、或者范围太局部不值得 ADR。

### 3.1 构建工具：Vite

**选 Vite。** 候选 Vite / Parcel / esbuild 直用。理由：Solid 官方模板基于 Vite / 生态最成熟 / HMR 顺滑 / production build 走 Rollup 体积友好。esbuild 直用太低层，Parcel 配置自由度低。

### 3.2 状态管理：Solid Signals 原生

MVP 三个状态（源文 / 主题 / i18n lang）极简，Solid 内置 `createSignal` / `createStore` 够用，不引入第三方（Zustand / nano-stores 等）。

### 3.3 CSS 方案：CSS Variables + 模块化 BEM

理由：
- M6 主题切换天然依赖 CSS Variables（`--bg` / `--fg` 等，切换 `data-theme` 即可）
- Tailwind bundle 不友好 / utility 风格固定
- CSS Modules 需 build 配置 / 小项目过载
- vanilla CSS + BEM + variables 是 MVP 最简方案

### 3.4 测试方案：Vitest + Playwright

- **Vitest** — 单测：M2 渲染管线 / M3 状态机 / M4 文件名生成 / M7 `t()` 函数
- **Playwright** — E2E：AC-1 ~ AC-6 全部，跨浏览器 + 移动端模拟

---

## 4. 运行时拓扑

### 4.1 启动序列

```
1. HTML 加载
   <link rel="stylesheet" href="main.css">
   <script type="module" src="main.ts"></script>

2. main.ts 执行：
   a. M7 i18n init（同步，dict 内联在 bundle）
   b. M3 persistence init → 从 localStorage 还原 M1 状态
   c. M6 theme init → 读 localStorage / system preference → 写 data-theme
   d. M5 容器挂载 → M1 + M2 + chrome
   e. M2 监听 M1 signal，渲染管线就绪

3. 首次预览渲染（如有还原内容）

4. 用户可交互
```

### 4.2 数据流

- **源文 SoT** = M1 的 `signal(text)`
- M2 / M3 / M4 通过订阅 M1 signal 派生
- M3 debounce 写入封装在 M3 内部，不污染 M1
- M6 主题写到 M5 容器的 `data-theme` 属性，所有 CSS 通过 `[data-theme="dark"]` 选择器响应

---

## 5. 性能预算

| 资源 | 预算 (gzipped) | 来源 |
|------|--------------|------|
| HTML | < 3 KB | 单页 + meta |
| 主 JS bundle | < 100 KB | 含 Solid runtime + 应用代码 |
| markdown-it | < 30 KB | ADR-001，v14 默认 |
| DOMPurify | < 20 KB | ADR-002，v3 默认 |
| CSS | < 10 KB | reset + variables + 模块 BEM |
| **总** | **< 150 KB** | PRD §5 + 共识 §6.1 |
| 字体 | 0 | 用系统字体栈，不引入 web 字体 |

> 超预算触发 review；优先方案：砍 markdown-it 插件 / 替换更小的 micromark + DIY 转换。

### 性能关键路径

| 指标 | 阈值 | 责任模块 | 风险 |
|------|-----|---------|------|
| 首屏 TTFI | < 1s | bundle 体积 / 启动序列 | M3 同步读 localStorage（大文档时阻塞）|
| 输入到预览 | < 50ms (1000 行) | M2 渲染管线 | markdown-it parse + DOMPurify sanitize |
| 移动滚动 | 30fps 下限 | M5 布局 + M2 DOM 节点数 | 大文档预览 DOM 过大 |

---

## 6. 安全设计

| 维度 | 措施 |
|------|------|
| **XSS** | M2 强制 sanitize（DOMPurify, ADR-002）+ markdown-it `html:false` 双保险 |
| **CSP** | `<meta http-equiv="Content-Security-Policy">` 严格策略：`default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:` |
| **localStorage 数据敏感性** | 用户自行输入，产品定位不含密码/token/PII；不做加密 |
| **第三方依赖** | pnpm-lock.yaml 锁版本 + 启用 GitHub Dependabot |
| **HTTPS** | GitHub Pages 默认强制 |

按 `security-review.md`：M2 sanitize 模块标 `// [SECURITY REVIEW REQUIRED]`，PR 时人工 review。

---

## 7. 部署架构

**🕒 推迟（ADR-004 deferred at 2026-05-19）。** MVP 实现期不生成 deploy workflow，本节内容作为方向参考保留：

- 候选目标：GitHub Pages（推荐）/ Vercel / Cloudflare Pages
- 单页静态，无 client-side routing
- 前置阻塞：repo PRIVATE + Free 账号矛盾（PUBLIC / Pro / Vercel 三选一）

**MVP 实现期实际行为：**
- 本地 `pnpm dev` / `pnpm build` 可跑
- 不生成 `.github/workflows/deploy.yml`
- v1.0 代码完成 + release 前重启 ADR-004

---

## 8. 模块到代码结构映射

```
editor/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── index.html                  (单页入口)
├── src/
│   ├── main.tsx                (启动序列)
│   ├── modules/
│   │   ├── m1-editor/
│   │   │   ├── EditorArea.tsx
│   │   │   ├── GutterLineNumbers.tsx
│   │   │   └── FontControls.tsx
│   │   ├── m2-preview/
│   │   │   ├── PreviewArea.tsx
│   │   │   └── pipeline.ts          (markdown-it + DOMPurify)
│   │   ├── m3-persistence/
│   │   │   ├── store.ts             (localStorage R/W + state machine)
│   │   │   └── debounce.ts
│   │   ├── m4-export/
│   │   │   ├── ExportMd.ts
│   │   │   └── CopyHtml.ts
│   │   ├── m5-layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── DesktopLayout.tsx
│   │   │   └── MobileLayout.tsx
│   │   ├── m6-theme/
│   │   │   └── theme.ts
│   │   └── m7-i18n/
│   │       ├── i18n.ts
│   │       └── zh-CN.dict.ts
│   ├── styles/
│   │   ├── reset.css
│   │   ├── variables.css            (theme variables)
│   │   └── components/              (BEM)
│   └── shared/
│       └── toast.ts                 (跨模块小工具)
└── tests/
    ├── unit/                        (Vitest)
    └── e2e/                         (Playwright)
```

---

## 9. 演进策略

| 时间窗 | 演进点 |
|--------|-------|
| MVP → v1.1 | IndexedDB 替 localStorage / Service Worker 离线 / Mermaid + KaTeX 懒加载插件 |
| v1.1 → v1.2 | URL 分享（base64 query string）/ 导入 .md 文件 |
| v1.x → v2.0 | 后端账号 + 云同步（需新 PRD 起步）|

**模块演进口径：** 每模块 §职责边界 不动，**实现替换**走「保留接口 / 换内部实现」。

---

## 10. 决议汇总（原 TBD-A1~A8）

| # | 议题 | 决议（v1.0）| ADR |
|---|------|-----------|-----|
| TBD-A1 | 框架 | ✓ Solid.js 1.8+ | ADR-003 accepted |
| TBD-A2 | Markdown 渲染 | ✓ markdown-it v14 | ADR-001 accepted |
| TBD-A3 | sanitize | ✓ DOMPurify v3 | ADR-002 accepted |
| **TBD-A4** | **部署目标** | 🕒 **推迟**（MVP 实现期不部署，release 前重启）| **ADR-004 deferred** |
| TBD-A5 | PWA / Service Worker | ✓ 不做（v1.1+ 再加）| — |
| TBD-A6 | CSP `unsafe-inline` | ✓ 允许 `style-src 'unsafe-inline'`（主题切换需要）| — |
| TBD-A7 | 测试覆盖率门槛 | ✓ 单测 ≥ 70% 行覆盖 / E2E 覆盖 AC-1~6 全部 | — |
| TBD-A8 | 字体 | ✓ 系统字体栈，M1/M2 等宽用 `monospace` | — |

> 7 项已转为正式决议；1 项（A4）显式推迟，留待 release 前重启。

---

## 11. 评审决策记录

| 日期 | 评审人 | 决议 | 备注 |
|------|-------|------|------|
| 2026-05-19 | Corray | v0.1 → v1.0；TBD-A1~A3/A5~A8 ✓ 接受，TBD-A4 推迟 | ADR-001/002/003 升 accepted；ADR-004 deferred |

**下一步：** 进入 **接口设计 + 数据模型** 节点。ADR-004 在 release 前重启（待 repo 公开/私有/Vercel 三选一）。
