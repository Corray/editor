# 共识文档 v2.3 — 预览代码块语法高亮

> v1.0 共识增量 delta（2026-06-12 四项拍板 scope 第一项）。
>
> **状态：** `accepted`（2026-06-12；TBD-v23-1~4 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M2 delta → ADR-019 → api/test-plan delta → 实现
> **命名：** semver tag **v1.3.0-rc.1**（rc 策略沿 TBD-v21-0a）。L2（扩 M2 渲染管线，安全敏感面走 KaTeX/Mermaid 熟范式）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.3-draft | 2026-06-12 | fenced code 按语言着色（懒加载）；4 TBD 待 accept |
| v2.3 | 2026-06-12 | TBD-v23-1~4 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

预览里代码块目前是无色等宽文本——Markdown 编辑器最常见的功能缺口。本版给 ```lang fence 着色。

**范围（仅）：** 预览侧 fenced code 语法高亮（``` 带语言标注的块）。
**不在本次：** 编辑器（textarea）侧源码着色（mirror-div 架构级改动）/ 行号/复制按钮等代码块 chrome / inline code 着色。

---

## 2. 张力

### 张力 A — 高亮库的输出形态决定主题切换成本
inline-style 输出（shiki）= 主题切换需全量重渲染 + style 属性过 sanitize；class-based 输出（highlight.js/prism）= CSS 变量跟随浅深色零重渲染、span+class 过默认 DOMPurify 无需放宽。

### 张力 B — 语言包体积
全量语言 ≈ 190+；按需动态注册复杂且首次渲染闪烁。common 子集（~37 常用语言）单 chunk 懒加载是体积/覆盖的平衡点。

---

## 3. 待确认项（TBD-v23-x）

### TBD-v23-1 — 高亮库选型〔ADR-019〕
- **(a) highlight.js 11.11.1 `lib/common`**：class-based 输出（span+class，过默认 sanitize 不放宽）+ 自绘 ~15 条 token CSS（变量跟随浅深色，主题切换零重渲染）〔AI 倾向〕
- (b) shiki：质量最高但重（textmate 语法 + inline style + 主题切换重渲染 + style 属性进 sanitize 面）
- (c) prismjs：体积小但维护节奏慢、动态语言加载繁琐

### TBD-v23-2 — 语言集
- **(a) `lib/common` 子集（~37 常用语言）单 lazy chunk**〔AI 倾向：覆盖日常 95%+，未注册语言降级为无色等宽（现状）〕
- (b) 按语言动态注册（每语言一请求，复杂 + 闪烁）

### TBD-v23-3 — 无语言标注 / 未知语言的 fence
- **(a) 不高亮（保持现状无色等宽）**〔AI 倾向：highlightAuto 自动检测 CPU 重 + 误判率高〕
- (b) highlightAuto 自动检测

### TBD-v23-4 — 加载时机
- **(a) 文档含「带语言标注的 fence（非 mermaid）」才懒加载（hasCode 启发式，KaTeX hasMath 范式；误判最坏 = 多加载一次无害）**〔AI 倾向〕
- (b) 首次渲染任何文档就加载

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 delta（+highlight）| §M2 |
| **ADR-019** | 库选型 + 注入点（markdown-it `highlight` 选项闭包，hljs 未载返 '' 降级）+ 安全（输出过默认 DOMPurify 不放宽）+ chunk/precache 策略 | L2 |
| api-spec delta | pipeline +`hasCode` / `ensureHighlight` / `highlightReady`（KaTeX 三件套同构）| 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`已知语言着色 × 未知语言降级 × 无标注降级 × mermaid fence 不受影响 × XSS（恶意代码内容不逃逸）× 主题切换样式跟随` | 覆盖 |

---

## 5. 验收条件（v2.3 新增 AC）

- AC-v23-1：```js 等常用语言 fence → 预览出现着色 span（hljs-* class）
- AC-v23-2：未知语言 / 无标注 fence → 无色等宽（现状不变，不报错）
- AC-v23-3：```mermaid 仍走图渲染路径，不被高亮拦截
- AC-v23-4：**XSS 门槛**：恶意代码内容（`<script>`/`onerror`/`javascript:` 注入）经高亮后仍被 sanitize 剥离，无 alert（双引擎 e2e，AC-v14-3 同款）
- AC-v23-5：高亮库为 lazy chunk，首屏体积不增（size 闸守）
- AC-v23-6：浅深色主题切换 → 代码配色即时跟随（无重渲染等待）
- AC-v23-7：既有行为零回归（KaTeX/Mermaid/滚动同步/防抖）

> 安全面：hljs 输出 span+class，走 render() 既有 DOMPurify 默认严格配置，**不放宽 allowlist**（ADR-002 红线；AC-v23-4 e2e 守）。
