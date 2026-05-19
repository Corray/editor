# ADR-002 — HTML Sanitize 方案

| 字段 | 值 |
|------|----|
| **Status** | **accepted** (2026-05-19 Corray) |
| **Date** | 2026-05-19 |
| **Decider** | FE (Corray) |
| **Context** | 共识 §4.2 (TBD-4 决议) / 模块 M2 / `security-review.md` / ADR-001 |
| **Supersedes** | — |

## Context

共识 TBD-4 已决议预览必须 sanitize（XSS 安全红线）。markdown-it 默认 `html:false` 过滤大部分 raw HTML，但仍可能因配置 / 后续插件引入而需要二次 sanitize；且 v1.1+ 如允许 `<details>` `<sub>` 等白名单标签时，必须用专业 sanitize 库而非自写。

约束：
- 严格白名单 / 默认安全
- bundle < 20 KB gzipped
- 0 未修复 CVE
- 维护活跃 / 业界默认

## Options

### A. DOMPurify (v3)

- **Pros:** 业界默认 / 维护活跃 / 0 已知未修 CVE / 严格白名单 / SVG/MathML 模式 / TS 类型内置 / ~20 KB gzipped / 一行调用 `DOMPurify.sanitize(html)`
- **Cons:** —

### B. sanitize-html (npm)

- **Pros:** 配置直观（JSON schema）
- **Cons:** bundle 较大（~40 KB）/ 依赖 htmlparser2 / 浏览器兼容需 polyfill / 性能逊于 DOMPurify

### C. 自写白名单

- **Pros:** bundle 0 额外
- **Cons:** **强烈不推荐**——XSS 边界极多（DOM Clobbering / mutation XSS / namespace 混淆）/ DIY 几乎必出漏洞 / 违反 `security-review.md`

## Decision

**采用 DOMPurify (v3)。**

## Consequences

- ✅ 零安全风险 / 业界默认 / bundle 在预算内
- ✅ M2 渲染管线最终一步：`DOMPurify.sanitize(mdItOutput)`
- ⚠ —
- 📌 M2 sanitize 代码块标 `// [SECURITY REVIEW REQUIRED]`（遵循 `security-review.md`）
- 📌 升级 DOMPurify 版本前看 changelog（CVE 修复优先）

## References

- https://github.com/cure53/DOMPurify
- https://github.com/cure53/DOMPurify/blob/main/README.md#why-do-i-need-dompurify
