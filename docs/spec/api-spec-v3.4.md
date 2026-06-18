# 接口设计 v3.4 delta — markdown 扩展包

> **基线：** 共识 v3.4（accepted）+ ADR-030。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.4 | 2026-06-18 | pipeline hasExtension/ensureExtensions/extensionsReady（懒加载 emoji/footnote/sub/sup） |

---

## 1. M2 pipeline 扩展（ADR-030）

```ts
/** 文本是否含扩展语法（emoji :x: / 脚注 [^x] / sub ~x~ / sup ^x^）→ 决定懒加载。 */
export function hasExtension(markdown: string): boolean;
/** 已加载？（PreviewArea 决定加载完是否 re-render）。 */
export function extensionsReady(): boolean;
/** 一次性懒加载 4 插件 + applyExtensions(baseMd + katexMd?)，memoized。 */
export function ensureExtensions(): Promise<void>;
// 内部 applyExtensions(md)：md.use(emoji.full).use(footnote).use(sub).use(sup)；每实例一次
// ensureKatex 创建 katexMd 后若扩展已载 → applyExtensions(katexMd)（对称协同）
```

## 2. PreviewArea 集成

- html memo：`if (hasExtension(text) && !extensionsReady()) ensureExtensions().then(bump extVer)`（katex/hljs 同构）
- extVer signal 触发重渲染

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| pipeline hasExtension/ensureExtensions/extensionsReady + applyExtensions 双实例同步 | ✓ | `586b66a` |
| ensureKatex 协同 applyExtensions(katexMd)（对称，无双注册）| ✓ | `586b66a` |
| PreviewArea extVer 集成（katex/hljs 同构）| ✓ | `586b66a` |
| 依赖 emoji@3.0.0/footnote@4.0.0/sub@2.0.0/sup@2.0.0 + 4 插件类型声明（vite-env.d.ts）| ✓ | `586b66a` |
| 沿用浏览器默认 sub/sup/footnote 样式（无新 CSS）| ✓ | `586b66a` |

> 测试：unit +8（CT-EXT：启发式/降级/emoji/未知/脚注/sub-sup/XSS/零回归）→ 330；e2e +2 用例双引擎（ac27，含 XSS 门槛）→ 190+4skip。首屏 96.00KB（emoji chunk lazy 未进首屏）；precache 1570→1654KB。
