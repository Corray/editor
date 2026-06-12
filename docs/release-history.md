# editor — Release History

每条 release 一段，含 scope / quality gates / spec-to-code-flow / audit / known limitations / closure。新版本追加到顶部。

---

## v1.5.0-rc.1 — 打印 / 导出 HTML（v2.5）（2026-06-12）

**Tag:** `v1.5.0-rc.1` @ commit `d7fc867`
**Range:** `794b985..d7fc867`（v1.4.0-rc.1 以来）
**部署:** https://corray.github.io/editor/
**类型:** 功能 minor（四项 scope 第三项；余 v2.6 版本快照 L3 压轴）。仍 RC。

### Scope — 打印 + 导出（共识 v2.5 / ADR-021 / `c270057`）

- **print CSS**：Cmd+P → 仅预览内容（chrome 全隐）+ 强制浅色（深色主题下亦然）+ 解除 v1.7 滚动容器链（全文打印非首屏）；可存 PDF
- **导出独立 .html**：header 按钮；内容源 = 预览 DOM 最终态（mermaid SVG 保真，未挂载降级 render）；**双重 sanitize**（FORBID foreignObject/script + 剥 data-source-line）；内联浅色排版/高亮样式；含公式时注 KaTeX CDN link（**SRI 从本地 katex@0.17.0 同版本文件计算**，应用本体 CSP 零变化）
- 帮助面板 +Cmd+P 条目（9 条）

### Quality Gates [已验证: 2026-06-12 本机]

- 255 unit（+6 CT-XH）；134 e2e / 3 skip（ac18 新 2 用例双引擎：下载内容断言 + emulateMedia print）
- 首屏 88.77 KB gz（预算 150）；typecheck 0；doc-hash + fb 闸 pass

### Audit（2026-06-12 增量）

报告：`docs/audit/2026-06-12-v2.5-increment.md`。**无 critical/high/medium**；**F-V22-1 二次复发 → 加固**（ac15-2 webkit poll 10s，环境噪声定性）。3 LOW info（F-V25-1~3：CDN 离线降级 / 移动降级源 / 移动打印空内容，均文档化）。

### Closure

- findings-registry：+F-V25-1~3（info）+ F-V22-1 → fixing（加固）；变更记录追加
- spec 全链落档 + api-spec 追溯回填；package.json → 1.5.0-rc.1

---

## v1.4.0-rc.1 — 编辑细节打磨包（v2.4）（2026-06-12）

**Tag:** `v1.4.0-rc.1` @ commit `794b985`
**Range:** `ac06fd2..794b985`（v1.3.0-rc.1 以来）
**部署:** https://corray.github.io/editor/
**类型:** 功能 minor（四项 scope 第二项；余 v2.5 打印导出 → v2.6 版本快照）。仍 RC。

### Scope — 三件打磨（共识 v2.4 / ADR-020 / `f780847`）

- **Tab/Shift+Tab 缩进**：2 空格；多行选区整体加减（单次 replaceRange 一步 undo）；**Esc 后下一个 Tab 放行**原生焦点移动（a11y 逃逸）
- **快捷键帮助面板**：header ⌨ 按钮 + Cmd/Ctrl+/ 唤起，8 条快捷键，Esc/遮罩关闭
- **TOC 当前位置高亮**：编辑器滚动（rAF 节流）→ 视口顶部 section 高亮（解 TBD-v22-4 defer）

### Quality Gates [已验证: 2026-06-12 本机空载复跑]

- 249 unit（+11：CT-IND×7 / CT-AOI×4）
- 131 e2e / 3 skip（ac17 新 5 用例；+1 skip = ac17-2 webkit undo，F-V21-1 同限）
- 首屏 87.61 KB gz（预算 150）；typecheck 0；doc-hash + fb 闸 pass

### Audit（2026-06-12 增量）

报告：`docs/audit/2026-06-12-v2.4-increment.md`。**无 critical/high/medium**。实现期两个值得记的处置：① webkit 点按钮不转移焦点 → 全局快捷键改 **window 级监听**（范式）；② 负载超时假阴性（27.6min 7 failed → 空载复跑 131/131 全过，先查负载再查代码）。2 LOW info（F-V24-1~2）。

### Known Limitations

- a11y 深度审计（aria-keyshortcuts/读屏）defer（F-V24-1）
- TOC 高亮仅随编辑器视口，预览滚动不驱动（设计内，F-V24-2）
- 仍 RC：云安全门槛 pending provision

### Closure

- findings-registry：+F-V24-1/2（info）；变更记录追加
- spec 全链落档 + api-spec 追溯回填；package.json → 1.4.0-rc.1

---

## v1.3.0-rc.1 — 代码块语法高亮（v2.3）（2026-06-12）

**Tag:** `v1.3.0-rc.1` @ commit `ac06fd2`
**Range:** `a5b6e53..ac06fd2`（v1.2.0-rc.1 以来）
**部署:** https://corray.github.io/editor/
**类型:** 功能 minor（2026-06-12 四项拍板 scope 第一项；队列：v2.4 打磨包 → v2.5 打印导出 → v2.6 版本快照）。仍 RC。

### Scope — 语法高亮（共识 v2.3 / ADR-019 / `f966af3`）

- highlight.js 11.11.1 `lib/common`（~37 常用语言）懒加载 lazy chunk（162KB raw，进 precache 离线可用，katex 同策略）
- markdown-it `highlight` 闭包注入——hljs 加载完成后**渲染器零重建**生效；未载/未知语言/无标注统一降级无色（现状）
- **sanitize 零放宽**（ADR-002 红线）：hljs class-based 输出走既有 DOMPurify 默认配置；XSS 门槛 unit + e2e 双引擎实证（AC-v23-4）
- 自绘 `--hl-*` CSS 变量主题（github light/dark 近似）——浅深色切换即时跟随，零重渲染

### Quality Gates [已验证: 2026-06-12 本机]

- 238 unit（+8 CT-HL：启发式/降级/XSS/非法语法）
- 122 e2e / 2 skip（ac16 新 3 用例双引擎：着色/XSS/主题跟随）
- 首屏 86.47 KB gz（+0.5，预算 150）；precache 1570KB；typecheck 0；doc-hash + fb 闸 pass

### Audit（2026-06-12 增量）

报告：`docs/audit/2026-06-12-v2.3-increment.md`。**无 critical/high/medium**；实现期自查修 hasCode 正则误判（fence 量词笔误，CT-HL-1 锁死）。2 LOW info（F-V23-1 precache +33% 留观 / F-V23-2 token 映射粗）。

### Known Limitations（v1.3.0-rc.1）

- 编辑器（textarea）侧不着色（共识范围外，mirror-div 架构级改动）
- 非 common 子集语言降级无色；token 映射 9 组归并（细分 scope 沿默认色，F-V23-2）
- 仍 RC：云安全门槛 pending provision（用户挂起）

### Closure

- findings-registry：+F-V23-1/2（info）；变更记录追加
- spec 全链落档 + api-spec §3 追溯回填；新依赖 highlight.js@11.11.1；package.json → 1.3.0-rc.1

---

## v1.2.0-rc.1 — 大纲/TOC 面板（v2.2）（2026-06-11）

**Tag:** `v1.2.0-rc.1` @ commit `a5b6e53`
**Range:** `7fe6f91..a5b6e53`（v1.1.0-rc.1 以来）
**部署:** https://corray.github.io/editor/（env-less → 同步禁用，匿名正常）
**类型:** 功能 minor（2026-06-11 三项拍板 scope 第三项收尾）。**仍 RC**（云同步未验标记延续）。

### Scope — 大纲面板（共识 v2.2 / ADR-018 / `7626be0`）

- **M12 大纲**（新模块，纯派生态）：源文 ATX 标题单遍解析（≤3 前导空格 / 尾随闭合 # 剥离 / fenced ``` 与 ~~~ 内伪标题排除 / CRLF 容错；setext 不支持，文档化）
- **sidebar 上下分区**（桌面 only）：DocList 上半 + 大纲下半各自滚动；app 层组合（DocList children slot，M12 不依赖 M9）；移动端行为不变
- **点击跳转**：光标置标题行首 + scrollTop 估算居中 → scroll 事件自然驱动 M10 预览联动（零新协议）
- **deferred 解析**：复用 v2.1 wordcount 范式，不进每键输入路径

### Quality Gates [已验证: 2026-06-11 本机]

- 230 unit（+10：CT-OL 解析边界含 fence 嵌套/未闭合/缩进代码）
- 116 e2e / 2 skip（ac15 新 4 用例双引擎，预览联动 scrollTop 实证）
- 首屏 85.93 KB gz（+1.3，预算 150）；typecheck 0；doc-hash + fb 闸 pass

### Audit（2026-06-11 增量）

报告：`docs/audit/2026-06-11-v2.2-increment.md`。**无 critical/high/medium**；2 LOW info（F-V22-1 webkit 单次 flake 留观 / F-V22-2 跳转×手滚竞争理论窗口）。

### Known Limitations（v1.2.0-rc.1）

- setext 标题（=== / --- 下划线式）不进大纲（ADR-018 D1 文档化）
- 跳转滚动为行号×行高估算（软换行偏差，F-V17-3 同限）
- 移动端无大纲入口（TBD-v22-1a 桌面 only，M10 先例）
- 仍 RC：正式版被云安全门槛（F-V20-1/2）阻塞，pending Supabase provision（用户显式挂起）

### Closure

- findings-registry：+F-V22-1/2（proposed LOW info）；变更记录追加
- 共识/module-list M12/ADR-018/api-spec/test-plan v2.2 全链落档；api-spec §4 追溯回填；package.json 1.1.0-rc.1 → 1.2.0-rc.1
- **2026-06-11 三项拍板 scope（编辑增强包 / TOC / 字数统计）全部交付**

---

## v1.1.0-rc.1 — 编辑增强包（v2.1 / PM 新拍 scope 首版）（2026-06-11）

**Tag:** `v1.1.0-rc.1` @ commit `7fe6f91`
**Range:** `7da3274..7fe6f91`（rc.3 以来；含 b82cd18 RLS 静态审）
**部署:** https://corray.github.io/editor/（env-less → 同步禁用，匿名正常）
**类型:** 功能 minor（路线图耗尽后首个 PM 新拍 scope）。**仍 RC**——rc 后缀诚实延续「云同步未验」标记（TBD-v21-0a），云验过后一次性出 1.1.x 正式。

### Scope — 编辑增强包（共识 v2.1 / ADR-017 / `989fcc7` + perf `74eac69`）

- **查找/替换**：Cmd/Ctrl+F 编辑面板内拦截唤起嵌入查找栏；字面量大小写不敏感、n/m 计数、Enter/Shift+Enter 跳转（选区+滚动估算）、替换当前/全部（toast 计数）；Esc 关闭回焦
- **格式快捷键**：Cmd/Ctrl+B/I/K toggle 包裹/解包（I 防误吞 B 的 `**`；K 链接 url 占位选中）
- **列表自动延续**：`- / * / 1. / - [ ]` 四前缀续行（数字递增 / checkbox 重置 / 缩进保留）+ 空项回车退出；`isComposing` 守 IME（中文输入 Enter 确认候选词不拦截）
- **字数统计**：编辑面板底部 status bar `N 字 · 约 M 分钟`（CJK 逐字 + 非 CJK 分词，单遍扫描 + createDeferred 出输入路径）
- **undo 核心约束（AC-v21-7）**：所有程序化编辑经 `execCommand('insertText')` 进原生 undo 栈（deprecated 显式技术债 + setRangeText fallback / ADR-017 D1），Cmd+Z 可撤销 e2e 实证

### Quality Gates [已验证: 2026-06-11 本机]

- 220 unit（+36：CT-WC×8 / CT-FMT×9 / CT-LIST×10 / CT-FIND×9）
- 108 e2e / 2 skip（ac14 新 8 用例双引擎；AC14-3b undo 仅 chromium——Playwright WebKit undo 全合并为测试环境引擎特性，探针实证，F-V21-1）
- 首屏 84.63 KB gz（+2.1KB，预算 150）；typecheck 0；doc-hash + fb 闸 pass

### Audit（2026-06-11 增量）

报告：`docs/audit/2026-06-11-v2.1-increment.md`。**无 critical/high/medium**。实现期「测量优先」自查暴露 wordcount 27.6ms/374KB/键阻塞（BHV-008' 家族）→ tag 前修 `74eac69`（单遍 4.4ms + deferred）。4 LOW（F-V21-1~4）。另：RLS 静态人工审收口 AC-v20-6 门槛②（`2026-06-11-rls-schema-review.md`，b82cd18）。

### Known Limitations（v1.1.0-rc.1）

- 查找导航期间选区高亮不可见（textarea 失焦不渲染选区，浏览器行为）——反馈靠计数+滚动，Esc 回焦后可见（F-V21-2）
- undo 粒度 webkit 未实证（F-V21-1，真 Safari 待手测）
- 仍 RC：v1.x 正式版被云安全门槛（F-V20-1/2 / AC-v20-6 门槛①）阻塞，pending Supabase provision（用户显式挂起），见 `docs/setup/cloud-sync-provisioning.md`

### Closure

- findings-registry：+F-V21-1~4（proposed LOW）+ F-V20-8/9（RLS 静态审 info）；变更记录追加 2 行
- 共识/module-list/ADR-017/api-spec/test-plan v2.1 全链落档；api-spec §6 实现追溯回填；package.json 1.0.0-rc.3 → 1.1.0-rc.1

---

## v1.0.0-rc.3 — perf 压测 + 大文档 preview 防抖（rc 线打磨）（2026-06-09）

**Tag:** `v1.0.0-rc.3` @ commit `7da3274`
**Range:** `b8a90f8..7da3274`（rc.2 以来）
**部署:** https://corray.github.io/editor/（env-less → 同步禁用，匿名正常）
**类型:** 非功能 perf consolidation（测量优先；rc 线打磨，仍 RC——云安全门槛 pending-provision，见 rc.1）。

### Scope — 压测 4 条「未压测」finding（`9ba4b1d` 修 / `0787635` 报告）

> 测量优先：先造数据集实测 → 数据定性 → 真问题才优化。详见 `docs/perf/stress-2026-06-09-large-dataset.md`。

| 编号 | 原假设 | 实测 | 处置 |
|------|--------|------|------|
| BHV-008 | gutter 放大大文档成本 | 5000 行/374KB：gutter ON 378ms vs OFF 374ms（等价）| **dismissed**（数据推翻）|
| F-V16-5 | 多文档 startup getAll 慢 | 200 docs 21ms / 1000 docs 102ms | **dismissed**（数据推翻）|
| F-V18-1 | 多文档搜索线性扫慢 | 200 docs 1–3ms / 1000 docs 5–20ms per query | **dismissed**（数据推翻）|
| F-V14-1 | mermaid 重渲染拖慢 | 同步延迟 +3ms（9 vs 6ms）；闪烁/CPU 属实 | **resolved**（防抖消闪烁）|
| **BHV-008'** | （压测浮现）| 大文档 preview `html` memo 每键同步全量重渲染阻塞输入 | **resolved**（防抖）|

**修复（`9ba4b1d`）：** PreviewArea 引入 `renderText` 防抖信号——小文档（<10KB 且不含 mermaid）即时渲染；大文档/含 mermaid → trailing-debounce 120ms。374KB 真实增量打字 **1341ms/键 → 17ms/键**；含 mermaid 也防抖顺带消除每键占位闪烁。

**改判说明（诚实）：** 最初把 BHV-008 的 374ms 误归因为 preview render；拆解发现 gutter off 仍 374ms，真瓶颈是 `html` memo 直接订阅 `text()` 每键同步 render。合成测试（全量 `.value=` 替换）一度误导（539ms 伪影），改 `execCommand('insertText')` 增量打字才拿到真实 17ms。

### Quality Gates [已验证: 2026-06-09 本机]

- 184 unit（+CT-M2-DEBOUNCE-1/2/3 大文档防抖/小文档即时/mermaid 防抖）
- 93 e2e / 1 skip（无回归；mermaid/KaTeX/perf e2e 在防抖下 `waitFor` 吸收 120ms）
- 首屏 82.64 KB gz（env-less，+workbox 等同 rc.2 量级）；typecheck 0；doc-hash（56 引用）+ fb 闸 pass

### Known Limitations（v1.0.0-rc.3）

- **残留 tech-debt**：防抖后单次 deferred render 在 374KB 下仍 ~1.3s（dev）；彻底解需增量/虚拟化渲染（大架构改动），对 markdown 草稿器属极端体量，未做
- **dev≠prod**：压测在 dev（未压缩）测，结论用相对量级+架构判断，非 prod SLA（prod 输入延迟基线见 `baseline-v0.1.0.md` 1000 行 34ms）
- 仍 RC：v1.0.0 云安全发布门槛（F-V20-2 RLS 真隔离 / AC-v20-6）pending Supabase provision，见 `docs/setup/cloud-sync-provisioning.md`

### Closure

- BHV-008 / F-V16-5 / F-V18-1 → dismissed（带数据）；BHV-008'（新）+ F-V14-1 → resolved；findings-registry 变更记录追加
- 非功能 / 无 DB / 无新 XSS 面；package.json 1.0.0-rc.2 → 1.0.0-rc.3

---

## v1.0.0-rc.2 — 清债 consolidation 第二轮（rc 线打磨）（2026-06-09）

**Tag:** `v1.0.0-rc.2` @ commit `b8a90f8`
**Range:** `e160724..b8a90f8`（rc.1 以来）
**部署:** https://corray.github.io/editor/（env-less → 同步禁用，匿名正常）
**类型:** 非功能 debt consolidation（rc 线打磨，仍 RC——云安全门槛 pending-provision，见 rc.1）。

### Scope — 清 4 条 LOW（`5975561`）

| 编号 | 处置 |
|------|------|
| BHV-006 | 字号到 13/17 边界 → A−/A+ `disabled` + 视觉态（`canIncrease/canDecreaseFontSize` 访问器）|
| BHV-009 | toast error/warn → `role=alert` + `aria-live=assertive`（info 走容器 polite）a11y |
| F-V12-1 | 空 share payload（`#doc=1.`→''）→ `readSharedDocument` 返 null（不建空文档）|
| F-V18-3 | doc-list 加常显 ✎ 重命名入口（不只双击；mobile 无 hover 也可用）|

**明确 defer**：F-V14-3（主题重渲染 mermaid）重评估后仍 defer——正确修需 regenerate placeholders（SVG 已替换），触 mermaid 异步+XSS 门槛路径，**风险 > 价值**。其余 open 多为 info / perf-未压测 / F-V20 真云-pending。

### Quality Gates [已验证: 2026-06-09 本机]

- 181 unit（+PREF-009 边界 / +LOAD-EMPTY / +TOAST-011 a11y）
- 93 e2e / 1 skip（ac13 BHV010-2 改为断言按钮 disabled；无回归）
- 首屏 82.54 KB gz（env-less）；typecheck 0；doc-hash + fb 闸 pass

### Closure

- 4 findings resolved；F-V14-3 诚实重评估后保持 defer（不强行修触风险路径）
- 非功能 / 无 DB / 无新 XSS 面；仍 RC（升 v1.0.0 待 provision，见 `docs/setup/cloud-sync-provisioning.md`）
- package.json 1.0.0-rc.1 → 1.0.0-rc.2

---

## v1.0.0-rc.1 — 账号 + 云同步（v2.0 / mock 实现 / Release Candidate）（2026-06-08）

**Tag:** `v1.0.0-rc.1` @ commit `e160724`
**Range:** `6a7f630..e160724`（v0.9.1 以来）
**部署:** https://corray.github.io/editor/（env-less → 同步禁用，匿名行为不变）
**类型:** **架构跳变（破纯 FE）+ 安全核心**。**RC（非正式 v1.0.0）**——真云连接 + RLS 真隔离（AC-v20-6 安全发布门槛）待用户 provision 后验。

### Scope — 账号（magic link）+ 文档云同步（local-first + LWW）

| 变更 | Commit | 说明 |
|------|--------|------|
| M11 同步网关 | `935d3ae` | 唯一封装 supabase-js（Gateway / arch §7）；懒加载（env-less tree-shaken / with-env 204KB lazy chunk 非首屏）|
| auth | `935d3ae` | Supabase magic link（无密码）；session 持久；登录 UI 仅 env 配置时显示 |
| 同步 | `935d3ae` | local-first 叠加云 + 自动 push/pull + per-doc LWW + 首登并集（不丢数据）+ 软删 tombstone |
| 安全 | ADR-016 | RLS `user_id=auth.uid()` 行级隔离；FE 不做授权；anon key 公开；明文+隐私提示 |
| M9 集成 | `935d3ae` | sync hooks + mergeRemote；**匿名(无 env)行为不变**（setSyncHooks 永不调）|

### Quality Gates [已验证: 2026-06-08 本机 / mock]

- 178 unit（+M11 7：mergeRemote LWW/首登并集/软删 tombstone + push + RLS-deny + no-env）
- 93 e2e / 1 skip（**匿名零回归实证**，env-less）
- 首屏 81.20 KB gz（env-less）/ 82.38 KB（with-env，supabase lazy 不计）；supabase env-less 完全 tree-shaken
- typecheck 0；doc-hash + fb 闸 pass

### Spec-to-Code-Flow

共识 v2.0 新章节（破纯 FE / TBD-v20-1~7 accept）→ module-list M11 + 架构重评估 → **4 ADR**（013 Supabase / 014 magic link / 015 sync LWW / 016 安全 RLS）→ data-model/api/test-plan v2.0 → 实现（mock 后端）。激活休眠 rule：arch-constraints §7 Gateway / §4 identity 隔离、security-review 全程。

### Audit（2026-06-08 增量 / 安全核心）

报告 `docs/audit/2026-06-08-v2.0-increment.md`：mock 验证基线，逻辑层无 critical/high。**2 MEDIUM（F-V20-1 真impl 未运行时验 / F-V20-2 RLS 真隔离未达）= AC-v20-6 安全发布门槛 PENDING → 故 RC 不打 v1.0.0**。F-V20-3~7 LOW。

### 升 v1.0.0 的 PENDING 清单（用户 provision 后）

1. 开 Supabase 项目 + 跑 data-model v2.0 §1 建表+RLS SQL
2. 配 `VITE_SUPABASE_*`（CI Secrets）→ build
3. 真 magic link 登录 + 跨设备同步验（AC-v20-2/3/4/5）
4. **构造两用户验 RLS 隔离（AC-v20-6）+ 人工审 RLS 策略**
5. magic link 回调 × `#doc=` 共存线上验
→ 全过 + security review 签字 → 升 v1.0.0

### Known Limitations（v1.0.0-rc.1）

- **真云全路径 0 次真验**（mock 验逻辑；infra 待 provision，最大盲点）
- supabase.ts 真 impl 未运行时验证（F-V20-1）
- 明文存云无 E2EE（F-V20-5）/ LWW 时钟偏差（F-V20-4）/ 登录 UI prompt 简陋（F-V20-6）
- 不做实时/CRDT/协作（v2.1+）

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓（休眠架构/安全 rule 首次激活落地）
- **RC**：逻辑 + mock 验证完成；真云安全门槛诚实标 PENDING-provision，**不假装闭环**
- package.json 0.9.1 → 1.0.0-rc.1

---

## v0.9.1 — 清债 consolidation（非功能 PATCH）（2026-06-08）

**Tag:** `v0.9.1` @ commit `6a7f630`
**Range:** `367cb5d..6a7f630`（v0.9.0 以来）
**部署:** https://corray.github.io/editor/
**类型:** **技术债 consolidation**（非功能版）。FE 功能井近干 → 拐点决策选"清债降熵"，不加功能、不做全清。

### Scope — 清 4 条高价值 findings（`a0efd2c`）

| 编号 | 性质 | 处置 |
|------|------|------|
| F-V11-3 | 旗舰 / F-V11-1 家族漏网 | 静默吞错经 v1.6 重构迁到 M9 用户操作 fire-and-forget store 写 → `guardStore`(log+toast) + family scan 复核 |
| F-V12-2 | 正确性 | 导入 `looksBinary` 检测（NUL / >10% U+FFFD）→ 二进制拒绝 + toast |
| F-V11-5 | dead code | 死 key `storage.unavailable` 复用为 guardStore 通用错误提示 |
| BHV-010 | 覆盖缺口 | 补 ac13 e2e（行号 toggle / 字号档位 / 复制 toast 双引擎）|

**明确 defer**（理由见 audit 报告）：多 tab(F-V16-4) / race-info / perf 类 4 条 / SVG 单测(F-V14-2) / UX 打磨 + 边缘 ~15 条。

### Quality Gates [已验证: 2026-06-08 本机]

- 171 unit tests pass（+looksBinary 4 / +remove-store-fail guardStore surface 1）
- e2e ac13 6 通过（双引擎）；full e2e 92 pass + 1 **已知 PP-003 #4 并行竞争 flake**（E2E-v16-002，隔离 5/5 过，非回归）
- 首屏 81.20 KB gzipped；typecheck 0；doc-hash + fb 闸 pass

### Audit

报告 `docs/audit/2026-06-08-v0.9.1-consolidation.md`：无功能/DB/XSS 变更。F-V11-3 印证 fix-pattern-scan 家族扫描价值（代码重构后静默点会"迁移"，需重新定位，不照搬旧 finding 描述）。

### Closure

- 4 findings resolved（剩 30 条多为 info/边缘/perf-待压测）
- 非功能版：无新 feature、无 DB 变更、无新 XSS 面
- package.json 0.9.0 → 0.9.1

---

## v0.9.0 — 多文档增强（重命名 + 搜索 / 路线图 v1.8 里程碑）（2026-06-05）

**Tag:** `v0.9.0` @ commit `367cb5d`
**Range:** `7a854b9..367cb5d`（v0.8.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.9.0
**命名:** 路线图 "v1.8" → semver **v0.9.0**。L2（扩 M9）。**FE 功能井近干的拐点版**（解 v1.6 遗留 F-V16-2）。

### Scope — 文档重命名 + 搜索

| 变更 | Commit | 说明 |
|------|--------|------|
| 手动重命名 + titleManual 锁 | `c66c21e` | rename(id,title)：非空锁 titleManual（saveActiveText 不再覆盖）/ 空回退自动派生（解 F-V16-2）|
| 标题/内容搜索 | `c66c21e` | query/setQuery，docs() 按 title 或 text 过滤（records 含 text，无额外 IO）|
| 内联重命名 UI | `c66c21e` | DocList 双击标题 → 输入框 → Enter 提交 / Esc 取消（editingId 守 blur）|
| 数据模型 | `c66c21e` | DocRecord +titleManual?（无 DB 升级 / schemaless / 旧记录兼容）|

### Quality Gates [已验证: 2026-06-05 本机]

- 166 unit tests pass（M9 +rename-lock / empty / search / legacy-autotitle）
- 87 e2e pass（chromium + webkit + pwa；ac12 重命名/锁/Esc/搜索 4 场景 ×2）
- 首屏 81.04 KB gzipped（预算 150 KB）；DB version 仍 2（无升级）
- TS strict typecheck 0 error；doc-hash + fb-upstream 闸 pass

### Spec-to-Code-Flow

共识 v1.8（TBD-v18-1~4 accept）→ module-list **M9 delta** → 架构 + **ADR-012**（titleManual 锁 / 内联重命名 / title+text 搜索）→ data-model v1.8（+titleManual，无 DB 升级）→ api/test-plan v1.8 → 实现。

### Audit（2026-06-05 增量）

报告 `docs/audit/2026-06-05-v1.8-increment.md`：**无 critical/high/medium**。**F-V16-2（v1.6 遗留 LOW）resolved**；无 DB 升级 + 旧记录兼容 + 无 XSS 面（重命名纯文本显示）。实现期 2 bug（query 信号 TDZ / Esc-unmount-blur 误提交）经 unit+e2e 捕获修复。
- F-V18-1~4 LOW（搜索 perf / 不跳转 / 双击发现性 / 搜索-active 不一致）→ deferred v1.8.x

### Known Limitations（v0.9.0）

- 内联重命名靠双击，无可见编辑图标（发现性低，F-V18-3）
- 搜索仅过滤列表，不跳转/高亮匹配位置（F-V18-2）
- IME（中文输入法）重命名合成态未专门测（诚实盲点）
- 文件夹/分组/标签/拖拽 / 后端同步(v2.0) 按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- F-V16-2 resolved（多文档同名问题闭环）
- 无 DB 升级、旧记录兼容、无 XSS 面
- package.json 0.8.0 → 0.9.0

---

## v0.8.0 — 滚动同步（编辑↔预览 / 路线图 v1.7 里程碑）（2026-06-05）

**Tag:** `v0.8.0` @ commit `7a854b9`
**Range:** `ee14b28..7a854b9`（v0.7.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.8.0
**命名:** 路线图 "v1.7" → semver **v0.8.0**。最后一个清晰的 FE-only roadmap 功能。L2 + 安全相关（动 sanitize 配置）。

### Scope — 编辑↔预览滚动同步

| 变更 | Commit | 说明 |
|------|--------|------|
| source-line 映射 | `7c4d7ad` | markdown-it core rule 给块标 `data-source-line`（`token.map[0]`）|
| ADD_ATTR 放行 | `7c4d7ad` | render 的 DOMPurify 加 `ADD_ATTR:['data-source-line']`（仅惰性属性，红线不放宽）|
| M10 双向同步 | `7c4d7ad` | createScrollSync：编辑↔预览（source-line 映射 + syncing/rAF 反馈环防护）|
| copyHtml 剥离 | `7c4d7ad` | 复制 HTML 去掉 data-source-line（内部属性不外泄）|
| 布局修 | `7c4d7ad` | #root min-height→height:100vh + overflow:hidden（面板内部滚动 / 滚动同步前置）|

### Quality Gates [已验证: 2026-06-05 本机]

- 162 unit tests pass（source-line 标注 + ADD_ATTR XSS 复验）
- 79 e2e pass（chromium + webkit + pwa；ac11 滚动同步 4 场景：编辑→预览 / 预览→编辑 / XSS / 移动不启用）
- 首屏 80.51 KB gzipped（M10 极小；预算 150 KB）
- TS strict typecheck 0 error；doc-hash + fb-upstream 闸 pass

### Spec-to-Code-Flow

共识 v1.7（TBD-v17-1~5 accept）→ module-list **M10 新增 + M2 source-line** → 架构 + **ADR-011**（source-line 映射 / ADD_ATTR + XSS 复验 / 反馈环防护 / 双向桌面 only / M10）→ api/test-plan v1.7 → 实现。无 data-model 变更。research-first：markdown-it token.map + core.ruler + DOMPurify ADD_ATTR 语义核实。

### Audit（2026-06-05 增量，安全相关）

报告 `docs/audit/2026-06-05-v1.7-increment.md`：**无 critical/high/medium**。安全敏感点（动 sanitize ADD_ATTR）经"仅放行惰性属性 + XSS 复验双引擎"控住，ADR-002 红线不放宽，**AC-v17-5 发布门槛达成**。
- F-V17-1~4 LOW（布局 info / 块顶对齐 / 软换行映射 / 反馈环窗口）→ deferred v1.7.x

### Known Limitations（v0.8.0）

- 移动端不启用滚动同步（单栏，设计如此）
- source-line 对齐到块顶，块内偏移不细调（F-V17-2）
- 长行软换行下 lineHeight 行号换算有偏差（F-V17-3）
- 文件夹/搜索/后端同步(v2.0) 按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- AC-v17-5 XSS 复验（ADD_ATTR 不破防）双引擎通过
- 附带修潜伏布局（面板不滚 / 整页滚 → 面板内部滚动）+ copyHtml 剥离内部属性
- package.json 0.7.0 → 0.8.0

---

## v0.7.0 — 多文档（文件列表 / 路线图 v1.6 里程碑）（2026-06-05）

**Tag:** `v0.7.0` @ commit `ee14b28`
**Range:** `dee3bdb..ee14b28`（v0.6.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.7.0
**命名:** 路线图 "v1.6" → semver **v0.7.0**。**迄今最大改动（L3）**：持久化根基单→多 + 新模块 M9。

### Scope — 多文档管理

| 变更 | Commit | 说明 |
|------|--------|------|
| M9 文档管理 | `f2986e2` | documents store(DB v1→2) + activeId + CRUD + 标题自动派生 + `D_<uuid>` |
| 第三次迁移 | `f2986e2` | 单→多（先写后删幂等）；谱系 ls(v1.0)→kv(v1.1)→documents(v1.6)；含 v1.0 localStorage 直跳兜底路 |
| M3 改造 | `f2986e2` | 退化为状态机/时机，写目标 = `docManager.saveActiveText`（单 store 单写者）|
| 涟漪（改 v1.2）| `f2986e2` | import/open-shared → 新建文档（不覆盖；退役 share/import overwrite confirm）|
| 文件列表 UI | `f2986e2` | DocList 桌面 sidebar + DocDrawer 移动抽屉 + header 文档按钮 |
| FOUC 修 | `f2986e2` | applyInitialTheme 同步先于 async bootstrap 的 await（深色不闪白）|

### Quality Gates [已验证: 2026-06-05 本机]

- 159 unit tests pass（M9 13：迁移 3 路 / CRUD / 标题派生 / no-op-save）
- 65 e2e pass / 1 skip（chromium + webkit + pwa project；ac10 多文档 4 场景 + ac2/ac7 v1.6 语义）
- 首屏 80.01 KB gzipped（M9 +~1.8KB；预算 150 KB）；DB version 1→2
- TS strict typecheck 0 error；doc-hash + fb-upstream 闸 pass

### Spec-to-Code-Flow

共识 v1.6（TBD-v16-1~7 accept）→ module-list **M9 新增 + M3 改造** → 架构 + **ADR-010**（documents store / D_uuid / 先写后删第三次迁移 / M3-M9 分解 / 涟漪 / 抽屉）→ **data-model v1.6（核心：DB v2 + documents schema + 迁移层）** → api/test-plan v1.6 → 实现。research-first：crypto.randomUUID（Node18+/浏览器原生）+ idb DB 升级路径核实。

### Audit（2026-06-05 增量，最大版 L3）

报告 `docs/audit/2026-06-05-v1.6-increment.md`：**最大版无 critical/high/medium**。迁移数据安全经复用 v1.1 先写后删幂等 + 单写者纪律 + 3 路迁移测试控住；**v1.0 直跳 v1.6 盖空 case 被实现期 e2e（E2E-v11-001）捕获并补兜底路**（印证 Check 环节价值）。
- F-V16-1~5 LOW（切换竞态 info / 无重命名 / 降级单文档 / 多 tab / 列表规模）→ deferred v1.6.x

### Known Limitations（v0.7.0）

- 无手动重命名（标题自动派生，多篇可能同名，F-V16-2）
- 隐私模式（IDB 不可用）仅单文档降级，多文档不跨 reload（F-V16-3）
- 多 tab 并发 last-write-wins，无协调（F-V16-4）
- 大量文档（100+）列表/启动 perf 未压测（F-V16-5）
- 文件夹/分组 / 标签 / 全文搜索 / 拖拽排序 / 后端同步(v2.0) 按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- 最大版（L3 持久化根基改）无 MEDIUM（迁移数据安全控住 + 实现期 e2e 兜出盖空 case）
- 附带修 async bootstrap FOUC（v1.5 以来 bootstrap 渐重的副作用）
- package.json 0.6.0 → 0.7.0

---

## v0.6.0 — Service Worker 离线（PWA / 路线图 v1.5 里程碑）（2026-06-05）

**Tag:** `v0.6.0` @ commit `dee3bdb`
**Range:** `8dcdd6f..dee3bdb`（v0.5.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.6.0
**命名:** 路线图 "v1.5" → semver **v0.6.0**（同先例）。新基础设施模块 M8。

### Scope — PWA 离线 + 可安装

| 变更 | Commit | 说明 |
|------|--------|------|
| Service Worker + precache | `296294e` | vite-plugin-pwa 1.3.0 generateSW；Workbox runtime 内联自托管（CSP `script-src 'self'` 不放宽）|
| Web App Manifest + 图标 | `296294e` | standalone + scope `/editor/`；自绘 PNG 192/512/maskable（scripts/generate-pwa-icons.mjs）|
| 更新提示 | `296294e` | registerType:prompt + virtual:pwa-register onNeedRefresh → toast action「刷新」（不静默打断）|
| toast action 扩展 | `296294e` | `show(msg,level,ms,action?)` 持久 action toast；向后兼容 3-arg |
| CSP | `296294e` | 加 `manifest-src 'self'` + `worker-src 'self'` |
| **precache 瘦身（F-V15-1）** | `551c28d` | mermaid 重 chunk 路由 assets/mmd/ + runtimeCaching(cache-on-use)；**precache 3.7MB→1.18MB（−68%）**，app+katex 仍 precache |

### Quality Gates [已验证: 2026-06-05 本机]

- 155 unit tests pass（+toast action ×3 / PWA register ×3）
- 63 e2e pass / 1 skip（chromium + webkit + **pwa project：build+preview 真 SW**，含离线 reload 可编辑 / 离线持久化 / 离线公式渲染 + 图 cache-on-use / console 干净）
- 首屏 78.19 KB gzipped（workbox-window +0.84KB；预算 150 KB）
- precache 1.18 MB（app 核心 + katex + 字体/图标；mermaid 重 chunk runtimeCaching）
- TS strict typecheck 0 error；doc-hash + fb-upstream 闸 pass

### Spec-to-Code-Flow

共识 v1.5（TBD-v15-1~4 accept）→ module-list **M8 PWA/离线** 新增 → 架构 + **ADR-009**（D1=vite-plugin-pwa / D2'=分级 precache+runtimeCaching / D3=prompt 更新 / D4=scope+CSP）→ api-spec v1.5 → test-plan v1.5 → 实现。无 data-model delta（离线复用 IndexedDB v1.1）。research-first：vite-plugin-pwa 1.3.0 + Workbox 7.4.1 + GH Pages 子路径 核实。

### Audit（2026-06-05 增量）

报告 `docs/audit/2026-06-05-v1.5-increment.md`：安全面（SW/Workbox 自托管 + CSP 不放宽）守住、首屏闸守住、离线正确性 e2e 实证。
- **F-V15-1（MEDIUM，precache 3.7MB）→ tag 前修 resolved**（`551c28d`，沿用 F-V11-1 先例）；F-V15-2 resolved
- F-V15-3~5（LOW：更新流程仅单测 / 可安装仅验 link / workbox-window 首屏）→ deferred v1.5.x

### Known Limitations（v0.6.0）

- 从未在线用过的 mermaid 图类型**离线不可用**（runtimeCaching cache-on-use 权衡，F-V15-1 修订）
- 真实"部署新版→SW 更新提示"链路仅单测覆盖（F-V15-3）
- 离线 e2e 仅 chromium（webkit SW 行为未覆盖）
- 多文档 / 后端同步 / 滚动同步 按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- F-V15-1 MEDIUM tag 前修（precache −68%）
- 离线 + 可安装 + 更新提示 e2e/单测实证
- package.json 0.5.0 → 0.6.0

---

## v0.5.0 — Mermaid 图渲染（路线图 v1.4 里程碑）（2026-06-04）

**Tag:** `v0.5.0` @ commit `8dcdd6f`
**Range:** `d612431..8dcdd6f`（v0.4.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.5.0
**命名:** 路线图 "v1.4" → semver **v0.5.0**（同先例）。**最高风险版**（SVG sanitize + 异步 + 竞态）。

### Scope — Mermaid 图渲染（懒加载 + 异步）

| 变更 | Commit | 说明 |
|------|--------|------|
| Mermaid 渲染 | `a32f43b` | mermaid 11.15.0；` ```mermaid ` fence → 占位 → 异步逐块 render |
| 懒加载 | `a32f43b` | 含图才动态 import mermaid（135KB gz 独立 chunk，首屏不含）|
| **SVG sanitize（三层）** | `a32f43b` | securityLevel:strict + htmlLabels:false（砍 foreignObject）+ DOMPurify svg profile + 显式 FORBID foreignObject/script |
| 异步编排 | `a32f43b` | per-block 渲染 + **代次令牌**防竞态（text 变 gen++，过期结果丢弃）+ 单块失败降级 |
| 占位健壮 | `a32f43b` | 源文存 div textContent（过 sanitize 更稳，非 data-*）|

### Quality Gates [已验证: 2026-06-04 本机]

- 149 unit tests pass（Mermaid 5：hasMermaid 探测/占位/escape）
- 59 e2e pass（chromium + webkit；含 ac9 Mermaid 4 场景 ×2，**含 XSS 发布门槛 E2E-v14-003**）
- 首屏 77.34 KB gzipped（mermaid 135KB + katex ~80KB 懒加载均不计；预算 150 KB）
- TS strict typecheck 0 error；doc-hash(48 refs) + fb-upstream 闸 pass

### Spec-to-Code-Flow

共识 v1.4（TBD-v14-1~5 accept）→ module-list M2 delta → 架构 + **ADR-008**（D1=DOMPurify svg profile + 显式 FORBID foreignObject/事件）→ api-spec v1.4 → test-plan v1.4 → 实现。无 data-model delta（图是渲染产物，不持久化）。research-first：mermaid 11.15.0 render API + securityLevel/htmlLabels 语义 + 恶意注入中和 核实。

### Audit（2026-06-04 增量，最高风险版）

报告 `docs/audit/2026-06-04-v1.4-increment.md`：**无 critical/high/medium**。关键正向：SVG/foreignObject XSS 大头经**降风险路径**（strict + htmlLabels:false 砍 foreignObject + 三层 sanitize）+ **e2e 双引擎发布门槛**最小化，AC-v14-3 达成（foreignObject count 0 实证 FORBID 生效）。
- F-V14-1~3 LOW（重渲染 perf / XSS 仅 e2e / 主题切换不重渲染）→ deferred v1.4.x

### Known Limitations（v0.5.0 仍不做）

- **SVG XSS 仅 e2e 覆盖**（jsdom 无法真渲染 mermaid，无单测 backstop，F-V14-2）
- mermaid 每次 text 变重渲染（无源文 hash 缓存，含图文档快速打字 CPU 浪费，F-V14-1）
- 主题切换不重渲染已存图（偏离 TBD-v14-5(a)，旧图保持旧主题到下次编辑，F-V14-3）
- 多文档 / Service Worker / 滚动同步 / 云同步 按 roadmap 推迟
- 累计 deferred LOW backlog（F-V11-3~6 / BHV-006~010 / F-V12-1~4 / F-V13-1~3 / F-V14-1~3）

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- 降风险决策（strict + htmlLabels:false + 三层 sanitize）使最高风险版无 MEDIUM
- AC-v14-3 XSS 发布门槛人工 + e2e 双引擎验证通过（ADR-008 D1 security review）
- package.json 0.4.0 → 0.5.0

---

## v0.4.0 — KaTeX 数学公式（路线图 v1.3 里程碑）（2026-06-04）

**Tag:** `v0.4.0` @ commit `d612431`
**Range:** `1826561..d612431`（v0.3.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.4.0
**命名:** 路线图 "v1.3" → semver **v0.4.0**（同先例）。Mermaid 降风险推迟 v1.4。

### Scope — KaTeX 公式渲染（懒加载）

| 变更 | Commit | 说明 |
|------|--------|------|
| KaTeX 渲染 | `1e2af26` | `@vscode/markdown-it-katex` + katex 0.17；`$…$`/`$$…$$` |
| 懒加载 | `1e2af26` | 含公式才动态 import katex（首屏不含）+ load 后 re-render |
| 安全（降风险）| `1e2af26` | output:'html'（无 MathML/SVG）+ trust:false + **不放宽 DOMPurify**（styled span 过默认 sanitize）|
| size 闸修正 | `1e2af26` | sum 整 dist → 按 index.html 首屏算（懒加载 chunk 不计）|

### Quality Gates [已验证: 2026-06-04 本机]

- 144 unit tests pass（KaTeX 10：渲染/懒加载探测/XSS DOM 断言/非公式 $）
- 51 e2e pass / 1 skip（chromium + webkit；含 ac8 KaTeX 4 场景 ×2，**含 XSS 发布门槛 E2E-v13-003**）
- 首屏 76.66 KB gzipped（katex JS ~80KB 懒加载不计；预算 150 KB）
- TS strict typecheck 0 error；doc-hash + fb-upstream 闸 pass

### Spec-to-Code-Flow

共识 v1.3（v13-1=b **KaTeX-only 降风险**，Mermaid→v1.4 / v13-2~5 accept）→ module-list M2 delta → 架构 + **ADR-007**（D1=@vscode/markdown-it-katex）→ api-spec v1.3 → test-plan v1.3 → 实现。无 data-model delta（公式不持久化）。research-first：katex 0.17 + 插件 1.1.2 API + 恶意公式中和 核实。

### Audit（2026-06-04 增量，安全敏感版）

报告 `docs/audit/2026-06-04-v1.3-increment.md`：**无 critical/high/medium**。关键正向：放行渲染输出的 XSS 面经**降风险路径**（KaTeX-only + output:html + trust:false + 不放宽 sanitize）最小化，AC-v13-3 发布门槛达成（XSS DOM 级断言，双引擎 e2e）。
- F-V13-1~3 LOW（katex CSS eager / hasMath 启发式 / size 闸语义）→ deferred v1.3.x

### Known Limitations（v0.4.0 仍不做）

- Mermaid 图（异步 + SVG sanitize 大头风险）→ v1.4
- katex CSS 因 cssCodeSplit:false 仍 eager 进首屏（<150 非阻塞，F-V13-1）
- hasMath 启发式 ≠ katex tokenizer（exotic 边界可能漏判，F-V13-2）
- 多文档 / Service Worker / 滚动同步 / 云同步 按 roadmap 推迟
- 累计 deferred LOW backlog（F-V11-3~6 / BHV-006~010 / F-V12-1~4 / F-V13-1~3）

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- 降风险决策（TBD-v13-1 选 KaTeX-only）使安全敏感版无 MEDIUM
- package.json 0.3.0 → 0.4.0

---

## v0.3.0 — URL 分享 + 导入 .md（路线图 v1.2 里程碑）（2026-06-04）

**Tag:** `v0.3.0` @ commit `1826561`
**Range:** `aa35ce9..1826561`（v0.2.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.3.0
**命名说明:** 路线图（PRD §153）称 "v1.2"；按 semver 发布为 **v0.3.0**（minor，同 v1.1→v0.2.0 先例）。

### Scope — URL 分享 + 导入 .md（I/O 闭环）

| 变更 | Commit | 说明 |
|------|--------|------|
| URL 分享 | `7e15d00` | lz-string 压缩 → `#doc=1.<payload>`（URL-safe）→ 剪贴板 + 隐私 toast；超 8000 字符拒绝 |
| 打开分享链接 | `7e15d00` | hash 解码加载；本机非空 → confirm（取消保留本机）；`replaceState` 清 hash；加载优先级 分享>IDB |
| 导入 .md | `7e15d00` | file picker（`File.text` 本地读，不上传）；当前非空 confirm |
| M4 职责扩 | `7e15d00` | 「导出」→「导入/导出 I/O」 |

### Quality Gates [已验证: 2026-06-04 本机]

- 134 unit tests pass（ShareUrl 13：往返含 CJK/特殊字符 / 超限 / 无效链接 / share() 三结果）
- 43 e2e pass / 1 skip（chromium + webkit；含 ac7 分享/打开/导入 5 场景 ×2；1 skip = AC3-002 clipboard chromium-only）
- Bundle 68.21 KB gzipped（+lz-string ~2KB；预算 150 KB）
- TS strict typecheck 0 error；文档 hash 闸 42 refs resolve

### Spec-to-Code-Flow（完整走通）

共识 v1.2（TBD-v12-1~5 accept）→ module-list M4 delta → 架构 + **ADR-006**（D1=lz-string）→ api-spec v1.2 + data-model v1.2 → test-plan v1.2 → 实现 → 验证。research-first：lz-string@1.5.0 API 往返核实。

### Audit（2026-06-04 增量）

报告 `docs/audit/2026-06-04-v1.2-increment.md`：**无 critical/high/medium**。关键正向结论：分享链接内容是**攻击者可控输入**，与导入文件内容一并经现有 markdown-it(html:false)+DOMPurify sanitize → **无新 XSS 面**；async catch 不静默（F-V11-1 教训已落实）。
- F-V12-1~3 LOW（空 payload 清空 / 导入不校验类型 / clipboard fallback）→ deferred v1.2.x

### Known Limitations（v0.3.0 仍不做）

- 分享 URL 含明文内容（base64 非加密，已 toast 告知）
- 大文档（>~8000 字符 URL）无法分享（toast 拒绝，引导用下载 .md）
- 导入不校验文件类型（二进制读为乱码，DOMPurify 兜底无害）
- 上轮 deferred 的 F-V11-3~6 + BHV-006~010 未纳入
- 多文档 / Service Worker / Mermaid+KaTeX / 滚动同步 / 云同步 各按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- e2e 自捕获并修复 bug：分享覆盖 confirm 取消时未回填本机文档（main.tsx 启动逻辑）
- package.json 0.2.0 → 0.3.0

---

## v0.2.0 — IndexedDB 持久化升级（路线图 v1.1 里程碑）（2026-06-04）

**Tag:** `v0.2.0` @ commit `aa35ce9`
**Range:** `e9555e7..aa35ce9`（v0.1.1 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.2.0
**命名说明:** 路线图（PRD §152）称此里程碑 "v1.1"；按 semver 与 v0.1.x 连续发布为 **v0.2.0**（minor，新增功能，不跳号到 v1.1.0）。

### Scope — 持久化 localStorage → IndexedDB（解 PRD R2 配额）

| 变更 | Commit | 说明 |
|------|--------|------|
| M3 IDB 后端 | `5252add` | idb@8.0.3；DB `editor`/store `kv`/key `document`；异步契约（移除同步 init → `loadStoredDocument`，clear→Promise）|
| 一次性迁移 | `5252add` | 旧 `editor.document.v1` 首次加载迁入 IDB（先写→确认→删旧幂等；put 失败保旧不丢）|
| 不可用降级 | `5252add` | IDB 不可用（隐私模式/老浏览器）→ localStorage + `storage.degraded` toast |
| 启动异步 hydrate | `5252add` | 空 editor 闪现后填入 + 竞争防护（已输入不覆盖）|
| 1MB 提示取消 | `5252add` | IDB 配额充裕，退役 `doc.large`（共识 TBD-v11-4）|
| F-V11-1/2 修复 | `c26d1db` | IDB 读错 console.error + `storage.loadError` toast（不裸吞）；resetStorage schema-safe |

### Quality Gates [已验证: 2026-06-04 本机]

- 121 unit tests pass（M3 13：迁移/幂等/put失败保旧/读错/fallback/大文档/clear）
- 33 e2e pass / 1 skip（chromium + webkit；含 E2E-v11-001 迁移验收；1 skip = AC3-002 clipboard chromium-only）
- Bundle 66.17 KB gzipped（+idb ~1.5KB；预算 150 KB，`pnpm size` 闸守护）
- TS strict `pnpm typecheck` 0 error
- 文档 commit-hash 完整性闸 39 refs 全 resolve

### Spec-to-Code-Flow（完整走通）

共识 v1.1（TBD-v11-1~5 accept）→ module-list M3 delta → 架构 + **ADR-005**（D1=idb+手写 fallback）→ api-spec v1.1 + data-model v1.1 → test-plan v1.1 → 实现 → 验证。research-first：idb@8.0.3 API 对照 entry.d.ts 核实。

### Audit（2026-06-04 增量）

报告 `docs/audit/2026-06-04-v1.1-increment.md`：迁移核心逻辑正确（幂等+数据安全+竞争防护有测试佐证）。6 findings：
- **F-V11-1 MEDIUM**（IDB 读错静默降级 + 潜在覆盖丢数据）→ **resolved**（`c26d1db`）
- **F-V11-2 LOW**（resetStorage 竞争）→ **resolved**（`c26d1db`）
- F-V11-3~6 LOW（clear 静默 / 冗余 write-back / 死 key / 写重叠）→ deferred v1.1.x

### Known Limitations（v0.2.0 仍不做）

- IDB 读错后仍"显空 + 可编辑覆盖"（已从静默升级为 toast 告知，未硬阻断编辑 — TBD-v11-1 空闪现的延伸，留 UX 决策）
- AC-v11-4（IDB 不可用降级）仅 unit 覆盖，无真机隐私模式 e2e
- 上轮 deferred 的 BHV-006~010（行号/字号 UX/a11y/perf + F1.2/F1.3/toast e2e）**未纳入本版**
- 完整 Lighthouse CI 仍 deferred（TBD-T1）；本版未重跑 Lighthouse（bundle +idb 微小，perf 预期不变）
- 多文档 / Service Worker / 滚动同步 / 云同步 各按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- findings-registry：F-V11-1/2 resolved，F-V11-3~6 + BHV-006~010 deferred
- package.json 0.1.1 → 0.2.0

---

## v0.1.1 — backlog 清理 + 过程加固（2026-06-03）

**Tag:** `v0.1.1` @ commit `e9555e7`
**Range:** `c80d2e5..e9555e7`（v0.1.0 以来）
**部署:** https://corray.github.io/editor/（GitHub Pages，自动部署）
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.1.1

### Scope — v0.1.0 audit 三 backlog umbrella 全清（#14 / #15 / #16）

| finding | Issue | Commit | 说明 |
|---------|-------|--------|------|
| GAP-003 行号 / 字号 | #15 | `6bc2977` | F1.2 行号 gutter（可 toggle，关软换行精确对齐）+ F1.3 字号 A-/A+ 三档（13/15/17）；`EditorPrefsAPI` + localStorage |
| BHV-004 mobile-safari | #15 | `20ad1c5` | Playwright 1.60 解 page.goto 超时 → AC4-003 webkit-mobile 覆盖 + 清 dead config |
| BHV-005 header 回归 | #15 | `eac71bb` | GAP-003 加 3 按钮致 320px 横向溢出（破 AC-4-001）→ `.header-actions{flex-wrap}` |
| BHV-003 perf 基线 | #15 | `13a7dce` | Lighthouse 92 / input→preview 34ms / bundle 64.26KB gz 落档；`pnpm size` CI 闸 + E2E-AC5-002 |
| IPR-T-001 commit-hash 根治 | #16 | `ab2927c` | 机械闸 `pnpm check:hashes`（扫文档 hash 引用 + git rev-parse 验证）接入 CI |
| IPR-001 fe-reviewed 跳过 | #16 | — | dismissed：一人多角色 deviation 由 PR-001 永久接受 |
| GAP-002 getRootElement | #14 | `b7ef028` | 删无消费方声明（消除契约 drift）|
| API-T-001 toast UI | #14 | `b7ef028` | console stub → 真 DOM toast（自动消失 + 动画 + aria-live，无 lib，接口冻结）|

### Quality Gates [已验证: 2026-06-03 本机]

- 125 unit tests pass，line coverage 95.47%
- 31 e2e pass / 1 skip（chromium + webkit，含 webkit + mobile context；1 skip = AC3-002 clipboard chromium-only）
- Bundle 64.64KB gzipped（预算 150KB，CI `pnpm size` 闸守护）
- TS strict `pnpm typecheck` 0 error
- 新增 CI 闸：bundle-size（gzip<150KB）+ doc commit-hash 引用完整性

### 过程改进（本版沉淀）

- **commit-hash 机械闸**（IPR-T-001 二次复发达形式化阈值）：`scripts/check-doc-hashes.mjs`，FB-002 candidate→applied / PP-002 remediation v2
- **perf 基线**：`docs/perf/baseline-v0.1.0.md`（Lighthouse / input-latency / bundle 三项 + 复测命令）
- **scope 守 TBD-T1**：只加轻量 bundle 闸，完整 Lighthouse CI 仍留 v1.1+

### Known Limitations（v0.1.1 仍不做）

- 完整 Lighthouse CI（LCP/TBT 阈值闸）留 v1.1+（TBD-T1；本版只做一次性基线 + bundle 闸）
- toast 无队列 / 上限（低频消费点，MVP 接受）
- 行号默认开时移动端长行需 textarea 内横滑（document 不溢出）
- 真机 iOS Safari 未测（webkit emulation + mobile context 覆盖）

### Closure

- 三 umbrella #14 / #15 / #16 全部 `gh issue close --completed`，open 队列归零
- findings-registry：11 原始 findings + BHV-005 全部 resolved/dismissed
- package.json version 0.0.0 → 0.1.1（补齐 v0.1.0 遗留）

---

## v0.1.0 — MVP（2026-05-20）

**Tag:** `v0.1.0` @ commit `c80d2e5`
**Range:** `11590ee..c80d2e5`（17 commits / 3 天）
**部署:** https://corray.github.io/editor/（GitHub Pages，repo PUBLIC）
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.1.0

### Scope（7 业务模块 + 集成）

| 模块 | Issue | Commit | 说明 |
|------|-------|--------|------|
| M1 EditorArea | #6 | `ed958a7` | textarea + state SoT + EditorAPI 三层 |
| M2 渲染管线 | #1 | `782314b` | markdown-it + DOMPurify pipeline |
| M2 集成 | #8 | `3becbc9` | PreviewArea + 双栏布局 |
| M3 持久化 | #2 | `e04d87d` | localStorage 状态机 + debounce + 1MB toast stub |
| M3 i18n integration | #4 | `6fa576a` | toast 文案 → t(key)（tech-debt 收编）|
| M4 导出 | #9 | `c38d408` | .md 下载 + 复制 HTML + clipboard fallback |
| M5 Layout | #12 | `a9fc822` | LayoutAPI reactive + 移动端 tabs（解 GAP-001/API-M5-001/BHV-002）|
| M6 主题 | #5 | `a01c3fb` | light/dark + 3 级 fallback + DOM/localStorage sync |
| M7 i18n | #3 | `8932faf` | singleton + zh-CN dict + 15-key whitelist |
| 整合 | #7 | `2d7650d` | main.tsx 整合 M1/M3/M6 + 反哺 M3.readStoredDocument |
| 清空交互 | #11 | `fec015b` | 清空按钮 + confirm 流程（解 GAP-004，unskip E2E-AC2-002）|
| E2E 全集 | #10 | `f03e170` | Playwright AC-1~6 6 套 + chromium + webkit（解 BHV-001）|
| 部署 | #13 | `863827c / 74fe0f9 / c80d2e5` | ADR-004 重启 + GH Pages workflow + arch §7 同步 |

### Quality Gates [已验证: v0.1.0 tag annotation]

- 108 unit tests pass，line coverage 96%+
- 28 e2e tests pass（chromium + webkit；mobile-safari emulation 单独走 iPhone SE context）
- Bundle 134KB / 62KB gzipped
- TS strict `pnpm typecheck` 0 error

### Spec-to-Code-Flow

- **上游全部 accepted**（2026-05-18 ~ 2026-05-19）：PRD v1.0 / consensus v1.0 / module-list v1.0 / architecture v1.0（TBD-A4 部署初次 deferred 后于 release 期重启）/ api-spec v1.0 / data-model v1.0 / test-plan v1.0
- **反哺 1 次**：#7 实现期发现 M3 `init()` chicken-and-egg → 加 `readStoredDocument()` 静态导出 → api-spec §3.3 同步增补
- **ADR**：001 markdown-it / 002 DOMPurify / 003 Solid（全 accepted 于 2026-05-19）；004 部署（初次 deferred 于 2026-05-19 → release 期重启 accepted 于 2026-05-20）

### Audit（2026-05-20 multiphase）

报告：`docs/audit/2026-05-20-*.md`（spec / api / behavior / issue-process 四 phase）
findings：`docs/audit/findings-registry.md` 11 条

| 状态 | 数量 | 编号 |
|------|------|------|
| resolved | 5 | GAP-001 / GAP-004 / API-M5-001 / BHV-001 / BHV-002 |
| deferred | 1 | BHV-004（mobile-safari emulation）|
| proposed | 5 | GAP-002 / GAP-003 / API-T-001 / BHV-003 / IPR-001 / IPR-T-001 |

### Known Limitations（v0.1.0 显式不做）

- `shared/toast` 仅 imperative stub，完整 UI follow-up 待 v0.1.x（API-T-001）
- M2 `PreviewAPI.getRootElement` 未实现，M4 暂绕过 pipeline.render（GAP-002）
- F1.2 行号 / F1.3 字号控件 PRD 列了未实现，无 Issue 跟踪（GAP-003）
- AC-5 Lighthouse / 真实 perf bench 未跑（BHV-003，按 TBD-T1 留 release 前 — 此处推迟）
- mobile-safari emulation 本地 `page.goto` 30s 超时，config 暂注释（BHV-004，iPhone SE context 单列覆盖 AC-4-001）
- Issue 流程 9 issues 跳过 `raised → fe-reviewed` 中间态（IPR-001，项目级 deviation 已 body 记录）

### Closure

- **2026-05-21**：Issue #1–#12 批量 `fe-in-progress → fe-confirmed` + release comment + close（#13 已于 2026-05-20 release 期 close）
- **findings-registry 变更记录**追加 2026-05-21 行（commit `7fca71a`）
- v0.1.0 issue tracker open 队列归零

