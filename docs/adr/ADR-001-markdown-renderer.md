# ADR-001 — Markdown 渲染库

| 字段 | 值 |
|------|----|
| **Status** | **accepted** (2026-05-19 Corray) |
| **Date** | 2026-05-19 |
| **Decider** | FE (Corray) |
| **Context** | 共识 §4.2 / 模块 M2 / 架构 §2.2 |
| **Supersedes** | — |

## Context

M2 预览模块需 Markdown → HTML 解析器。约束：

- 支持 CommonMark 全集（共识 §4.2）
- 输出 HTML 字符串便于 DOMPurify sanitize（ADR-002）
- bundle < 30 KB gzipped（架构 §5 性能预算）
- 后续可挂插件（v1.1+ KaTeX / Mermaid / 代码高亮）
- 性能：1000 行内容 parse < 50ms（PRD §5 / 共识 §6.1）

## Options

### A. markdown-it (v14)

- **Pros:** 生态丰富 / 默认 `html:false` 关 raw HTML / 插件机制成熟（kbd/katex/mermaid/highlight 都有官方或社区插件）/ CommonMark 0.30 完整 / token stream 可被中间处理 / 业界主流（VS Code / Joplin / Hexo 都在用）
- **Cons:** bundle 略大（~30 KB gzipped）/ TS 需 `@types/markdown-it` 单独装

### B. marked (v14+)

- **Pros:** 极简 / bundle 最小（~15 KB gzipped）/ 性能高
- **Cons:** 历史 CVE 较多（XSS / ReDoS）/ 插件生态弱 / 默认行为脆弱（需重度依赖外置 sanitize）

### C. micromark

- **Pros:** 严格 CommonMark / 模块化（按需引入）/ 性能 SOTA
- **Cons:** API 偏底层（输出 mdast，需要再转 HTML，多一步管线）/ 适合工具链 / 不适合直接 UI 渲染

## Decision

**采用 markdown-it (v14)。**

理由：
- **安全：** 默认 `html:false` 关 raw HTML，叠加 DOMPurify 双保险
- **体积：** ~30 KB 在预算内
- **扩展：** v1.1+ 加 KaTeX/Mermaid 时 `.use(plugin)` 不重构
- **生态：** 业界默认，遇问题易查

## Consequences

- ✅ 安全 / 可扩展 / 体积平衡
- ⚠ 比 marked 多 ~15 KB bundle
- 📌 v1.1+ 引入 KaTeX 等大型插件时按需 lazy-load，避免 MVP bundle 膨胀

## References

- https://github.com/markdown-it/markdown-it
- https://commonmark.org/
