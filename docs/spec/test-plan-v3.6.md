# 测试计划 v3.6 delta — 文本高亮/标记

> **基线：** 共识 v3.6 AC-v36-1~6 + ADR-032。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.6 | 2026-06-22 | mark × ins × XSS 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v36-1 | `==x==`→`<mark>` | unit（先 ensureExtensions）+ e2e ac29 |
| AC-v36-2 | `++x++`→`<ins>` | unit |
| AC-v36-3 | lazy chunk 首屏不增 | size 闸 |
| AC-v36-4 | 未载降级 | unit |
| AC-v36-5 | **XSS 门槛** | unit + e2e 双引擎 |
| AC-v36-6 | 零回归（v3.4/v3.5 + 删除线 ~~）| 既有全量 |

## 家族

- **mark/ins 族**：`==x==→mark × ++x++→ins × hasExtension(==/++) × 单 = / 单 + 不触发`
- **降级族**：`未载含 == → raw 不报错`
- **XSS 族**：`==<script>==→剥离`
- **回归族**：`~~删除线~~ 仍 <s>（核心，不受影响）`

## 入口

- unit：`tests/unit/m2-preview/mark-ins.test.ts`
- e2e：`tests/e2e/ac29-mark-ins.spec.ts`（双引擎）
