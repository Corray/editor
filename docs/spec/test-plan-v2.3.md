# 测试计划 v2.3 delta — 代码块语法高亮

> **基线：** 共识 v2.3 AC-v23-1~7 + ADR-019。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.3 | 2026-06-12 | 高亮 × 降级 × XSS × 主题 4 家族 |

---

## 1. AC ↔ 场景矩阵

| AC | 场景 | 载体 |
|----|------|------|
| AC-v23-1 | 常用语言着色（hljs-* span 出现）| unit（render 集成）+ e2e ac16 |
| AC-v23-2 | 未知语言/无标注降级无色 | unit |
| AC-v23-3 | mermaid fence 不被拦截 | unit + 既有 ac9 回归 |
| AC-v23-4 | **XSS 门槛**：恶意代码内容不逃逸（双引擎）| e2e ac16 |
| AC-v23-5 | lazy chunk 首屏不增 | size 闸 |
| AC-v23-6 | 主题切换配色即时跟随 | e2e ac16 |
| AC-v23-7 | 零回归（KaTeX/Mermaid/防抖/滚动同步）| 既有全量 e2e |

## 2. 家族维度

- **高亮族**：`js/ts/python/bash/json 常用语言 × 着色 span 存在 × code class 含 language-*`
- **降级族**：`未知语言(zzz) × 无标注 fence × hljs 未加载期间(返 '' escapeHtml) × 非法语法(ignoreIllegals 不抛)`
- **hasCode 启发式族**：`带语言 fence(true) × mermaid-only(false) × 无标注(false) × ~~~ 围栏(true) × inline code(false)`
- **XSS 族**：`<script> 注入 code 内容 × onerror 属性文本 × javascript: URL 文本 → 全部 escaped/剥离无 alert`
- **主题族**：`light→dark 切换 → --hl-* 变量值变 → span 颜色即时变（无重渲染）`

## 3. 测试入口

- unit：`tests/unit/m2-preview/highlight.test.ts`
- e2e：`tests/e2e/ac16-highlight.spec.ts`（双引擎）
- 既有全量：unit 230 + e2e 116 不退
