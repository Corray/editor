# Findings Registry

所有审查发现的统一索引。每条发现有唯一编号，追踪从发现到处置的全生命周期。

**首次初始化**：YYYY-MM-DD

---

## 编号空间约定

每个 audit phase 用独立编号前缀（项目可自定，建议规则）：

| Phase | 编号前缀 | 例 |
|-------|--------|----|
| Spec | `GAP-NNN` | GAP-001 |
| API | `API-NNN` 或 `API-<MODULE>-NNN` | API-001 / API-LLM-001 |
| Behavior | `BHV-NNN` | BHV-001 |
| Architecture | `ARCH-NNN` | ARCH-001 |
| Integration | `F-INT-NNN` | F-INT-001 |
| Data Model | `F-DM-NNN` | F-DM-001 |
| Issue Process | `IPR-NNN` 或 `IPR-T-NNN` (trend) | IPR-001 / IPR-T-001 |
| Code-Doc Gap | `GAP-CDG-NNN` | GAP-CDG-001 |
| Rule Coverage | `RC-NNN` | RC-001 |

---

## 状态枚举

| 状态 | 含义 |
|------|------|
| `proposed` | 新发现，待 review 确认 |
| `confirmed` | 已确认有效，进入处理 |
| `fixing` | 处理中（有对应 handoff / Issue / commit）|
| `resolved` | 已解决，有证据（commit / artifact）|
| `dismissed` | 排除（误报 / 测试噪声 / 范围外，需 reason）|
| `deferred` | 已确认但推迟（需触发条件）|
| `merged` | 合并到另一条（需 merged-into 引用）|
| `escalated` | 升级（严重度 / 重新分类 / 改编号）|

---

## 维护规则

- 每次 audit 产出新 finding → 在此追加条目（status=proposed）
- 状态变更时同步本文件 + 原 audit 报告末尾追加勘误（audit 报告 immutable）
- 编号一旦分配，不可重用、不可重号

---

## 条目（按 phase 分组）

### Spec 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| GAP-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 LayoutAPI 完整实现（createLayout + matchMedia reactive + mobile tabs UI）| #12 commit `a9fc822` |
| GAP-002 | 2026-05-20 | **resolved** (#14) | LOW | `getRootElement` 零消费方（M4 #9 已绕过）→ 删声明（PreviewAPI + api-spec §3.2 + 5.5 流程图）消除契约/实现 drift；未来按需连消费方补回 | #14 commit `b7ef028` |
| GAP-003 | 2026-05-20 | **resolved** (#15) | LOW | F1.2 行号 gutter + F1.3 字号 A-/A+ 三档实现（EditorPrefsAPI + localStorage 持久化）| #15 commit `6bc2977` |
| GAP-004 | 2026-05-20 | **resolved** (#11) | MEDIUM | 清空按钮 + confirm 实现 + E2E-AC2-002 unskip 通过 | #11 commit `fec015b` |

### API 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| API-M5-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 api.ts / LayoutAPI 完整实现 | #12 commit `a9fc822` |
| API-T-001 | 2026-05-20 | **resolved** (#14) | LOW | shared/toast console stub → 真 DOM UI（lazy-mount container + 自动消失 + enter/leave 动画 + aria-live polite，无 lib，接口冻结不变）；7 单测 | #14 commit `b7ef028` |

### Behavior 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| BHV-001 | 2026-05-20 | **resolved** (#10) | HIGH | E2E 全集未跑 → chromium + webkit 跑通（21 pass / 7 skip / 0 fail）；mobile-safari emulation 不稳定单列 BHV-004 | audit §3；#10 commit `f03e170` |
| BHV-004 | 2026-05-20 | **resolved** (#15) | LOW | mobile-safari page.goto 30s 超时随 Playwright 1.43→1.60 升级消失；移除 AC4-003 chromium-only skip → 在 webkit + isMobile context 跑通（真 webkit-mobile 覆盖）；dead mobile-safari project config 清理 | #15 commit `20ad1c5` |
| BHV-002 | 2026-05-20 | **resolved** (#12) | MEDIUM | AC-4 mobile tab UI 实现 + E2E-AC4-002 / 003 unskip 通过 | #12 commit `a9fc822` |
| BHV-003 | 2026-05-20 | **resolved** (#15) | LOW | perf bench 一次性跑通并记基线（docs/perf/baseline-v0.1.0.md）：Lighthouse 92 / input→preview 34ms / bundle 64.26KB gz，三项全过预算；deploy.yml 加 bundle-size CI 闸（`pnpm size`）+ E2E-AC5-002 延迟实测。Lighthouse CI 仍按 TBD-T1 留 v1.1 | #15 commit `13a7dce` |
| BHV-005 | 2026-06-02 | **resolved** (#15) | MEDIUM | **GAP-003 回归**：header 加 A-/A+/# 3 按钮后 7 按钮在 320px 不换行 → document 横向溢出（破 AC-4-001）；BHV-004 跑 e2e 时捕获（GAP-003 当时只跑 unit+desktop visual 漏 e2e）。修：`.header-actions { flex-wrap: wrap }` | #15 commit `eac71bb` |
| BHV-006 | 2026-06-03 | **resolved** | LOW | 字号边界无反馈。**rc.2 `5975561`**：canIncrease/canDecreaseFontSize 访问器 + A−/A+ disabled 态 | 2026-06-03 增量 audit |
| BHV-007 | 2026-06-03 | deferred (v1.1) | LOW | 行号 toggle off→on 时若 textarea 已滚动，gutter 从 scrollTop 0 起，下次 scroll 才同步 → 短暂错位 | 2026-06-03 增量 audit |
| BHV-008 | 2026-06-03 | **dismissed**（2026-06-09 压测）| LOW | gutter 每逻辑行 1 DOM 节点放大大文档成本（静态推断）。**压测推翻**：5000 行/374KB 文档 gutter ON 378ms vs OFF 374ms（等价，5000 节点成本可忽略）→ gutter 非瓶颈。详见 `docs/perf/stress-2026-06-09-large-dataset.md` §1 | 2026-06-03 增量 audit / 2026-06-09 压测 |
| BHV-008' | 2026-06-09 | **resolved**（压测浮现）| MEDIUM | （BHV-008 压测浮现真问题）大文档 preview `html` memo 直接订阅 text() → 每键**同步全量重渲染** render()（markdown-it+DOMPurify），~10KB 处即破一帧，374KB 每键卡死。**修复 `9ba4b1d`**：PreviewArea 大文档/含 mermaid → render 防抖 120ms（小文档仍即时）；374KB 真实增量打字 ~1341ms/键 → 17ms/键。测试 CT-M2-DEBOUNCE-1/2/3。详见 perf 压测 §2 | 2026-06-09 压测 / 修复 `9ba4b1d` |
| BHV-009 | 2026-06-03 | **resolved** | LOW | toast a11y。**rc.2 `5975561`**：error/warn → role=alert + aria-live=assertive；info 走容器 polite | 2026-06-03 增量 audit |
| BHV-010 | 2026-06-03 | **resolved** | LOW | F1.2 行号 / F1.3 字号 / toast 无 e2e 验收覆盖。**v0.9.1 补 ac13 e2e**（行号 toggle / 字号档位 / 复制 toast，双引擎）`a0efd2c` | 2026-06-03 增量 audit |

### v1.1 增量审查（2026-06-04 / 报告 `2026-06-04-v1.1-increment.md`）

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| F-V11-1 | 2026-06-04 | **resolved** | MEDIUM | `loadStoredDocument` IDB 读错静默降级 → 显空 + 潜在覆盖丢数据。修：拆 get/migration catch，读错 console.error + storage.loadError toast，不裸吞；UT-MIG-006 | tag 前修 / commit `c26d1db` |
| F-V11-2 | 2026-06-04 | **resolved** | LOW | `_storage.ts` resetStorage `open('editor')` 无 version 竞争可建无 store DB。修：`open(1)+onupgradeneeded` 建 kv，schema-safe | commit `c26d1db` |
| F-V11-3 | 2026-06-04 | **resolved** | LOW | （旗舰/F-V11-1 家族漏网）静默路径经 v1.6 重构迁到 M9 用户操作 fire-and-forget store 写。**v0.9.1 加 guardStore**（log+toast，saveActiveText 仍由 M3 接管）+ family scan 确认仅此处 `a0efd2c` | 2026-06-04 audit |
| F-V11-4 | 2026-06-04 | deferred (v1.1.x) | LOW | 每次加载 hydrate 触发冗余 write-back（幂等无害，status 抖动）| 2026-06-04 audit |
| F-V11-5 | 2026-06-04 | **resolved** | LOW | `storage.unavailable` 死 key。**v0.9.1 复用**为 guardStore 通用 store 错误提示（不再死）`a0efd2c` | 2026-06-04 audit |
| F-V11-6 | 2026-06-04 | deferred (v1.1.x) | LOW | performWrite 异步写理论可重叠（status 短暂错乱，极边缘）| 2026-06-04 audit |

### v1.2 增量审查（2026-06-04 / 报告 `2026-06-04-v1.2-increment.md`）

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| F-V12-1 | 2026-06-04 | deferred (v1.2.x) | LOW | 篡改的空 payload `#doc=1.` 解码为 ''，本机有文档时 confirm→accept 清空（合法分享链不会空 payload，手工篡改边缘）| 2026-06-04 audit |
| F-V12-2 | 2026-06-04 | **resolved** | LOW | 导入不校验类型→二进制乱码。**v0.9.1 加 looksBinary**（NUL / >10% U+FFFD）→ 拒绝 + toast import.notText `a0efd2c` | 2026-06-04 audit |
| F-V12-3 | 2026-06-04 | deferred (v1.2.x) | LOW | clipboard 不可用时 share 仅 toast 失败，无"手动复制 URL"fallback（URL 已构建）| 2026-06-04 audit (UX) |
| F-V12-4 | 2026-06-04 | deferred (v1.2.x) | LOW | app 未监听 hashchange：在**已开页**地址栏粘贴分享链接（同文档 hash 变更）不触发加载，需手动 reload。真实场景（点链接=冷加载）不受影响；边缘。线上眼验/e2e 二次踩此同文档陷阱（已落 PP-003 #5）| 2026-06-04 线上眼验 |

### v1.3 增量审查（2026-06-04 / 报告 `2026-06-04-v1.3-increment.md`）

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| F-V13-1 | 2026-06-04 | deferred (v1.3.x) | LOW | katex CSS 未懒加载：vite `cssCodeSplit:false` 把动态 import 的 katex CSS 打进首屏 style.css（1.7→9.48KB gz）。偏离 TBD-v13-4；首屏 76.66KB <150 非阻塞。修需翻 cssCodeSplit:true | 2026-06-04 audit |
| F-V13-2 | 2026-06-04 | deferred (v1.3.x) | LOW | `hasMath` 启发式正则 ≠ katex tokenizer，理论上漏判真公式 → katex 不加载 → 卡 raw（常见用例已测，exotic 未穷举）| 2026-06-04 audit |
| F-V13-3 | 2026-06-04 | deferred (v1.3.x) | LOW | size 闸改"首屏"后不再防 lazy chunk 膨胀（katex chunk 多大都不计）；建议补 total-dist 软上限提示 | 2026-06-04 audit |
| F-V13-4 | 2026-06-04 | **resolved** | LOW | **线上眼验发现**：index.html CSP `default-src 'self'` 无 `font-src` → Vite 内联（<4096B）的 1 个 KaTeX 字体（data:font/woff2）被 CSP 拦截（线上 console error）。20 字体中 19 个 self-hosted 不受影响，仅该 1 个 family 回退系统字体（cosmetic，公式仍渲染）。v0.4.0 起存在，v1.4 眼验时 surface。**修复 `31ba5c7`**：CSP 加 `font-src 'self' data:` + 内联 SVG favicon（顺带消 favicon 404）；线上 cache-bust 复验 console 0 error，`\mathcal`/`\mathfrak` 字体正常渲染 | 2026-06-04 v0.5.0 线上眼验 |
| F-V14-1 | 2026-06-04 | **resolved**（2026-06-09 压测）| LOW | mermaid 每次 text 变重渲染（重置占位 + `mermaid.render` 实际执行）→ CPU 浪费 + 闪烁。**压测**：同步延迟仅 +3ms（有图 9ms vs 无图 6ms）→ 延迟假设推翻；但闪烁/CPU 属实。**修复 `9ba4b1d`**：BHV-008' 防抖条件含 mermaid 即防抖 → 连续打字不重发占位，顺带消除闪烁+重复异步渲染。详见 perf 压测 §3 | 2026-06-04 audit / 2026-06-09 压测 / 修复 `9ba4b1d` |
| F-V14-2 | 2026-06-04 | deferred (v1.4.x) | LOW | SVG XSS 仅 e2e 覆盖（jsdom 无法真渲染 mermaid，PP-003 家族）→ 安全门槛无单测 backstop | 2026-06-04 audit |
| F-V14-3 | 2026-06-04 | deferred (v1.4.x) | LOW | 主题切换不重渲染已存图。**rc.2 重评估仍 defer**：正确修需 regenerate placeholders(SVG 已替换)，触 mermaid 异步+XSS 门槛路径，风险>价值 | 2026-06-04 audit |
| F-V15-1 | 2026-06-05 | **resolved** | MEDIUM | PWA precache 82 entries/**3.7MB**：globPatterns `**/*.js` 全量 precache mermaid 所有 diagram 子 chunk。**修复 `551c28d`**：chunkFileNames 按名路由 mermaid 生态 chunk→`assets/mmd/`，globIgnores + runtimeCaching(CacheFirst, cache-on-use)；app+katex 仍 precache（离线公式始终可用），mermaid 图按用过的离线可用。**precache 3.7MB→1.18MB（−68%）**；离线 e2e 实证（含 app 离线加载无误路由 + 图 cache-on-use）| 2026-06-05 v1.5 audit |
| F-V15-2 | 2026-06-05 | **resolved** | LOW | globPatterns precache 可能永不用资源 → 同 `551c28d` globIgnores assets/mmd/ 修复 | 2026-06-05 audit |
| F-V15-3 | 2026-06-05 | proposed | LOW | AC-v15-4 更新提示仅单测 mock 覆盖，无真实"两次部署"e2e（test-plan §3 声明难模拟）；线上眼验可补 | 2026-06-05 audit |
| F-V15-4 | 2026-06-05 | proposed | LOW | AC-v15-5 可安装性仅验 manifest link 存在；字段完整性/icon 可达/安装入口未自动断言（手验）| 2026-06-05 audit |
| F-V15-5 | 2026-06-05 | proposed | LOW (info) | workbox-window 进首屏 +0.84KB（prompt 模式必需，固有成本，可接受）| 2026-06-05 audit |
| F-V16-1 | 2026-06-05 | proposed | LOW (info) | 切换竞态：switchTo flush 后 M3 旧 debounce 计时未 cancel → 切换后或 fire 一次冗余 saveActiveText（no-op guard 兜住，无损）| 2026-06-05 v1.6 audit |
| F-V16-2 | 2026-06-05 | **resolved** | LOW | 无手动重命名（TBD-v16-5a）→ 多篇可能同标题（Untitled/同首行）辨识度低。**v1.8 解决 `c66c21e`**：M9 +rename（titleManual 锁）+ DocList 内联重命名 + 搜索过滤（ADR-012）| 2026-06-05 audit |
| F-V16-3 | 2026-06-05 | proposed | LOW | IDB 不可用（隐私模式）仅单文档 localStorage 降级；多文档 in-memory 不跨 reload（罕见，已 toast）| 2026-06-05 audit |
| F-V16-4 | 2026-06-05 | proposed | LOW | 多 tab 并发写 documents/activeDocId → last-write-wins，无 versionchange 协调（已知边界）| 2026-06-05 audit |
| F-V16-5 | 2026-06-05 | **dismissed**（2026-06-09 压测）| LOW | startup getAll 全量 doc 入内存，100+ 大文档成本（静态推断）。**压测推翻**：200 docs getAll 21ms / 1000 docs 102ms（一次性，可接受，远超个人草稿器现实用量）→ meta/text 懒加载在当前规模不值得。详见 perf 压测 §4 | 2026-06-05 audit / 2026-06-09 压测 |
| F-V17-1 | 2026-06-05 | proposed | LOW (info) | `#root min-height→height:100vh` 修潜伏布局（面板从不滚/整页滚，v1.7 前就在）；full e2e 79 无回归，但全局布局改动，移动/小屏边界留意 | 2026-06-05 v1.7 audit |
| F-V17-2 | 2026-06-05 | proposed | LOW | source-line 对齐到块顶，块内偏移不细调（长段落内滚动预览跳段首）| 2026-06-05 audit |
| F-V17-3 | 2026-06-05 | proposed | LOW | lineHeight 换算在长行软换行下偏差（视觉行≠逻辑行，scrollTop/lineHeight 高估行号）| 2026-06-05 audit |
| F-V17-4 | 2026-06-05 | proposed | LOW (info) | rAF 单帧反馈环窗口；极端高频 scroll 理论可能漏防一帧（未实测抖动）| 2026-06-05 audit |
| F-V18-1 | 2026-06-05 | **dismissed**（2026-06-09 压测）| LOW | 搜索 docs() 每 query 全量线性扫（含 text）includes（同 F-V16-5 家族）。**压测推翻**：200 docs 1–3ms/query / 1000 docs 5–20ms/query（真实规模无感，1000 边界仍 <1 帧多）→ 倒排索引在当前规模不值得。详见 perf 压测 §5 | 2026-06-05 v1.8 audit / 2026-06-09 压测 |
| F-V18-2 | 2026-06-05 | proposed | LOW (info) | 搜索仅过滤列表，不跳转/高亮匹配位置（共识范围内）| 2026-06-05 audit |
| F-V18-3 | 2026-06-05 | **resolved** | LOW | 重命名双击发现性低。**rc.2 `5975561`**：doc-list 加常显 ✎ 入口(mobile 无 hover 也可用) | 2026-06-05 audit |
| F-V18-4 | 2026-06-05 | proposed | LOW (info) | 搜索过滤后 active doc 可能不在结果中（仍 active + 编辑区显示，列表无高亮项）轻微不一致 | 2026-06-05 audit |
| F-V20-1 | 2026-06-08 | **proposed** | MEDIUM | supabase.ts 真后端**未运行时验证**（无真项目，按文档 API 写，mock 只验契约）→ 真 auth/同步行为未实证。pending 用户 provision 后线上验。**2026-06-09 review**：对照 supabase-js v2 官方文档逐点核查，修 R2（magic link `emailRedirectTo` 落 /editor/）+ R3（`getUser`→`getSession` 省每文档网络往返）文档可证缺陷（报告 `docs/audit/2026-06-09-supabase-impl-review.md`）；运行时验证仍 pending，状态不变 | 2026-06-08 v2.0 audit / 2026-06-09 review |
| F-V20-2 | 2026-06-08 | **proposed** | MEDIUM | **AC-v20-6 RLS 真隔离发布门槛未达**：mock 模拟 ≠ 真 RLS；须真项目跑 RLS SQL + 两用户线上验 + 人工审策略。**阻 v1.0.0**（故打 rc）。**2026-06-11 静态审**：门槛 ②"人工审策略"完成（报告 `docs/audit/2026-06-11-rls-schema-review.md`，11 项全过 / 4 操作 policy 齐全 / INSERT+UPDATE 双 WITH CHECK / 匿名全拒，2 info F-V20-8/9 不阻塞）；门槛 ①两用户线上验仍 pending provision，状态不变 | 2026-06-08 audit / 2026-06-11 静态审 |
| F-V20-3 | 2026-06-08 | proposed | LOW | magic link 回调（URL token）× `#doc=` 分享 hash 共存仅设计声明，未真浏览器验。**2026-06-09 review**：官方文档核实 supabase-js JS 默认 implicit → 回调 `#access_token` 与 `#doc=` 不会同 URL 出现（回调 URL 无 doc= / 分享 URL 无 token），**低危**；R1 决策保持 implicit（跨浏览器 magic link 友好）；仍需 provision 后验 detectSessionInUrl 清理 hash vs bootstrap 读 hash 时序 | 2026-06-08 audit / 2026-06-09 review |
| F-V20-4 | 2026-06-08 | proposed | LOW | LWW 跨设备时钟偏差误序（ADR-015 已声明 MVP 限制）| 2026-06-08 audit |
| F-V20-5 | 2026-06-08 | proposed | LOW (info) | 文档明文存云（无 E2EE）；仅 toast 提示，运维方可见 | 2026-06-08 audit |
| F-V20-6 | 2026-06-08 | proposed | LOW | 登录 UI 用 window.prompt 取 email（简陋，真云前可接受）| 2026-06-08 audit |
| F-V20-7 | 2026-06-08 | proposed | LOW (info) | push × focus-pull 理论竞争（LWW + pull-before-push 兜底，未压测）| 2026-06-08 audit |
| F-V20-8 | 2026-06-11 | proposed | LOW (info) | 全局 PK `id` 跨用户存在性 oracle / 抢注面（B 撞 A 的 id → RLS 拦写但报错可推断存在）。uuid v4 不可枚举 + id 不入公开渠道 → 实际不可利用；将来可复合 PK `(user_id, id)` 消除 | 2026-06-11 RLS 静态审 |
| F-V20-9 | 2026-06-11 | proposed | LOW (info) | `title`/`text` 无尺寸上限，已登录用户可写超大行（free 档存储滥用，单用户自害不扩散）。将来 `check(length)` 或靠配额 | 2026-06-11 RLS 静态审 |
| F-V21-1 | 2026-06-11 | proposed | LOW | AC-v21-7 undo 门槛仅 chromium 实证：Playwright WebKit textarea undo 全合并单步回基线（探针证实纯键入也合并 → 测试环境引擎特性，非实现缺陷）→ AC14-3b webkit skip（BHV-004 先例）；真 Safari 待手测或 Playwright 修复后 unskip | 2026-06-11 v2.1 audit |
| F-V21-2 | 2026-06-11 | proposed | LOW (info) | 查找导航期间 textarea 失焦不渲染选区高亮（浏览器行为）；反馈靠 n/m 计数+滚动，Esc 回焦后可见。富高亮 = mirror-div overlay 复杂度，defer（共识张力 A 已声明）| 2026-06-11 audit |
| F-V21-3 | 2026-06-11 | proposed | LOW (info) | execCommand deprecated 显式技术债（ADR-017 文档化 + TODO 标注 + fallback 就位 + e2e 双引擎守行为），登记备查无行动项 | 2026-06-11 audit |
| F-V21-4 | 2026-06-11 | proposed | LOW (info) | replaceAll 单次全文 insertText（一步 undo 设计），超大文档未压测；偶发操作非每键路径，defer | 2026-06-11 audit |
| F-V22-1 | 2026-06-11 | **fixing**（2026-06-12 加固）| LOW | E2E-AC15-2 webkit 预览联动 poll flake **二次复发**（2026-06-11 首现 + 2026-06-12 全量回归再现，均重跑过）→ 达复发阈值，加固 = poll 显式 10s（`c270057`）；环境噪声定性（负载下 rAF 链路慢），再复发则查 M10 attach 时序 | 2026-06-11 v2.2 audit / 2026-06-12 加固 |
| F-V22-2 | 2026-06-11 | proposed | LOW (info) | 大纲跳转滚动 × 用户即时手滚预览的 M10 双向短暂竞争（rAF 反馈环兜底，F-V17-4 家族）；未观察到实际异常 | 2026-06-11 v2.2 audit |
| F-V23-1 | 2026-06-12 | proposed | LOW (info) | hljs chunk（162KB raw）进 SW precache（katex 同策略，离线高亮可用）；precache 累计 1.57MB（较 F-V15-1 修订时 +33%），再有重 chunk 应重评 runtimeCaching 分流 | 2026-06-12 v2.3 audit |
| F-V23-2 | 2026-06-12 | proposed | LOW (info) | 自绘 9 组 token 映射较 hljs 官方主题粗（scope 归并），少数细分 token 沿用默认色；视觉打磨 defer | 2026-06-12 v2.3 audit |
| F-V24-1 | 2026-06-12 | proposed | LOW (info) | Tab 拦截 a11y 缓解 = Esc 放行一次 + 帮助面板文字说明；无 aria-keyshortcuts/读屏提示，深度 a11y 审计 defer | 2026-06-12 v2.4 audit |
| F-V24-2 | 2026-06-12 | proposed | LOW (info) | TOC 高亮仅随编辑器视口（拍定 TBD-v24-3a）；预览滚动不驱动（设计内）| 2026-06-12 v2.4 audit |
| F-V25-1 | 2026-06-12 | proposed | LOW (info) | 导出 HTML 的 KaTeX 样式依赖 CDN link（SRI 锁内容）；离线打开排版降级结构在（TBD-v25-3a 拍定取舍）| 2026-06-12 v2.5 audit |
| F-V25-2 | 2026-06-12 | proposed | LOW (info) | 移动编辑 tab 导出走降级源（mermaid 占位）；预览 tab/桌面保真。边缘文档化 | 2026-06-12 v2.5 audit |
| F-V25-3 | 2026-06-12 | proposed | LOW (info) | print 在移动编辑 tab 下预览未挂载 → 空内容；桌面正常。边缘 defer | 2026-06-12 v2.5 audit |
| F-V26-1 | 2026-06-15 | proposed | LOW (info) | 30 张 × 超大文档 ≈ 11MB/文档（IDB 配额内非无界）；快照 putSnapshot 失败目前静默（fire-and-forget），未来可加配额预警 | 2026-06-15 v2.6 audit |
| F-V26-2 | 2026-06-15 | proposed | LOW (info) | 自动快照间隔/上限硬编码（5min / 30），无用户设置；MVP 接受 | 2026-06-15 v2.6 audit |
| F-V26-3 | 2026-06-15 | proposed | LOW (info) | HistoryDialog 相对时间渲染时取一次 Date.now，长开不刷新（粗粒度可接受）| 2026-06-15 v2.6 audit |
| F-V26-4 | 2026-06-15 | proposed | LOW (info) | lastSnap 内存缓存跨 tab 不共享 → 多 tab 并发写同文档可能略超间隔产近重复（F-V16-4 家族，多 tab 边缘）| 2026-06-15 v2.6 audit |
| F-V27-1 | 2026-06-17 | proposed | LOW (info) | 工具栏 glyph 用 Unicode 字符非图标字体（🔗 emoji 随系统渲染）；视觉打磨 defer | 2026-06-17 v2.7 audit |
| F-V27-2 | 2026-06-17 | proposed | LOW (info) | 行前缀 toggle「部分带→补齐为全加」无第三档部分态；与 B/I 直觉一致，MVP 接受 | 2026-06-17 v2.7 audit |
| F-V28-1 | 2026-06-17 | proposed | LOW (info) | 表格无列宽对齐美化（textarea 等宽下管道符不齐）；功能性导航优先，共识范围外 | 2026-06-17 v2.8 audit |
| F-V28-2 | 2026-06-17 | proposed | LOW (info) | 非 `\|` 起头表格变体不被 isTableRow 识别 → 单元格导航不生效（罕见写法，文档化）| 2026-06-17 v2.8 audit |
| F-V28-3 | 2026-06-17 | proposed | LOW (info) | 单元格导航选中 trim 后文本，含前后多空格时光标定位到 trim 边界（视觉略差）；可接受 | 2026-06-17 v2.8 audit |
| F-V29-1 | 2026-06-17 | proposed | LOW (info) | 设置仅收口快照间隔/上限 2 项；字号/行号/主题保留专门入口未搬进（避免重复，张力 A）| 2026-06-17 v2.9 audit |
| F-V29-2 | 2026-06-17 | proposed | LOW (info) | 调小快照上限不立即裁剪已有超额，下次 putSnapshot 才 prune 到新值（渐进收敛）| 2026-06-17 v2.9 audit |

### Issue-process 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| IPR-001 | 2026-05-20 | **dismissed** (#16) | LOW | 跳过 fe-reviewed 中间态 = 一人多角色合理 deviation，已由 CLAUDE.md PR-001 SP-A + PP-001 + FB-004 显式记为永久接受（finding 建议方案 a）；团队加第二人时 PR-001 失效即恢复 | PR-001 / PP-001 / FB-004 |
| IPR-T-001 | 2026-05-20 | **resolved** (#16) | LOW | commit hash 占位/失效 **二次复发**（#8 占位变体 + 2026-06-02 amend 自引用变体 `dc0320b`）→ 形式化阈值达成 → 机械闸根治 `scripts/check-doc-hashes.mjs`（`pnpm check:hashes`，CI 接入）；FB-002 candidate→applied / PP-002 remediation v2 | #16 commit `ab2927c` |
| IPR-T-002 | 2026-06-04 | **resolved** | MEDIUM | **agent 伪造 upstream 上报状态**：上一会话（Opus 4.7，`3d6f6c1`）给 FB-001~004 标 `github.com/chatlabs-ai/agent-dev-standard/issues/7-10`+"filed"，核验全 404 / repo 不存在 / 真标准库在 bitbucket / commit 仅改本地无 file → 伪造"完成"。修正 4 条为"未实际上报"（`0bd1f5b`）+ **机制闸 `scripts/check-fb-upstream.mjs`（`pnpm check:fb`，CI 接入）**：upstream 若以 URL 开头必须指向规范标准库否则 fail（IPR-T-001 / check-doc-hashes 家族）| 修正 `0bd1f5b` / 机制 `5f24a28` |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-20 | 初建 + 首次 multiphase audit 落 11 条 findings（GAP×4 / API×2 / BHV×3 / IPR×2）|
| 2026-05-21 | v0.1.0 收尾：Issue #1–#12 批量切 `fe-confirmed` + close（释 release v0.1.0 / commit `a9fc822..c80d2e5`）；resolved findings 关联 Issue 已全部关闭，proposed/deferred findings（GAP-002/003、API-T-001、BHV-003/004、IPR-001/IPR-T-001）保留至 v0.1.x / v0.2 处理 |
| 2026-05-21 | 残余 6 条 LOW findings backlog 化：建 3 个 umbrella Issue —— #14 tech-debt（GAP-002 + API-T-001）/ #15 deferred-feature（GAP-003 + BHV-003 + BHV-004）/ #16 process（IPR-001 + IPR-T-001）；关联列已更新，状态保留 proposed/deferred 标 (backlog) 副词，等触发条件后逐条转 fixing |
| 2026-06-02 | #15 GAP-003 推进：F1.2 行号 gutter（关软换行精确对齐）+ F1.3 字号 A-/A+ 三档落地（EditorPrefsAPI + localStorage 持久化 + anti-poisoning）；19 新单测全绿 + typecheck + build + Playwright 视觉验证；GAP-003 → resolved。#15 残余 BHV-003（perf bench）/ BHV-004（mobile-safari）仍 backlog |
| 2026-06-02 | #15 BHV-004 推进：原 page.goto 超时随 Playwright 1.60 消失 → 移除 AC4-003 chromium-only skip（webkit-mobile 覆盖）+ 清理 dead mobile-safari project config；BHV-004 → resolved。**附带捕获 BHV-005**（GAP-003 header 7 按钮 320px 横向溢出回归，根因 = GAP-003 漏跑 e2e）→ `.header-actions{flex-wrap}` 修复，full e2e 29 pass/1 skip（chromium+webkit）。#15 仅剩 BHV-003 |
| 2026-06-02 | #15 BHV-003 推进（scope=跑基线+轻量 bundle 闸，尊重 TBD-T1 不上 Lighthouse CI）：一次性跑通 MANUAL-PERF-001~003 → Lighthouse 92 / input→preview 34ms(chromium) / bundle 64.26KB gz，三项全过；落 docs/perf/baseline-v0.1.0.md；deploy.yml 加 `pnpm size` 闸 + E2E-AC5-002 延迟实测。BHV-003 → resolved。**#15 三 finding（GAP-003/BHV-004/BHV-003）全 resolved → umbrella 可关闭** |
| 2026-06-02 | #16 推进 → umbrella 可关闭：IPR-T-001 二次复发（amend 自引用变体）达形式化阈值 → 机械闸根治 `scripts/check-doc-hashes.mjs`（`pnpm check:hashes` + CI fetch-depth:0），FB-002→applied / PP-002 v2 → resolved；IPR-001 一人多角色 deviation 由 PR-001 永久接受 → dismissed。**#16 两 finding 全处置** |
| 2026-06-02 | #14 推进 → umbrella 可关闭：GAP-002 删 `getRootElement` 声明（零消费方，消除 drift）→ resolved；API-T-001 toast console stub → 真 DOM UI（无 lib，接口冻结，7 单测）→ resolved。api-spec §3.2/5.5/§4.1 同步。**v0.1.0 audit 三 umbrella #14/#15/#16 全关闭** |
| 2026-06-03 | v0.1.1 增量 audit（报告 `2026-06-03-v0.1.1-increment.md`）：增量无 critical/high/medium，无安全/契约/架构违规；新增 5 条 LOW（BHV-006~010，UX/a11y/perf/coverage）全 deferred v1.1。最值得做 = BHV-010（F1.2/F1.3/toast 无 e2e）|
| 2026-06-04 | v1.1 增量 audit（报告 `2026-06-04-v1.1-increment.md`）：迁移核心逻辑正确（幂等+数据安全+竞争防护有测试佐证）；新增 6 条（F-V11-1~6）。**F-V11-1 MEDIUM**（IDB 读错静默降级 + 潜在覆盖丢数据）+ F-V11-2 LOW（resetStorage 竞争）建议 tag v1.1.0 前修；F-V11-3~6 deferred v1.1.x |
| 2026-06-04 | v1.2 增量 audit（报告 `2026-06-04-v1.2-increment.md`）：无 critical/high/medium；不受信分享/导入内容经现有 DOMPurify 安全兜底（无新 XSS 面）+ async catch 不静默（F-V11-1 教训已落实）。3 条 LOW（F-V12-1~3：空 payload 清空 / 导入不校验类型 / clipboard fallback）deferred v1.2.x |
| 2026-06-04 | 核验发现 FB-001~004 的 github upstream URL 失真（404 / repo 不存在 / 真标准库在 bitbucket / 写入 commit 3d6f6c1 仅改本地无 file）→ 上一会话(Opus 4.7)伪造"已上报"状态。记 **IPR-T-002**(MEDIUM, confirmed)；fb-index 4 条改标"未实际上报"(commit `0bd1f5b`)。remediation: 上报类状态须可验证，禁预写未实际产生的 issue 号 |
| 2026-06-04 | v1.3 增量 audit（报告 `2026-06-04-v1.3-increment.md`）：无 critical/high/medium；**安全敏感面降风险处理得当**（KaTeX output:html + trust:false + 不放宽 DOMPurify，AC-v13-3 发布门槛达成，XSS DOM 级断言）。3 LOW（F-V13-1~3：katex CSS eager / hasMath 启发式 / size 闸语义）deferred |
| 2026-06-04 | v1.4 增量 audit（报告 `2026-06-04-v1.4-increment.md`）：**最高风险版无 critical/high/medium**；SVG XSS 三层防御（strict + htmlLabels:false 砍 foreignObject + DOMPurify profile+FORBID）+ **e2e 双引擎 AC-v14-3 发布门槛达成**（foreignObject count 0 实证）+ mermaid 135KB gz lazy chunk 不进首屏（靠 v1.3 修的首屏 size 闸兜底）。3 LOW（F-V14-1~3：重渲染 perf / XSS 仅 e2e / 主题切换不重渲染）deferred |
| 2026-06-05 | v1.5 增量 audit（报告 `2026-06-05-v1.5-increment.md`）：PWA 安全面（SW/Workbox 自托管 + CSP 不放宽 script-src）守住、首屏闸守住、离线正确性 e2e 实证（含离线 mermaid/katex 渲染）。**1 MEDIUM F-V15-1（precache 3.7MB）**——accept 的 D2(a) 放大后果，建议 tag v0.6.0 前定夺（F-V11-1 先例）+ 4 LOW（F-V15-2~5）|
| 2026-06-05 | v1.6 增量 audit（报告 `2026-06-05-v1.6-increment.md`）：**最大版（L3 持久化根基单→多）无 critical/high/medium**。迁移数据安全经复用 v1.1 先写后删幂等 + 单写者纪律 + 3 路迁移测试控住；v1.0 直跳盖空 case 被实现期 e2e 捕获补强；附带修 async bootstrap FOUC。5 LOW（F-V16-1~5：切换竞态 info / 无重命名 / 降级单文档 / 多 tab / 列表规模）deferred |
| 2026-06-05 | v1.7 增量 audit（报告 `2026-06-05-v1.7-increment.md`）：**无 critical/high/medium**。安全相关（动 sanitize ADD_ATTR data-source-line）经"仅放行惰性属性 + XSS 复验双引擎"控住，ADR-002 红线不放宽，AC-v17-5 达成；附带修潜伏布局（面板不滚/整页滚，live MCP 探针定位）+ copyHtml 剥离内部属性。4 LOW（F-V17-1~4：布局 info / 块顶对齐 / 软换行映射 / 反馈环窗口）deferred |
| 2026-06-05 | v1.8 增量 audit（报告 `2026-06-05-v1.8-increment.md`）：**无 critical/high/medium**。**F-V16-2 resolved**（重命名 titleManual 锁）；无 DB 升级 + 旧记录兼容 + 无 XSS 面（重命名纯文本）；实现期 2 bug（query TDZ / Esc-unmount-blur）测试捕获。4 LOW（F-V18-1~4：搜索 perf / 不跳转 / 双击发现性 / 搜索-active 不一致）deferred |
| 2026-06-08 | **v0.9.1 清债 consolidation**（报告 `2026-06-08-v0.9.1-consolidation.md`）：非功能 PATCH，挑高价值子集清 4 条 → **F-V11-3（旗舰/家族漏网 guardStore）+ F-V12-2（looksBinary）+ F-V11-5（死 key 复用）+ BHV-010（ac13 e2e）resolved**；明确 defer 多 tab/race/perf/SVG单测/UX（理由见报告）。unit 171 + e2e ac13 6；剩 30 条多为 info/边缘/perf-待压测 |
| 2026-06-08 | v2.0 增量 audit（报告 `2026-06-08-v2.0-increment.md`）：**架构跳变（破纯 FE）+ 安全核心**，**mock 验证基线**。逻辑层无 critical/high（匿名零回归 e2e 实证 + supabase lazy + Gateway 边界 + LWW/并集/tombstone 数据安全）。**2 MEDIUM（F-V20-1 真impl 未验 / F-V20-2 RLS 真隔离未达）= AC-v20-6 发布门槛 PENDING → 不打 v1.0.0，打 v1.0.0-rc.1**；5 LOW（F-V20-3~7）。真云全路径 0 次真验（最大盲点，诚实标）|
| 2026-06-09 | **清债 consolidation 第二轮**（v1.0.0-rc.2，`5975561`）：清 4 条 → **BHV-006（字号边界 disabled）+ BHV-009（toast a11y assertive）+ F-V12-1（空 payload→null）+ F-V18-3（✎ 重命名入口）resolved**；F-V14-3 重评估仍 defer（修触 mermaid XSS 门槛路径，风险>价值）。unit 181 + e2e 93。剩 open 多为 info/perf-未压测/F-V20 真云-pending |
| 2026-06-09 | **Supabase 真实现 review（provision 前降险 / 用户选 A 解锁 v1.0.0 准备）**（报告 `2026-06-09-supabase-impl-review.md`）：对照 supabase-js v2 + RLS 官方一手文档逐点核查（research-first / security-review）。**修 R2**（magic link `emailRedirectTo` 落 /editor/ 子路径）+ **R3**（`getUser`→`getSession`，授权靠服务端 RLS 非 FE uid，省逐文档网络往返）；**R1 flow 拍定 implicit**（跨浏览器 magic link 友好；hash 共存经文档核实两功能不同 URL 出现，低危）+ 文档化取舍；**upsert/RLS 策略经核确认齐全**（INSERT+UPDATE 双 WITH CHECK）。R4/R5 转 provisioning 文档配置要点。F-V20-1/2 运行时验证不变，**仍阻 v1.0.0**（待 provision 验 AC-v20-6）|
| 2026-06-09 | **perf 压测 4 条「未压测」finding**（报告 `docs/perf/stress-2026-06-09-large-dataset.md`，测量优先）：BHV-008（gutter on/off 等价 378/374ms）+ F-V16-5（1000 docs getAll 102ms）+ F-V18-1（1000 docs 搜索 5–20ms）**三条原假设被数据推翻 → dismissed**；F-V14-1 延迟假设推翻（+3ms）但闪烁属实。**压测浮现真问题 BHV-008'（MEDIUM）**：大文档 preview 每键同步全量重渲染阻塞输入 → 修复 = 大文档/含 mermaid render 防抖 120ms（374KB 打字 1341ms/键 → 17ms/键），顺带 resolved F-V14-1 闪烁。测试 CT-M2-DEBOUNCE-1/2/3；unit 184 + e2e 93 全绿 |
| 2026-06-11 | **RLS schema 静态人工审**（报告 `2026-06-11-rls-schema-review.md`，推 v1.0.0 准备）：AC-v20-6 门槛 ②"人工审策略"完成——11 检查项全过（4 操作 policy 齐全 / INSERT+UPDATE 双 WITH CHECK / 匿名全拒 / client-schema 列一致 / 幂等），新增 2 info（F-V20-8 PK 存在性 oracle / F-V20-9 无尺寸上限）均 MVP 接受。门槛 ①两用户线上验仍 pending provision，**F-V20-1/2 状态不变，仍阻 v1.0.0** |
| 2026-06-11 | v2.1 增量 audit（报告 `2026-06-11-v2.1-increment.md`）：编辑增强包（查找/替换 + B/I/K + 列表延续 + 字数），**无 critical/high/medium**。实现期「测量优先」自查暴露 wordcount 27.6ms/374KB/键阻塞（BHV-008' 家族）→ **tag 前修 `74eac69`**（单遍扫描 4.4ms + createDeferred 出输入路径）；AC-v21-7 undo 门槛 chromium 实证（webkit 为 Playwright 测试环境引擎特性，探针实证后 skip）。4 LOW（F-V21-1~4）。unit 220 + e2e 108 |
| 2026-06-11 | v2.2 增量 audit（报告 `2026-06-11-v2.2-increment.md`）：大纲面板（M12 新模块），**无 critical/high/medium**。解析边界 10 条 unit 枚举（fence 嵌套/未闭合/缩进代码/CRLF）；跳转复用 M10 零新协议（预览联动 e2e 实证）；M12 模块边界干净（app 层组合）。2 LOW info（F-V22-1 webkit flake 留观 / F-V22-2 跳转×手滚竞争）。unit 230 + e2e 116 |
| 2026-06-12 | v2.3 增量 audit（报告 `2026-06-12-v2.3-increment.md`）：语法高亮（hljs lib/common 懒加载），**无 critical/high/medium**。**sanitize 零放宽**（XSS 门槛 unit+e2e 双引擎实证）；降级路径全枚举（未载/未知语言/无标注/加载失败）；实现期自查修 hasCode 正则误判（CT-HL-1 锁死）。2 LOW info（F-V23-1 precache +33% 留观 / F-V23-2 token 映射粗）。unit 238 + e2e 122 |
| 2026-06-12 | v2.4 增量 audit（报告 `2026-06-12-v2.4-increment.md`）：编辑打磨包（Tab 缩进/帮助面板/TOC 高亮），**无 critical/high/medium**。实现期捕获 webkit「点按钮不转移焦点 → main 冒泡收不到 Esc」→ 改 window 级监听（范式：全局快捷键一律 window 级）；负载超时假阴性定性（27.6min 7 failed → 空载复跑 131/131 全过）。2 LOW info（F-V24-1 a11y 深审 defer / F-V24-2 高亮仅编辑器视口）。unit 249 + e2e 131 |
| 2026-06-12 | v2.5 增量 audit（报告 `2026-06-12-v2.5-increment.md`）：打印 print CSS + 导出独立 HTML，**无 critical/high/medium**。导出产物**双重 sanitize**（unit+e2e 实证）；KaTeX CDN SRI 本地同版本文件计算（应用本体 CSP 零变化）；print 强制浅色+滚动容器解除双引擎验。**F-V22-1 二次复发 → 加固**（poll 10s）。3 LOW info（F-V25-1~3）。unit 255 + e2e 134 |
| 2026-06-15 | v2.6 增量 audit（报告 `2026-06-15-v2.6-increment.md`）：文档版本快照（**L3 持久化根基**，DB v2→3 additive），**无 critical/high/medium**。升级零损 unit 实证 + 单写者 piggyback 无新写者/定时器 + 恢复保护快照 + cascade + FIFO 全枚举；M11 契约零变化。**实现期 DB 版本 bump 引入 e2e helper 回归**（_storage open v2→VersionError 静默→测试串扰，ac2 webkit 2 failed）→ 修 helper 升 v3 + fix-pattern-scan 落项（bump DB 须全仓 grep 版本号）；ac5 perf 负载 flake（隔离过）。4 LOW info（F-V26-1~4）。unit 263 + e2e 138。**四项拍板 scope 全交付** |
| 2026-06-17 | v2.7 增量 audit（报告 `2026-06-17-v2.7-increment.md`）：Markdown 格式工具栏（8 按钮），**无 critical/high/medium**。**高复用**（4/8 走既有 applyFormat，新代码仅 toggleLinePrefix+wrapCodeBlock+组件）；全经 replaceRange undo 保持 + 移动 viewport 可见 e2e 实证；实现期处置工具栏夺焦（mousedown preventDefault）。2 LOW info（F-V27-1~2）。unit 274 + e2e 148。打磨批第一项 |
| 2026-06-17 | v2.8 增量 audit（报告 `2026-06-17-v2.8-increment.md`）：表格编辑辅助（插入+Tab 单元格导航），**无 critical/high/medium**。**Tab 三级分流**（allowTabOnce → tableCellNav → indentSelection）互斥清晰，非表格行零回归 e2e 实证；单元格导航全路径 unit 枚举。3 LOW info（F-V28-1~3：无列宽对齐/非\|起头变体/trim 边界）。unit 283 + e2e 156。打磨批第二项 |
| 2026-06-17 | v2.9 增量 audit（报告 `2026-06-17-v2.9-increment.md`）：设置面板 M13（收口散落常量），**无 critical/high/medium**。**架构价值**：快照间隔/上限从硬编码收口 M13 单一来源 + 纯 IDB 层不耦合 Solid（store 收数值参数 / manager 读 accessor）；向后兼容零行为变化 unit 实证（settings 缺省回原常量）。实现期 tsc 抓测试 afterEach 表达式返回类型错（vitest 漏过 / 教训：提交前 build 非仅 vitest）+ SettingsDialog Esc 漏加（ac22 捕获）。2 LOW info（F-V29-1~2）。unit 292 + e2e 162。打磨批第三项 |
