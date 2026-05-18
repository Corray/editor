# PRD v1.0 — editor MVP

| 字段 | 值 |
|------|----|
| **状态** | `accepted` (评审通过，作为下游共识文档评审基线) |
| **版本** | v1.0 |
| **作者** | AI draft (Claude Opus 4.7) → Corray 评审 |
| **首版日期** | 2026-05-18 |
| **最近评审** | 2026-05-18 (v0.1 → v1.0，全盘接受) |
| **流派** | github (issue_repo: `Corray/editor`) |
| **下游接入** | 已就绪 → 共识文档 → 业务模块清单 → 架构设计（见 spec-to-code-flow）|

---

## 版本史

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v0.1 | 2026-05-18 | AI 草案。基于项目名 `editor` + 上下文 (FE / Node-TS / business / github) 推断「Web 轻量 Markdown 编辑器」MVP 范围；§9 列 I1-I7 共 7 项推断点待评审 |
| v1.0 | 2026-05-18 | Corray 全盘接受 I1-I7，升 v1.0；本版作为下游共识文档评审基线 |

---

## 1. 背景与动机

现有 Markdown 编辑器要么过重（VSCode 系，桌面端 + 插件生态包袱），要么过弱（GitHub web 编辑器，无实时预览 / 无快捷键）。中间存在「打开浏览器即用、零安装、保留 Markdown 直白手感、有合理预览」的空白点。本项目填补这个空白：**Web-based 轻量 Markdown 编辑器，单人单文档，开箱即用**。

---

## 2. 目标 / 非目标

### 目标 (in-scope, MVP)

| # | 目标 | 验证方式 |
|---|------|---------|
| G1 | 浏览器打开即用，零安装零登录 | 部署后任意访客可立即编辑 |
| G2 | 实时分屏预览（左编辑 / 右渲染） | 输入 Markdown 50ms 内右侧渲染更新 |
| G3 | 本地持久化（不丢稿） | 关闭浏览器再打开，内容仍在 |
| G4 | 移动端可用（视野次要，但不能崩溃） | iPhone Safari 能编辑 + 看预览 |

### 非目标 (out-of-scope, MVP 阶段)

- ❌ 多用户协作 / 实时同步（v1.x 不做）
- ❌ 后端 / 账号系统 / 云端存储
- ❌ 富文本所见即所得（WYSIWYG）
- ❌ 插件 / 主题市场
- ❌ Markdown 扩展语法（mermaid / katex / 代码高亮全套等）—— MVP 仅基础 CommonMark
- ❌ 文件管理（多文件 / 文件夹）—— MVP 仅单文档

---

## 3. 目标用户 + 使用场景

### 主用户画像

| 维度 | 描述 |
|------|------|
| **职业** | 开发者 / 技术写作者 / 笔记习惯者 |
| **设备** | 桌面浏览器为主，移动 Safari/Chrome 为辅 |
| **技术理解** | 知道 Markdown 语法，能识别 `#` `**` `[]()` |

### 核心使用场景

1. **场景 A — 临时草稿**：开会前 5 分钟想列个 outline，打开浏览器写完复制走，**不想用 IDE 也不想登录 Notion**
2. **场景 B — 移动端速记**：地铁里想到一段内容，手机打开编辑、本地存好、回家后台式机继续编辑
3. **场景 C — Markdown 预览校验**：从别处粘贴一段 Markdown，看渲染效果对不对

---

## 4. MVP 功能清单 (v1.0 范围)

### F1 — 编辑器面板

- F1.1 单 textarea / contenteditable 区域承载 Markdown 源文
- F1.2 行号显示（可选，默认开）
- F1.3 字号 / 行高可调（默认值即可，调节交互极简）

### F2 — 预览面板

- F2.1 右侧实时渲染区
- F2.2 渲染支持 CommonMark 全集（headings / lists / blockquote / table / code-block / link / image / emphasis）
- F2.3 渲染滚动与编辑器同步（次要，best-effort）

### F3 — 持久化

- F3.1 输入停止 500ms 后写入 `localStorage`
- F3.2 页面打开时从 `localStorage` 还原
- F3.3 「清空」按钮（含二次确认）

### F4 — 导出

- F4.1 下载 `.md` 源文件
- F4.2 复制渲染 HTML 到剪贴板

### F5 — 移动端适配

- F5.1 < 768px 单栏切换（tab 切编辑 / 预览）
- F5.2 触摸滚动不卡顿（30fps 下限）

### F6 — UI / 主题

- F6.1 默认浅色 + 一键切深色
- F6.2 主题选择持久化（`localStorage`）

---

## 5. 非功能要求

| 维度 | 要求 |
|------|------|
| **性能** | 首屏 < 1s（gzipped bundle < 150KB），输入到预览更新 < 50ms（1000 行内）|
| **兼容性** | 现代浏览器最近两个大版本（Chrome / Safari / Firefox / Edge）|
| **国际化** | UI 字符串走 i18n 抽象，首版仅中文，预留英文/日文接入点 |
| **可访问性** | 键盘可达基本操作（Tab/Enter/Esc）；表单字段有 aria-label |
| **隐私** | 不上报、不打点、不联网（除了首次加载资源）|
| **离线** | Service Worker（v1.1+，MVP 可砍）|

---

## 6. 验收条件 (→ 下游测试计划基线)

### AC-1 编辑+预览闭环
- 用户输入 `# Hello`，右侧 500ms 内显示 H1 渲染
- 用户输入复杂 Markdown（含 table / code / link / image），全部按 CommonMark 渲染

### AC-2 持久化
- 用户输入内容 → 关闭浏览器 → 重新打开 → 内容仍在
- 用户点「清空」+ 确认 → localStorage 该 key 被清

### AC-3 导出
- 点「下载 .md」→ 浏览器触发文件下载，文件名格式 `editor-YYYYMMDD-HHmmss.md`，内容与编辑器一致
- 点「复制 HTML」→ 剪贴板含渲染后的 HTML

### AC-4 移动端
- iPhone 14 Pro Safari (≥ iOS 17) 打开站点：可切 tab、可编辑、可保存、可下载
- 屏幕宽 320px 设备无横向滚动条

### AC-5 性能基线
- Chrome 最新版 Lighthouse Performance ≥ 90
- 输入 1000 行 Markdown，预览更新 < 50ms（DevTools Profile 验证）

### AC-6 主题切换
- 切深色 → 编辑区 + 预览区 + chrome 全部切换
- 刷新页面，主题保持

---

## 7. 后续迭代设想 (非承诺)

| 版本 | 候选功能 |
|------|---------|
| v1.1 | Service Worker 离线 / 多文档（左侧文件列表）/ Mermaid + KaTeX 扩展 |
| v1.2 | URL 分享（base64 编码内容到 query string）/ 导入 .md 文件 |
| v2.0 | 后端同步（IndexedDB → 云端，进入需账号体系）|

---

## 8. 风险与依赖

| 风险 | 影响 | 当前缓解 |
|------|------|---------|
| **R1** Markdown 渲染库选型 | 性能 / 安全（XSS）/ 包体积 | 待架构阶段对比 marked / markdown-it / micromark，**ADR 决策** |
| **R2** localStorage 配额（5-10MB） | 长文档会超 | MVP 接受，v1.1 切 IndexedDB |
| **R3** 移动端 contenteditable 体验差 | 用户流失 | 移动端用 textarea 退化方案 |
| **R4** PRD 推断不准（最大风险） | 整个 PRD 重写 | 评审前置门禁，本文档 §0 已标注待评审 |

### 外部依赖

- 部署目标：[TBD] GitHub Pages / Vercel / Cloudflare Pages 任一即可
- CI：[TBD] 现阶段无（待业务代码 init 后补 GitHub Actions）

---

## 9. 评审决议汇总（原 I1-I7 推断点）

| # | 决议项 | v1.0 状态 |
|---|-------|----------|
| **I1** | editor = Web 轻量 Markdown 编辑器（基线项，决定 I2-I7） | ✓ 接受 |
| I2 | 单人单文档（不做多文档管理）| ✓ 接受 |
| I3 | 纯 FE SPA / 无后端 | ✓ 接受 |
| I4 | 浏览器 localStorage 持久化（v1.1+ 切 IndexedDB）| ✓ 接受 |
| I5 | CommonMark only / 无扩展语法 | ✓ 接受 |
| I6 | 中文 UI 首版，预留 i18n 抽象点 | ✓ 接受 |
| I7 | 验收性能阈值：Lighthouse ≥ 90、输入到预览 < 50ms（1000 行内）| ✓ 接受 |

> 全部 7 项推断已转为正式决议。后续变更走「§版本史」追加版本号。

---

## 10. 评审决策记录

| 日期 | 评审人 | 决议 | 备注 |
|------|-------|------|------|
| 2026-05-18 | Corray | v0.1 → v1.0，全盘接受 | I1-I7 全部确认；本版作为下游共识文档评审基线 |

**下一步：** v1.0 作为共识文档评审基线进入 spec-to-code-flow 入口接口点。下游产出物（业务模块清单 / 架构设计 / 接口+数据模型 / 测试计划）按主路径依次产出。
