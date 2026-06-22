# ADR-031 — callout 容器块：markdown-it-container 并入扩展链

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-22：D1=container 4 类并入 ensureExtensions / D2=hasExtension 加 ::: / D3=自定义标题 escapeHtml / D4=不放宽 sanitize）|
| **Date** | 2026-06-22 |
| **Decider** | FE (Corray，共识 v3.5 TBD 全拍) |
| **Context** | 共识 v3.5 / ADR-030（ensureExtensions 懒加载链）/ ADR-002 |

## D1 — 4 类 container 并入 ensureExtensions（TBD-v35-1a/2a）

`ensureExtensions` 的 applyExtensions 加 markdown-it-container × 4（note/tip/warning/danger），每类自定义 render：
- nesting 1（开）→ `<div class="callout callout--{type}"><div class="callout__title">{label}</div>`
- nesting -1（闭）→ `</div></div>`
- 并入既有链（emoji/footnote/sub/sup）→ 同一 lazy chunk，首屏不含

## D2 — hasExtension 加 `:::` 检测（懒加载触发）

`hasExtension` 正则加 `:::[a-z]` 分支 → 含 callout 触发 ensureExtensions（katex 范式）。

## D3 — 自定义标题（TBD-v35-3a）

container info 串 = `note 自定义标题`：render 剥类型名 → 剩余为标题；空 → `t('callout.{type}')` i18n 类型名。标题 `md.utils.escapeHtml`（用户内容）。

## D4 — 安全（不放宽 sanitize）

- `<div class>` + 标题 escapeHtml + 内部正常 markdown（经 render() DOMPurify）；div/class 默认放行；ADD_ATTR 不动（ADR-002）
- AC-v35-6 XSS e2e 双引擎守

## Consequences

- api-spec delta：pipeline ensureExtensions +container 配置；hasExtension `:::`
- i18n：`callout.note/tip/warning/danger`（zh+en，默认标题）
- 新依赖：markdown-it-container@4.0.0（+ 本地 ambient 类型声明）
- CSS：`.callout--{type}` 4 色（左边框 + 浅背景，浅深色变量）
- test-plan delta：4 类渲染 × 自定义/默认标题 × 内部 markdown × 未知类型 × XSS × 首屏不含
- 已知限制：默认类型名标题用 t() 在 render 期取值 → 语言切换不重渲染 callout 标签（仅文本变更时更新，F-finding）
