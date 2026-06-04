# FB-006 — hash-routing 功能的 Playwright 测试 / 验证必须冷加载

| 字段 | 值 |
|------|----|
| **date** | 2026-06-04 |
| **status** | candidate |
| **severity** | low |
| **occurrences** | 2（同项目同会话：e2e + 线上眼验）|
| **category** | meta |
| **skills** | (testing / playwright) |
| **modules** | (all) |

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

## related

- **PP-003** `docs/problems/project-patterns.md` trap #5（项目内 tendency 视角）
- **F-V12-4** `docs/audit/findings-registry.md`（app 侧未监听 hashchange，LOW deferred）
- **FB-005**（同为 Playwright 测试陷阱家族，但根因不同——那是 worker 竞争）

## 升级路径

- **当前**：candidate；同项目二次复发（e2e + 线上验证两面）
- **observing**：第 2 个 hash-routing + Playwright 项目复现 → occurrences 升
- **applied**：standard Playwright 指南补"hash-routing 冷加载"段 → 标 applied
- **verified**：applied 后新项目首次测 hash 功能即避坑（不再误判）→ verified
