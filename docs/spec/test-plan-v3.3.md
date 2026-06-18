# 测试计划 v3.3 delta — frontmatter (YAML) 支持

> **基线：** 共识 v3.3 AC-v33-1~7 + ADR-029。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.3 | 2026-06-18 | 识别 × 不误识别 × 解析 × XSS 4 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v33-1 | doc 头 frontmatter → metadata 框，无 hr | unit（render 含 frontmatter class，无 `<hr`）+ e2e ac26 |
| AC-v33-2 | 文中 `---` 仍 hr | unit |
| AC-v33-3 | 无闭合 `---` → 不识别（走 hr）| unit |
| AC-v33-4 | key:value 解析 + 嵌套行原样 | unit |
| AC-v33-5 | **XSS 门槛**：值含恶意剥离 | unit + e2e 双引擎 |
| AC-v33-6 | frontmatter 后正文正常 | unit |
| AC-v33-7 | 零回归 | 既有全量 |

## 家族

- **识别族**：`doc 头 ---...--- → frontmatter 框 × 首行非 --- 不识别 × --- 后立即闭合（空 frontmatter）`
- **不误识别族**：`文中 --- → hr × 首行 --- 无闭合到文末 → hr（不吞全文）× 仅 1 个 --- → hr`
- **解析族**：`key: value → dt/dd × 多个 kv × 嵌套缩进行原样 × 数组 - 行原样 × value 含 : 不二次切`
- **XSS 族**：`title: <script>alert(1)</script> → escaped 无 alert × value onerror → 剥离`

## 入口

- unit：`tests/unit/m2-preview/frontmatter.test.ts`（render）
- e2e：`tests/e2e/ac26-frontmatter.spec.ts`（双引擎：metadata 框渲染 + XSS）
