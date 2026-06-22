# ADR-032 — 文本高亮/标记：markdown-it-mark/ins 并入扩展链

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-22：D1=mark/ins 并入 ensureExtensions / D2=hasExtension 加 `==`/`++` / D3=不放宽 sanitize）|
| **Date** | 2026-06-22 |
| **Decider** | FE (Corray，共识 v3.6 TBD 全拍) |
| **Context** | 共识 v3.6 / ADR-030（ensureExtensions 链）/ ADR-031（callout 同链）|

## D1 — mark/ins 并入 ensureExtensions（TBD-v36-1a/2a）

applyExtensions 插件链 +`markdown-it-mark`（`==x==`→`<mark>`）+`markdown-it-ins`（`++x++`→`<ins>`）；并入既有 lazy chunk，首屏不含。

## D2 — hasExtension 加 `==`/`++`（懒加载触发）

`hasExtension` 正则加 `==[^=]` / `\+\+[^+]` 分支。误判最坏多加载一次（katex 范式）。

## D3 — 安全（不放宽 sanitize）

`<mark>/<ins>` DOMPurify 默认放行（标准标签）；经 render() sanitize；ADD_ATTR 不动（ADR-002）。AC-v36-5 XSS e2e 双引擎守。

## Consequences

- api-spec delta：ensureExtensions +mark/ins；hasExtension `==`/`++`
- 新依赖：markdown-it-mark@4.0.0 / markdown-it-ins@4.0.0（+ 本地 ambient 类型声明）
- CSS：沿用浏览器默认 `<mark>`（黄底）/`<ins>`（下划线）；可选轻调
- test-plan delta：mark × ins × 降级 × XSS × 首屏不含
- 删除线 `~~` 是 markdown-it 核心，不受影响
