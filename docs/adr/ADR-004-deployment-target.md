# ADR-004 — 部署目标

| 字段 | 值 |
|------|----|
| **Status** | proposed |
| **Date** | 2026-05-19 |
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

**采用 GitHub Pages。**

⚠ **决策前置依赖：** 当前 `Corray/editor` 是 **PRIVATE** 仓库（已验证 `gh repo view` 2026-05-18）。GitHub Pages 私有仓库需要 GitHub Pro。

**评审时需 Corray 确认：**

| 路径 | 触发条件 | 后续动作 |
|------|---------|---------|
| A1: repo 切 PUBLIC | 接受代码公开 | 直接 GitHub Pages |
| A2: 保持 PRIVATE + 升级 Pro | 接受 $4/月 | GitHub Pages 仍可用 |
| A3: 改 Vercel | 保持 PRIVATE + 不升级 Pro | ADR-004 supersede 改 Vercel |

## Consequences

- ✅ 与 Issue / PR / Actions workflow 同源
- ✅ 零额外账号
- ⚠ 私有仓库 + Free 账号矛盾，**需评审解决**
- 📌 v1.1+ 绑自定义域名时 DNS 配置走 Cloudflare

## References

- https://docs.github.com/en/pages
- https://github.com/Corray/editor (PRIVATE, 2026-05-18)
