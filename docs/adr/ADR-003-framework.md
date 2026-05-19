# ADR-003 — 框架选型

| 字段 | 值 |
|------|----|
| **Status** | proposed |
| **Date** | 2026-05-19 |
| **Decider** | FE (Corray) |
| **Context** | 共识 §3 / 模块清单 §3 / 架构 §2.2 |
| **Supersedes** | — |

## Context

editor MVP 是纯前端 SPA，体量小（7 模块），核心 UI 交互少（输入 / 预览 / 切主题 / 切 tab）。框架约束：

- bundle 开销 < 30 KB gzipped
- TS 类型一流
- 支持 TSX/SFC（避免退回纯 DOM API）
- Vite 集成 / 单测 / 必要时路由

## Options

### A. React 18+

- **Pros:** 生态最大 / 招聘市场最熟 / Vite 模板成熟
- **Cons:** bundle 大（react+react-dom ~45 KB gzipped）/ 虚拟 DOM 对单文档编辑器是 overkill / hooks 心智负担

### B. Solid.js 1.8+

- **Pros:** bundle 极小（~7 KB gzipped）/ 细粒度响应式（修改 signal 仅更新涉及节点）/ TSX 体验等价 React / Vite 模板官方 / TS 一流 / 性能 SOTA
- **Cons:** 生态比 React 小（但 MVP 不需复杂第三方）/ 招聘市场窄

### C. Preact + Signals

- **Pros:** API 像 React / bundle ~10 KB / `@preact/signals` 细粒度响应式
- **Cons:** signals 整合不如 Solid 原生纯粹 / Vite 配置需 preact alias

### D. Vanilla TS（不用框架）

- **Pros:** 零框架开销
- **Cons:** DOM 操作样板多 / 状态变更心智重 / 测试组件化困难 / 共识 §3 模块结构难以优雅落地

## Decision

**采用 Solid.js 1.8+。**

理由：
- **bundle** 最小（~7 KB） + **性能** SOTA
- **DX** 等价 React 的 TSX，学习成本低
- **响应式模型**与 M1 onChange → M2/M3 订阅的 SoT 模型天然匹配
- MVP 范围下生态局限不构成阻碍

## Consequences

- ✅ 性能 / 体积 / DX 三者最优
- ⚠ 团队扩张需培训（当前单人，无影响）
- ⚠ 招聘市场窄
- 📌 如未来需 SSR / 复杂路由 / 大型动画，重评估（v2.0+ 时点）

## References

- https://www.solidjs.com/
- https://krausest.github.io/js-framework-benchmark/
