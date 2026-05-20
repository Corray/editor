# ADR-004 — 部署目标

| 字段 | 值 |
|------|----|
| **Status** | **accepted** (2026-05-20 restart by Corray — A1 path: PUBLIC repo + GitHub Pages) |
| **Date** | 2026-05-19（initial）/ 2026-05-20（restart）|
| **Decider** | FE (Corray) |
| **Context** | 架构 §7 / PRD §8 R3 |
| **Supersedes** | — |

## Context

editor 是纯静态 SPA，部署需求：
- 零成本 / 零运维
- HTTPS（隐私设计要求）
- 与 `Corray/editor` GitHub 仓库联动（CI/CD 自动）
- 全球可访问（CDN）

## Options

### A. GitHub Pages

- **Pros:** 与 `Corray/editor` 同 repo 零额外账号 / 免费（公开仓库）/ HTTPS / 全球 CDN / GitHub Actions deploy ~5 行 YAML / `gh-pages` 分支或 main `/docs` 两种模式
- **Cons:** 私有仓库 GitHub Pages 需要 Pro 账号 / 自定义域名需 DNS / 流量 100 GB/月软上限

### B. Vercel

- **Pros:** Preview deployments / 性能监控 / 私有仓库无限免费 / DX 最佳
- **Cons:** 引入第三方账号 / 配置略多于 GH Pages

### C. Cloudflare Pages

- **Pros:** 性能 SOTA / 免费层慷慨 / 边缘 Workers 扩展性
- **Cons:** 学习曲线 / 与现有 GitHub workflow 同步性弱

## Decision

**采用 GitHub Pages（A1 路径，重启 2026-05-20）。**

### 历史

- 2026-05-19 initial: ADR 标 deferred；MVP 实现期不做部署
- 2026-05-20 restart: 用户选 A1 — repo 切 PUBLIC（`gh repo edit --visibility public`） + GitHub Pages free tier + GitHub Actions workflow

### 路径选择（A1）

| 选项 | 决议 |
|------|------|
| A1: repo 切 PUBLIC | ✅ **采纳** — 代码公开，GitHub Pages free tier 可用 |
| A2: 保持 PRIVATE + 升级 Pro | ❌ 未采纳（$4/月 vs 公开化无成本）|
| A3: 改 Vercel | ❌ 未采纳（避免引入第三方账号）|

### 实施

- Pages source: **GitHub Actions**（不用 main /docs 或 gh-pages branch）
- Workflow: `.github/workflows/deploy.yml`
  - on main push
  - build: pnpm install + typecheck + test:run + vite build
  - deploy: actions/upload-pages-artifact + actions/deploy-pages
- Vite `base: '/editor/'`（仓库子路径前缀）
- URL: `https://corray.github.io/editor/`

## Consequences

- ✅ 与 Issue / PR / Actions workflow 同源
- ✅ 零额外账号 + 免费 + HTTPS + 全球 CDN（Fastly 边缘）
- ⚠ **repo 公开化（不可逆）**：所有 commit / Issue / PR / spec 文档对外可见；future 敏感配置（API key 等）必须走 GitHub Secrets
- ⚠ 流量软上限 100 GB/月（MVP 无关，纪录在案）
- 📌 v1.1+ 自定义域名时走 Cloudflare DNS（不写 ADR-004，留新 ADR-005-custom-domain）

## References

- https://docs.github.com/en/pages
- https://github.com/Corray/editor (PUBLIC, switched 2026-05-20)
- GitHub Pages Actions deploy: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
