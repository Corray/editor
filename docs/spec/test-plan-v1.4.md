# 测试计划 v1.4 delta — Mermaid 图

> v1.0 测试计划增量。覆盖 Mermaid 渲染 / 懒加载 / 异步竞态 / **SVG XSS（发布门槛）**。
> **基线：** 共识 v1.4 AC-v14-1~6 + ADR-008。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.4 | 2026-06-04 | Mermaid 渲染 / 懒加载 / 竞态 / SVG XSS 家族 |

---

## 1. 验收条件矩阵

| AC | 场景 | 测试 ID | 层 |
|----|------|---------|----|
| AC-v14-1 | ` ```mermaid graph TD;A-->B ` → 渲染流程图（占位→SVG）| UT-MMD-001 / E2E-v14-001 | unit + e2e |
| AC-v14-2 | 纯文本/无图 → 不加载 mermaid（首屏不变）| UT-MMD-lazy / size 闸 | unit + CI |
| AC-v14-3 🔴 | 恶意 mermaid（注入 script/onerror/foreignObject/外链 use/image js）→ sanitize 后无执行 | UT-MMD-XSS-003 / E2E-v14-003 | unit + e2e（**发布门槛**）|
| AC-v14-4 | 非法 mermaid 语法 → 块内显错，不崩、不影响其余预览 | UT-MMD-004 / E2E-v14-004 | unit + e2e |
| AC-v14-5 | 多图 + 渲染中改文本 → 不串图（代次令牌）| UT-MMD-race-005 | unit |
| AC-v14-6 | 深色主题 → mermaid dark theme | E2E-v14-006（视觉/属性）| e2e |

## 2. 家族维度枚举

**核心家族：`内容 × 加载态 × 异步态`**

| 维度 | 取值 |
|------|------|
| 内容 | 纯 md / 单图 / 多图 / 图+公式混合 / 非法图 / **恶意 SVG 注入** |
| 加载态 | mermaid 未载（首次，占位 + 触发 import）/ 已载 |
| 异步态 | 占位 / 渲染完成填充 / 渲染失败错误占位 / **竞态（渲染中文本变 → 丢弃）** |
| sanitize | mermaid strict 正常 SVG / 恶意注入被 DOMPurify+FORBID 剥离 |

**必测组合（不漏网）：**
- XSS × {图 label 注入 `<script>` / `<img onerror>` / 强制 foreignObject / `<use href=外链>` / `<image href=javascript:>` / 事件属性} → DOM 级断言无可执行元素/属性
- 竞态 × {单图渲染中改文本 → 旧图丢弃 / 多图部分完成时改文本}
- 失败 × {非法语法单块 → 错误占位，其余块/markdown 不受影响}
- 懒加载 × {首次触发 import / 已载复用 / 无图不加载}

## 3. 用例清单（关键）

| ID | 场景 | 预期 |
|----|------|------|
| UT-MMD-001 | renderMermaid('graph TD;A-->B') | 返回含 `<svg` 的 sanitized 串 |
| **UT-MMD-XSS-003** | renderMermaid(恶意图含注入) | DOM 级断言：无 script/foreignObject/事件属性/js: href（strict+htmlLabels:false+DOMPurify FORBID 三层）|
| UT-MMD-004 | renderMermaid(非法语法) | 抛错（调用方 catch）→ 不污染其余 |
| UT-MMD-race-005 | 模拟 gen 变更 | 过期渲染结果被丢弃（不替换）|
| UT-MMD-lazy | hasMermaid 探测 ` ```mermaid ` | 准确触发/不触发 |
| E2E-v14-001 | 输入 mermaid 图 | 预览出 svg（懒加载后，auto-wait）|
| E2E-v14-003 | 输入恶意 mermaid | alert spy 未触发 + 无 script/foreignObject 元素 |
| E2E-v14-004 | 非法图 | 错误占位，其余 markdown 正常 |

## 4. 测试基础设施（PP-003）

- **mermaid 在 jsdom/vitest**：mermaid 渲染依赖 DOM 测量（getBBox 等 jsdom 不全实现）→ 单测 renderMermaid 可能需 mock mermaid 或仅测 sanitize 包装层；**真渲染验证靠 e2e**（真浏览器）。research-first 核 mermaid 在 jsdom 行为
- **XSS 断言 DOM 级**：DOMParser 查 script/foreignObject/事件属性/js-href（沿用 katex.test 范式）
- **竞态**：unit 用代次令牌的可注入设计直接测；e2e 难稳定模拟
- **懒加载 chunk**：首屏 `pnpm size` 确认 mermaid 不在首屏
- **e2e 异步**：toBeVisible 自动等懒加载+渲染

## 5. 回归 + 安全门槛

- 既有 AC + v11~v13 不受影响（mermaid additive；无图路径不变）
- **AC-v14-3（SVG XSS）是发布门槛** —— security review + 测试通过才 tag v0.5.0
- 首屏 `pnpm size` < 150KB（mermaid 懒加载不计）
