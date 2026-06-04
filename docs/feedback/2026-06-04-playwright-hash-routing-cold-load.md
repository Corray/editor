# FB-006 — hash-routing 功能的 Playwright 测试 / 验证必须冷加载

| 字段 | 值 |
|------|----|
| **date** | 2026-06-04 |
| **status** | candidate |
| **severity** | low |
| **occurrences** | 4（同项目同会话：① e2e hash 导航 ② 线上眼验 hash 导航 ③ 线上眼验破缓存 ④ 眼验 console 干净——同属"验证方式错→误判"家族）|
| **category** | meta |
| **skills** | (testing / playwright) |
| **modules** | (all) |

> **scope（2026-06-04 v0.5.0 补）：** 本 FB 起于 hash-routing 冷加载（下文主体），但根因元模式更宽——**线上眼验 / Playwright 验证的导航与缓存陷阱，让正常功能或已生效修复被误判**。见文末「§同源姊妹教训」两条：眼验破缓存、眼验 console 干净。三者共享同一防御直觉：**看到"不生效"先质疑验证方式，再质疑被测物**。

---

## 现象

应用在**启动时**读取 `location.hash`（或任何 URL 片段状态）来驱动功能——如 v1.2 的 URL 分享 `#doc=<payload>`：冷加载时解析 hash、加载内容。

这类功能**只在整页加载（document load）时执行 startup**。从一个**已加载的同源页**导航到只有 hash 不同的 URL（`page.goto('/app/#x')` 当前已在 `/app/`，或地址栏改 hash）是**同文档导航**——只触发 `hashchange` 事件、**不重新加载文档、不重跑 startup**。结果：hash 驱动的功能"看起来不生效"，但**实为测试/验证方式错**，不是功能 bug。

最危险的后果：**误判为线上 prod bug**——验证者看到"打开分享链接编辑器是空的"，差点把正常功能当成线上故障上报。

## 实证

- **项目**：`editor`（github / FE / Vite + Solid + Playwright）
- **二次复发（同会话 2026-06-04）**：
  1. **e2e**：`page.goto('/editor/#doc=...')` 紧跟 `beforeEach` 的 `page.goto('/')`（已在 `/editor/`）→ 同文档 hash 变更 → app 不重读 hash → `toHaveValue` 收到空 → 失败。修：`goto(hashUrl)` 后补 `page.reload()` 强制整页加载。
  2. **线上眼验**：`browser_navigate('https://.../editor/#doc=...')` 从 base `/editor/` 页过去 → 同文档导航 → 编辑器空 → **一度误判 prod bug**。正确复现真实用户（点链接 = 冷加载）：先 `about:blank` → 再 hashUrl，一次即对（内容加载 + replaceState 清 hash）。
- **根因确认**：HTML5 history / fragment 导航语义——仅 hash 变化的同文档导航不触发 `load`，SPA 的 `main`/bootstrap 不重执行。

## 根因（确认，非推断）

同文档 fragment 导航（only-hash-change）不重新执行页面脚本。任何"启动时一次性读 hash"的逻辑，在这种导航下不会运行。测试/验证若从已加载页改 hash，等于没触发被测路径。

## Remediation 建议

### 1. 测试模板 / SOP（推荐）
standard 的 Playwright 测试指南增补"hash-routing 功能"段：

````markdown
**测启动读 location.hash 的功能（hash-routing / URL 分享）必须冷加载：**
- ❌ `await page.goto('/app/#state')`  // 若已在 /app/ → 同文档，startup 不重跑
- ✅ `await page.goto('/app/#state'); await page.reload();`  // 整页加载带 hash
- ✅ 或从空白页进：`await page.goto('about:blank'); await page.goto('/app/#state');`

线上/手动眼验同理：用新标签 / 冷导航打开带 hash 的链接，**绝不**从已开页改地址栏 hash。
看到"hash 功能不生效"——先排除同文档导航，再怀疑功能本身。
````

### 2. app 侧（可选，按需）
若产品要支持"已开页粘贴分享链接到地址栏"，app 需监听 `hashchange` 再加载（本项目记为 LOW finding，未做——真实场景=点链接冷加载不受影响）。

## scan_when

- 写/测任何 hash-routing / URL-state-at-startup 功能时
- 线上眼验 hash 驱动功能时（必须冷加载复现）
- 看到"URL 片段功能不生效 / 编辑器空 / 状态没还原"且 URL 含 hash 时——先查是否同文档导航
- **部署修复后线上眼验时**——破缓存（§姊妹教训 1）
- **任何线上 / e2e 眼验收尾时**——查 console 截零（§姊妹教训 2）

## §同源姊妹教训（2026-06-04 v0.5.0 眼验补）

主体（hash-routing 冷加载）的根因是"验证导航方式错 → 误判被测物"。同会话 v0.5.0 又踩两个**同元模式**的坑，一并沉淀：

### 1. 线上眼验改完要破缓存，否则验到旧资源

- **现象**：部署 CSP 修复后线上眼验，`browser_navigate('https://.../editor/')` 仍报**旧** console 错（"font-src was not explicitly set"）→ 一度疑"修复没部署/没生效"。`curl` 线上 `index.html` 实测已是新版（含 `font-src 'self' data:`）。根因 = **浏览器 HTTP-cache 旧 index.html**。
- **修**：眼验破缓存——`browser_navigate('https://.../?cb=<变化值>')`（query 变化强制重取文档）/ 或先 `curl` 比对线上资源确认部署到位再眼验。
- **铁律**：重新导航仍报旧错 → **先怀疑浏览器缓存，别先归因部署失败**。与主体同源：缓存导致"验到的不是最新被测物"。

### 2. 眼验固定检查项必含"console 干净"，不只"功能渲染出来"

- **现象**：v0.4.0 引入 KaTeX 时 CSP 缺 `font-src` → 1 个内联字体被拦的 console 红字，因眼验只确认"公式渲染出来了"未查 console，**漏过 v0.4.0 + v0.5.0 两版**，到 v1.4 眼验才 surface（F-V13-4）。
- **修**：眼验 checklist 固定一步——**console error/warning 截零**；红字即便不阻断功能也要定性（记 finding 或当场修），不许"看着能用就过"。
- **元教训**：功能正常 ≠ 验证充分。眼验的"看"必须包含 console，不只视觉渲染。

## related

- **PP-003** `docs/problems/project-patterns.md` trap #5（hash 冷加载）/ #6（眼验破缓存）/ #7（眼验 console 干净）——项目内 tendency 视角
- **F-V12-4** `docs/audit/findings-registry.md`（app 侧未监听 hashchange，LOW deferred）
- **F-V13-4** `docs/audit/findings-registry.md`（§姊妹教训 2 的具体 finding：CSP font-src 缺失，眼验 console 漏检 2 版，已 resolved）
- **FB-005**（同为 Playwright 测试陷阱家族，但根因不同——那是 worker 竞争）

## 升级路径

- **当前**：candidate；同项目同会话 4 次复发（hash e2e / hash 线上 / 破缓存 / console 干净——同元模式"验证方式错→误判"）
- **observing**：第 2 个 Playwright 项目复现任一姊妹教训 → occurrences 升
- **applied**：standard Playwright 指南补"**线上眼验认知陷阱**"段（hash 冷加载 + 部署后破缓存 + console 干净三件套）→ 标 applied
- **verified**：applied 后新项目首次眼验即避坑（不再误判功能/部署，不漏 console）→ verified
