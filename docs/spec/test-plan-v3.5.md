# 测试计划 v3.5 delta — callout 容器块

> **基线：** 共识 v3.5 AC-v35-1~7 + ADR-031。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.5 | 2026-06-22 | 4 类渲染 × 标题 × 内部 md × XSS 4 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v35-1 | 4 类型 → callout--{type} | unit（先 ensureExtensions）+ e2e ac28 |
| AC-v35-2 | 自定义标题 / 默认类型名 | unit |
| AC-v35-3 | 内部 markdown 正常 | unit |
| AC-v35-4 | 未知类型不渲染 callout | unit |
| AC-v35-5 | lazy chunk 首屏不增 | size 闸 |
| AC-v35-6 | **XSS 门槛** | unit + e2e 双引擎 |
| AC-v35-7 | 零回归（v3.4 扩展等）| 既有全量 |

## 家族

- **类型族**：`note/tip/warning/danger → 各 class × hasExtension(:::)`
- **标题族**：`:::note 标题 → 框顶标题 × :::note（无）→ 默认类型名 × 标题 escapeHtml`
- **内容族**：`callout 内 **bold**/列表 → 正常渲染 × 未知 :::foo → 非 callout`
- **XSS 族**：`标题/内容含 <script>/onerror → 剥离`

## 入口

- unit：`tests/unit/m2-preview/callout.test.ts`（ensureExtensions 后 render）
- e2e：`tests/e2e/ac28-callout.spec.ts`（双引擎：4 类渲染 + XSS）
