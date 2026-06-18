# ADR-030 — markdown 扩展包：emoji/脚注/上下标 懒加载

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-18：D1=四插件懒加载 / D2=applyExtensions 双实例同步 / D3=hasExtension 启发式 / D4=不放宽 sanitize）|
| **Date** | 2026-06-18 |
| **Decider** | FE (Corray，共识 v3.4 TBD 全拍) |
| **Context** | 共识 v3.4 / ADR-007 KaTeX 懒加载范式 / pipeline（baseMd + katexMd 双实例）/ ADR-002 |

## D1 — 四插件懒加载（TBD-v34-1a/2a/3a）

`ensureExtensions()`：动态 import `markdown-it-emoji`（具名 `full`）+ `markdown-it-footnote`/`sub`/`sup`（`.default`），memoized（katex/mermaid/hljs 范式）。首屏不含（emoji data ~50KB 进 lazy chunk，保 size 闸 / 张力 A）。

## D2 — applyExtensions 双实例同步（关键）

pipeline 有 baseMd + katexMd 双实例。扩展插件 `.use()` **mutate 实例**，每实例只应用一次：
- `ensureExtensions()` resolve 后 `applyExtensions(baseMd)` + 若 katexMd 存在 `applyExtensions(katexMd)`
- `ensureKatex()` 创建 katexMd 后，若扩展已载 `applyExtensions(katexMd)`
- 两加载器对称协同：无论谁先，每实例恰好应用一次（无双注册）

## D3 — hasExtension 启发式（懒加载触发）

`hasExtension(text)`：`/:[a-z0-9_+-]+:|\[\^[^\]]+\]|~[^~\s]+~|\^[^\^\s]+\^/`（emoji/脚注/sub/sup）。误判最坏 = 多加载一次（无害，katex hasMath 范式）。PreviewArea：`hasExtension && !extensionsReady()` → ensureExtensions → bump extVer 重渲染。

## D4 — 安全（不放宽 sanitize / TBD 安全门槛）

- emoji 渲染 Unicode 字符（安全）；footnote 渲染 `<sup>/<a href="#fn">/<section>/<ol>`、sub/sup 渲染 `<sub>/<sup>`——均 DOMPurify 默认放行（标准标签）
- 经 render() 既有 DOMPurify；ADD_ATTR 仍仅 data-source-line（**ADR-002 红线不动**）
- AC-v34-6 XSS e2e 双引擎守

## Consequences

- api-spec delta：pipeline hasExtension / ensureExtensions / extensionsReady（katex 三件套同构）+ applyExtensions 内部
- 新依赖：markdown-it-emoji@3.0.0 / footnote@4.0.0 / sub@2.0.0 / sup@2.0.0（research-first：npm 最新版核实）
- test-plan delta：emoji × 脚注 × sub/sup × 未载降级 × XSS × 首屏不含
- 无 data-model
- SW precache：扩展 chunk 进 precache（离线可用，同 katex/hljs）；build 后核体积
