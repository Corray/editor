# 业务模块清单 v1.0 — editor MVP

| 字段 | 值 |
|------|----|
| **状态** | `accepted` (TBD-M1~M4 全部采纳 AI 倾向，§2 各模块状态升 accepted) |
| **版本** | v1.0 |
| **基线** | PRD v1.0 + 共识文档 v1.0 |
| **首版日期** | 2026-05-18 |
| **最近评审** | 2026-05-19 (v0.1 → v1.0，全盘接受) |
| **owner** | FE (Corray) |
| **下游** | → 架构设计 → 接口+数据模型 → 测试计划 → 代码 |

---

## 0. 定位

**业务模块清单 = 需求到架构的桥梁**——把共识文档中的业务能力拆成**可独立交付**的工程单元。本文档不规定**怎么实现**（那是架构层），只规定**有哪些模块、各自做什么、模块间如何依赖**。

按 spec-to-code-flow 的 §模块清单验证标准：
- 共识文档每个业务能力都有模块承接
- 每个模块的职责边界清晰，无模糊地带
- 模块间依赖关系已识别

---

## 1. 版本史

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v0.1 | 2026-05-18 | AI 基于共识 §3 起草，含 7 模块详细 + 4 项 [TBD] |
| v1.0 | 2026-05-19 | Corray 全盘接受 TBD-M1~M4；§2 各模块 status proposed → accepted；进入下游架构设计阶段 |

---

## 2. 模块总览

| 模块 | 职责（一句话）| 共识 §| PRD F | owner | 状态 | 对外依赖（外部） | 内部依赖（本项目）|
|------|-------|-------|-------|-------|------|----------|----------|
| **M1 编辑** | 维护 Markdown 源文 + 输入交互；**〔v2.1〕+查找/替换 + 格式快捷键(B/I/K toggle) + 列表自动延续 + 字数统计** | §3 / §4 (隐) + 共识 v2.1 | F1 | FE | in-dev (#6 textarea + state + API；v2.1 编辑增强) | 〔v2.1〕`document.execCommand('insertText')`（undo 保持，ADR-017）| 〔v2.1〕chrome 文案 ← M7；status bar 被 M5 容纳 |
| **M2 预览** | 实时渲染 Markdown 为 HTML；**〔v2.3〕+fenced code 语法高亮（hljs 懒加载，不放宽 sanitize）** | §4.2 + 共识 v2.3 | F2 | FE | in-dev (#1 pipeline + #8 PreviewArea 挂载；v2.3 highlight) | sanitize 库 DOMPurify v3.4.5（ADR-002 accepted）、Markdown 渲染库 markdown-it v14.1.1（ADR-001 accepted）、〔v2.3〕highlight.js 11.11.1 lib/common 懒加载（ADR-019）| ← M1 |
| **M3 持久化** | localStorage 读写 + 状态机；**〔v1.6〕写目标改 active doc（经 M9）** | §4.1 / §5 | F3 | FE | in-dev (#2 store + debounce；v1.6 改造写目标) | localStorage Web API + shared/toast.ts；〔v1.6〕← M9 | ← M1 |
| **M4 导出** | 下载 .md + 复制 HTML | §4.3 | F4 | FE | in-dev (#9 实现) | File / Blob API、Clipboard API | ← M1（text accessor）, ← M2 pipeline.render |
| **M5 布局** | 响应式双栏 / tab 切换 | §3 (依赖图) | F5 | FE | in-dev (#12 完整 LayoutAPI) | matchMedia API（reactive viewport）+ Solid signals | 容纳 M1/M2 + 装饰 M6 |
| **M6 主题** | 浅深色切换 + 持久化 | §4.4 | F6 | FE | in-dev (#5 实现) | `prefers-color-scheme` media query、localStorage | → 写 `<html>.dataset.theme`（M5 容器及全文档 CSS Variables 响应）|
| **M7 i18n** | UI 字符串抽象 + 中文 dict | §4.5 | §5 (非功能) | FE | in-dev (#3 实现) | — | 横切，被 M1-M6 chrome 文案消费 |
| **M8 PWA/离线**〔v1.5 新增〕| Service Worker precache 离线 + Manifest 可安装 + 更新提示 | 共识 v1.5 | PRD §7 v1.1 候选 | FE | proposed (v1.5) | vite-plugin-pwa 1.3.0 / Workbox 7.4.1（构建期）、Service Worker / Cache API、`virtual:pwa-register` | 横切基础设施；更新提示 → shared/toast.ts；不依赖业务模块 |
| **M9 文档管理**〔v1.6 新增〕| 多文档模型（列表 + active）+ CRUD + 单→多迁移 + 标题派生 + documents store I/O；**〔v2.6〕+版本快照（snapshots store DB v3 + 自动 piggyback + 历史/恢复）** | 共识 v1.6 + v2.6 | PRD §7 v1.1 候选 | FE | proposed (v1.6) | IndexedDB documents+snapshots store（DB v3）、`crypto.randomUUID` | → M1（切换 set DocumentState）、← M3（M3 经 saveActiveText 写）、被 M5（sidebar/抽屉）+ M4（import/share 涟漪）消费；〔v2.6〕HistoryDialog 由 AppShell 装配 |
| **M10 滚动同步**〔v1.7 新增〕| 桌面编辑↔预览滚动联动（source-line 映射 + 双向 + 反馈环防护）| 共识 v1.7 | defer 项（非 PRD §7）| FE | proposed (v1.7) | DOM scroll API、requestAnimationFrame | ← M2（读 data-source-line）、← M1/M5（editor/preview DOM ref），桌面 only |
| **M12 大纲**〔v2.2 新增〕| 源文 ATX 标题解析（跳 fenced）→ 大纲面板 + 点击跳转编辑器行（预览靠 M10 联动） | 共识 v2.2 | PM 新拍 scope | FE | proposed (v2.2) | — | 纯派生态；OutlinePanel 由 AppShell 组合进 M9 sidebar 下半分区（children slot，M12 不依赖 M9）；跳转消费 M1 textarea ref |
| **M11 同步网关 + 账号**〔v2.0 新增 / **破纯 FE**〕| 封装 supabase-js：账号(magic link auth) + 文档云同步(local-first + LWW) | 共识 v2.0 | PRD §7 v2.0 | FE→BaaS | proposed (v2.0) | `@supabase/supabase-js` 2.107.0 + Supabase(Auth/Postgres/RLS) | Gateway 封装(arch §7)；→ M9(push/pull/首登 merge)；UI 登录态；**security-review 全程** |

### 状态枚举（refers `artifact-based-handoff.md`）

| 状态 | 含义 |
|------|------|
| `proposed` | 已识别，未启动 |
| `accepted` | 设计评审通过，可启动 |
| `in-dev` | 实现中 |
| `shipped` | 已发版（v1.0 MVP 发版定义见 PRD §7）|
| `deferred` | 推迟到后续版本（含明确版本号）|

---

## 3. 各模块详细

### M1 编辑

| 维度 | 内容 |
|------|------|
| **核心职责** | 承载 Markdown 源文（document state），处理键盘 / 触摸输入，提供字号 / 行高 / 行号 UI |
| **输入** | 用户键盘 / 触摸事件、初始化时从 M3 读取的源文 |
| **输出** | `document.text` (string) 状态、`onChange(text)` 事件流（供 M2 / M3 订阅）|
| **PRD 功能项** | F1.1 单输入区域 / F1.2 行号 / F1.3 字号行高 |
| **AC 覆盖** | AC-1 (输入回显)、AC-5 (1000 行 < 50ms) |
| **内部组件（暂定）** | `EditorArea` (textarea 或 contenteditable) / `GutterLineNumbers` / `FontControls` |
| **不做（明确边界）** | 不做 Markdown 解析（M2 的事）/ 不做持久化（M3 的事）/ 不做 chrome 文案（M7 的事）|

### M2 预览

| 维度 | 内容 |
|------|------|
| **核心职责** | 订阅 M1 状态变更，调用渲染管线（parse → sanitize → DOM），输出预览 DOM；〔v1.3〕KaTeX 公式插件（懒加载）；**〔v1.4〕Mermaid 图（懒加载 + per-block 异步渲染）** |
| **输入** | M1 的 `document.text` |
| **输出** | 渲染后的 DOM 节点（供 M4 复制 HTML 时读取 innerHTML）|
| **PRD 功能项** | F2.1 渲染区 / F2.2 CommonMark 全集 / F2.3 滚动同步（MVP 不做）/ 〔v1.3〕KaTeX / **〔v1.4〕Mermaid 图** |
| **AC 覆盖** | AC-1 / AC-5 / 〔v1.3〕AC-v13-1~5 / **〔v1.4〕AC-v14-1~6（图渲染 / 不加载 / 恶意 SVG 注入 XSS / 失败降级 / 竞态 / 主题）** |
| **内部组件** | `PreviewArea` / `MarkdownPipeline` / 〔v1.3〕`katex` 懒加载 / **〔v1.4〕`mermaid` 懒加载 + per-block 异步渲染（占位→填充，代次令牌防竞态）** |
| **关键约束** | **必须 sanitize**（共识 TBD-4）；〔v1.3〕KaTeX MathML/HTML 受控放行；**〔v1.4〕Mermaid SVG 受控放行（securityLevel:strict + htmlLabels:false 砍 foreignObject + DOMPurify SVG profile），安全红线/发布门槛，需 security review（共识 TBD-v14-1 / ADR-008）** |
| **渲染时序** | 同步基底（markdown + 已载 KaTeX）；〔v1.3〕KaTeX 一次性懒加载 re-render；**〔v1.4〕Mermaid 块同步出占位 → 异步逐块 render → 替换（代次令牌丢弃过期，防串图）** |
| **bundle** | 〔v1.3〕KaTeX 懒加载；**〔v1.4〕Mermaid（数百 KB）动态 import code-split，无图文档不加载（守 150KB 首屏闸）** |
| **不做** | 不写源文回 M1 / 不做滚动同步（v1.1+）/ **〔v1.4〕Mermaid 不开 foreignObject HTML 标签 / click 交互（securityLevel:strict）** |

### M3 持久化

| 维度 | 内容 |
|------|------|
| **核心职责** | M1 状态变更后 debounce 500ms 写入；页面打开时**异步**还原；提供清空操作；**〔v1.1〕首次加载迁移旧 localStorage → IndexedDB** |
| **输入** | M1 的 `onChange` 事件流、清空按钮触发 |
| **输出** | **〔v1.1〕异步** hydrate 还原的源文给 M1（不再同步 init）；写入失败时 toast 提示 |
| **PRD 功能项** | F3.1 debounce 写入 / F3.2 还原 / F3.3 清空 |
| **AC 覆盖** | AC-2（持久化往返）+ **〔v1.1〕AC-v11-1~5**（迁移 / 异步态 / 大文档 / IDB 降级 / 清空）|
| **状态机** | IDLE / DIRTY / SAVING / ERROR（见共识 §5；〔v1.1〕SAVING 变真异步态）|
| **存储后端** | ~~localStorage `editor.document.v1`~~ → **〔v1.1〕IndexedDB**（schema/库见 data-model v2 + ADR-005）；旧 key 迁移后删除（共识 TBD-v11-2）|
| **错误处理** | 写失败 → toast；**〔v1.1〕IDB 不可用（隐私模式/老浏览器）→ 降级 localStorage + toast（共识 TBD-v11-3）** |
| **不做** | 不做云同步（v2.0）/ 不做多文档（v1.2+）/ ~~不做 IndexedDB~~（〔v1.1〕已纳入）|

### M4 导入 / 导出 I/O〔v1.2 职责扩，原「导出」〕

| 维度 | 内容 |
|------|------|
| **核心职责** | 下载 .md + 复制 HTML + **〔v1.2〕URL 分享（内容编码进 hash）+ 导入 .md 文件** |
| **输入** | M1 的 `document.text`；**〔v1.2〕本地 .md 文件（File.text）/ 打开链接的 `#doc=` hash 参数** |
| **输出** | 文件下载 / 剪贴板写入；**〔v1.2〕分享 URL（复制到剪贴板）/ 导入内容写回 M1** |
| **PRD 功能项** | F4.1 .md / F4.2 HTML / **〔v1.2〕URL 分享 + 导入 .md（§153）** |
| **AC 覆盖** | AC-3 + **〔v1.2〕AC-v12-1~6** |
| **内部组件** | `ExportMd` / `CopyHtml` / **〔v1.2〕`ShareUrl`（编码+压缩）/ `ImportFile`** |
| **文件名** | `editor-YYYYMMDD-HHmmss.md`（本地时区，共识 TBD-6）|
| **HTML 范围** | innerHTML 无 outer wrapper（共识 TBD-7）|
| **〔v1.2〕分享编码** | base64（含压缩）非加密；hash fragment `#doc=`（共识 TBD-v12-1/2，格式见 data-model delta + ADR-006）|
| **〔v1.2〕覆盖保护** | 打开分享链接 / 导入，当前文档非空 → confirm 再替换（共识 TBD-v12-3/4，与 clear 同范式）|
| **错误处理** | Clipboard 不可用 toast；**〔v1.2〕超限 toast 拒绝 / 非 .md / 读失败 toast / 隐私明文提示** |
| **写回边界** | 导入/打开分享内容写 M1 走 `EditorAPI.setTextFromStorage`（既有契约，复用）；持久化由 M3 自动接管 |

### M5 布局

| 维度 | 内容 |
|------|------|
| **核心职责** | 响应式容器，桌面双栏 / 移动单栏（tab 切换） |
| **输入** | viewport 宽度（CSS media query） |
| **输出** | DOM 容器布局 |
| **PRD 功能项** | F5.1 单栏 tab / F5.2 30fps 滚动 |
| **AC 覆盖** | AC-4 (移动端可用) |
| **内部组件** | `AppShell` / `DesktopLayout` / `MobileLayout` / `MobileTabSwitch` |
| **断点** | 桌面 / 移动切换在 768px |
| **不做** | 不做侧边栏（多文档 v1.1+）|

### M6 主题

| 维度 | 内容 |
|------|------|
| **核心职责** | 浅深色切换 UI、根据系统 `prefers-color-scheme` 初始化、写入 M5 容器 `data-theme` class |
| **输入** | 用户点击切换按钮 / 系统主题变化（media query 监听） |
| **输出** | M5 容器的 `data-theme="light" \| "dark"` 属性 |
| **PRD 功能项** | F6.1 切换 / F6.2 持久化 |
| **AC 覆盖** | AC-6 (主题切换 + 持久化) |
| **localStorage key** | `editor.theme.v1` |
| **默认值** | 跟随系统，缺省浅色 |
| **不做** | 不做自定义主题色（v1.x 不做）|

### M7 i18n

| 维度 | 内容 |
|------|------|
| **核心职责** | UI 字符串抽象层，所有 chrome 文案走 `t('key')` 调用 |
| **输入** | 当前语言（MVP 硬编中文，预留切换接口）|
| **输出** | 翻译后的字符串 |
| **PRD 功能项** | §5 国际化（非功能）|
| **AC 覆盖** | 无 AC 直接覆盖（v1.0 中文-only），但需测试 chrome 文案全部走抽象 |
| **内部组件** | `i18n.ts`（极简 dict + `t()` 函数 + 当前语言变量）|
| **MVP 内容** | 中文 dict 涵盖：清空 / 下载 / 复制 / 主题切换 / 默认占位符 / toast 文案 |
| **不做** | 不做语言切换 UI（v1.1+）/ 不做复数变形 / 不做日期本地化 |

### M8 PWA/离线〔v1.5 新增〕

| 维度 | 内容 |
|------|------|
| **核心职责** | Service Worker precache 静态资源（离线可用）+ Web App Manifest（可安装）+ SW 更新提示 |
| **输入** | 构建产物（Vite hashed 资源 + 懒加载 chunk）；运行时网络状态 |
| **输出** | 离线可访问的应用；安装入口；有更新时 toast 提示 |
| **PRD 功能项** | §7 v1.1 候选「Service Worker 离线」|
| **AC 覆盖** | AC-v15-1~6（离线打开 / 离线编辑持久化 / 离线渲染公式图 / 更新提示 / 可安装 / CSP 干净）|
| **内部组件** | `vite.config.ts` VitePWA 插件配置；`public/` 图标 + manifest（插件生成）；`main.tsx` SW 注册（`virtual:pwa-register` onNeedRefresh → toast）|
| **决策** | ADR-009（D1=vite-plugin-pwa / D2=含懒加载 chunk / D3=prompt 更新 / D4=scope `/editor/` + CSP manifest-src）|
| **不做** | 不做后台同步 / push 通知（v2+ 账号体系）/ 不动持久化模型 / 不动渲染管线 |
| **边界** | 横切基础设施，不侵入 M1-M7 业务逻辑；仅复用 M7 i18n（更新文案）+ shared/toast（提示载体）|

### M9 文档管理〔v1.6 新增〕

| 维度 | 内容 |
|------|------|
| **核心职责** | 多文档模型：doc 列表（signal）+ activeId + CRUD（create/switch/remove）+ documents store I/O + 单→多迁移 + 标题自动派生 |
| **输入** | 用户操作（新建/切换/删除）；M3 的 active doc 文本（saveActiveText）；启动迁移旧单 doc |
| **输出** | `docs()` 列表 + `activeId()`（供 UI）；切换时 set M1 DocumentState |
| **PRD 功能项** | §7 v1.1 候选「多文档（文件列表）」|
| **AC 覆盖** | AC-v16-1~8 |
| **内部组件** | `m9-doc-manager/`：`store.ts`（documents store + 迁移 loadInitialDocs）、`manager.ts`（DocManagerAPI + signals）、`title.ts`（派生）、`idPrefix.ts`（`D_`）、`DocList.tsx`（桌面）、`DocDrawer.tsx`（移动）|
| **决策** | ADR-010（D1 documents store / D2 D_uuid / D3 先写后删迁移 / D4 M3-M9 分解 / D5 标题派生 / D6 涟漪 / D7 抽屉）|
| **不做** | 文件夹/分组 / 标签 / 拖拽排序 / 多 tab race 处理（〔v1.8〕**手动重命名 + 标题/内容搜索已加**，见下）|
| **〔v1.8 增强〕** | +`rename(id,title)`（titleManual 锁，解 F-V16-2）+`query`/`setQuery`（docs() 按 title+text 过滤）；DocRecord +titleManual；DocList 搜索框 + 内联双击重命名（ADR-012）|
| **边界** | 拥有 documents store 唯一写权（单写者）；M3 经 saveActiveText 间接写；不侵入渲染（M2）/ 主题（M6）|

### M11 同步网关 + 账号〔v2.0 新增 / 破纯 FE〕

| 维度 | 内容 |
|------|------|
| **核心职责** | 封装 supabase-js（Gateway，arch §7）：AuthGateway（magic link 登录/登出/态）+ SyncGateway（文档云 CRUD + push/pull + 首登并集 + LWW + 软删）|
| **输入** | 用户登录操作；M9 本地 doc 变更（push 触发）；启动/focus（pull 触发）|
| **输出** | 登录态 + 当前用户；云端 doc ↔ 本地 doc 合并（经 M9）|
| **PRD 功能项** | §7 v2.0 后端同步 |
| **AC 覆盖** | AC-v20-1~7（含 AC-v20-6 RLS 隔离发布门槛）|
| **内部组件** | `m11-sync/`：`client.ts`（supabase client + env）、`auth.ts`（AuthGateway）、`sync.ts`（SyncGateway: push/pull/merge/LWW/软删）、`mock.ts`（测试 mock client）；UI 登录入口 |
| **决策** | ADR-013(Supabase) / ADR-014(magic link) / ADR-015(local-first LWW 首登并集软删) / ADR-016(RLS 安全核心) |
| **不做** | 实时同步 / CRDT 字段合并 / 协作 / 分享他人 / E2EE（推 v2.1+）|
| **边界** | **唯一**碰 supabase-js 的模块（Gateway）；FE 不做安全决策（授权在 RLS）；匿名用户不依赖本模块（纯本地不变）|

### M10 滚动同步〔v1.7 新增〕

| 维度 | 内容 |
|------|------|
| **核心职责** | 桌面双栏编辑↔预览滚动联动：source-line 映射 + 双向 + 反馈环防护 |
| **输入** | editor textarea + preview 容器 DOM ref；M2 渲染的 `data-source-line` 属性；scroll 事件 |
| **输出** | 被驱动方 scrollTop（程序滚动对齐）|
| **PRD 功能项** | 非 PRD §7（consensus defer 3 次的项）|
| **AC 覆盖** | AC-v17-1~5 |
| **内部组件** | `m10-scroll-sync/sync.ts`（`createScrollSync(editorEl, previewEl, lineHeight)` → 装监听 + 映射 + 反馈环防护 + dispose）|
| **决策** | ADR-011（D1 source-line / D2 ADD_ATTR data-source-line + XSS 复验 / D3 syncing 反馈环 / D4 双向+桌面 only / D5 M10）|
| **不做** | 移动端 / 当前行高亮 / 光标定位 / 拖拽分栏 / 同步开关（常开） |
| **边界** | 不改持久化/数据模型；依赖 M2 的 data-source-line（render 加）；桌面 viewport 才挂载（viewport 切换 mount/unmount）|

---

## 4. 模块间通信契约（接口设计阶段细化）

> 本节为**接口约定预声明**，具体类型 / 时序图在下游「接口设计」节点细化。

```
M1 编辑 ──onChange(text)──→ M2 预览  (订阅，同步渲染)
              │
              └─onChange(text)──→ M3 持久化 (debounce 500ms 触发 setItem)

M3 持久化 ──init(text)──→ M1 编辑  (页面打开时回填)

M4 导出 ──read text──→ M1 编辑
M4 导出 ──read innerHTML──→ M2 预览

M5 布局 ──viewport state──→ M1 / M2 (双栏 vs 单栏)

M6 主题 ──data-theme attr──→ M5 容器  (CSS variable 驱动)

M7 i18n ──t(key)──→ M1-M6 所有 chrome 文案
```

**关键约束：**

- M1 是源文的**唯一 SoT**（Single Source of Truth）— M2 / M3 / M4 都从 M1 读，不直接持有源文
- M3 写入失败不阻断 M1 编辑功能（错误降级）
- M7 调用必须**同步**（页面初次渲染时已就绪），不能异步加载字典文件

---

## 5. 追溯链总表

### PRD F-编号 → 模块映射（验证：F 全集覆盖）

| PRD F | 模块 | 覆盖完整 |
|-------|------|---------|
| F1.1-1.3 | M1 | ✓ |
| F2.1-2.3 | M2 | ✓（F2.3 推迟 v1.1+）|
| F3.1-3.3 | M3 | ✓ |
| F4.1-4.2 | M4 | ✓ |
| F5.1-5.2 | M5 | ✓ |
| F6.1-6.2 | M6 | ✓ |
| §5 国际化 | M7 | ✓ |

### AC-编号 → 模块映射（验证：AC 全集覆盖）

| AC | 涉及模块 | 主要负责 |
|----|--------|---------|
| AC-1 编辑+预览闭环 | M1 + M2 | M2 |
| AC-2 持久化往返 | M1 + M3 | M3 |
| AC-3 导出 .md + 复制 HTML | M1 + M2 + M4 | M4 |
| AC-4 移动端可用 | M5 + M1 + M2 | M5 |
| AC-5 性能 (1000 行 / Lighthouse) | M1 + M2 | M2（渲染瓶颈）|
| AC-6 主题切换 | M5 + M6 | M6 |

### 共识 §章节 → 模块映射

| 共识 § | 模块 |
|--------|------|
| §3 模块边界（M1-M7 框架） | 全部 |
| §4.1 持久化规则 | M3 |
| §4.2 渲染规则 | M2 |
| §4.3 导出规则 | M4 |
| §4.4 主题规则 | M6 |
| §4.5 i18n 规则 | M7 |
| §4.6 错误边界 | 横切（M1-M4 均涉及）|
| §5 状态机 | M3 |
| §6 非功能约束 | 横切（M2 渲染主战场）|

---

## 6. GitHub Issue label 规范

按 standard `templates/labels.yml.template` 风格扩展，本项目模块 label 约定：

| Label | 含义 |
|-------|------|
| `module/m1-editor` | 涉及 M1 编辑模块 |
| `module/m2-preview` | 涉及 M2 预览 |
| `module/m3-persist` | 涉及 M3 持久化 |
| `module/m4-export` | 涉及 M4 导出 |
| `module/m5-layout` | 涉及 M5 布局 |
| `module/m6-theme` | 涉及 M6 主题 |
| `module/m7-i18n` | 涉及 M7 i18n |
| `module/cross-cutting` | 横切（错误降级 / 性能优化 / 非功能）|

> `/issue` skill 处理时按 label 路由到对应模块负责人（本项目都是 Corray，但 label 仍标，便于过滤）。

---

## 7. 决议汇总（原 TBD-M1~M4 待对齐清单）

| # | 议题 | 决议（v1.0）|
|---|------|-----------|
| TBD-M1 | M7 i18n 算业务模块还是 utility？ | ✓ 算业务模块（与共识 §3 一致，横切关注点保留模块身份）|
| TBD-M2 | 模块 label 命名 | ✓ `module/m1-editor`（带编号便于扫表对照）|
| TBD-M3 | M4 / M6 小模块合并 Utility？ | ✓ 不合并（保留共识结构，追溯链稳定）|
| TBD-M4 | 发版策略 | ✓ MVP 整 PR（单人开发 / MVP 范围小，避免碎 PR）|

> 全部 4 项已转为正式决议。后续如有变更，走「§1 版本史」追加版本号。

---

## 8. 评审决策记录

| 日期 | 评审人 | 决议 | 备注 |
|------|-------|------|------|
| 2026-05-19 | Corray | v0.1 → v1.0，全盘接受 TBD-M1~M4 | AI 倾向方案全部采纳；§2 各模块状态升 accepted；进入下游架构阶段 |

**下一步：** 进入 spec-to-code-flow 主路径，下一节点 = **架构设计 + ADR**（按共识 + 模块清单决定渲染库 / sanitize 库 / 构建工具 / 部署目标）。
