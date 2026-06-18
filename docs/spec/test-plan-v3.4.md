# 测试计划 v3.4 delta — markdown 扩展包

> **基线：** 共识 v3.4 AC-v34-1~7 + ADR-030。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.4 | 2026-06-18 | emoji × 脚注 × 上下标 × 降级 × XSS 5 家族 |

## AC ↔ 场景

| AC | 场景 | 载体 |
|----|------|------|
| AC-v34-1 | `:smile:` → emoji 字符 | unit（render 含 emoji）+ e2e ac27 |
| AC-v34-2 | 脚注 `[^1]`+def → ref + 定义 | unit |
| AC-v34-3 | `~sub~`→sub / `^sup^`→sup | unit |
| AC-v34-4 | lazy chunk 首屏不增 | size 闸 |
| AC-v34-5 | 未载降级 raw | unit（加载前 render 不含扩展输出）|
| AC-v34-6 | **XSS 门槛** | unit + e2e 双引擎 |
| AC-v34-7 | 零回归（katex/mermaid/hljs/task/frontmatter）| 既有全量 |

## 家族

- **emoji 族**：`:smile: → 😄 × 未知 :notreal: → 原样 × 加载后渲染`
- **脚注族**：`[^1] + [^1]: def → footnote-ref sup + footnotes section`
- **上下标族**：`~H2O~ 的 2 → sub × ^2^ → sup`
- **降级族**：`未载期间含扩展语法 → 不报错（raw）× 加载后 bump 重渲染`
- **XSS 族**：`扩展语法承载 <script>/onerror → sanitize 剥离`

## 入口

- unit：`tests/unit/m2-preview/extensions.test.ts`（先 ensureExtensions 再 render）
- e2e：`tests/e2e/ac27-extensions.spec.ts`（双引擎：emoji 渲染 + XSS）
