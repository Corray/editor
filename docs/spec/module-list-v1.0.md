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
| **M1 编辑** | 维护 Markdown 源文 + 输入交互 | §3 / §4 (隐) | F1 | FE | accepted | — | — |
| **M2 预览** | 实时渲染 Markdown 为 HTML | §4.2 | F2 | FE | in-dev (#1 pipeline 已实现) | sanitize 库 DOMPurify v3.4.5（ADR-002 accepted）、Markdown 渲染库 markdown-it v14.1.1（ADR-001 accepted） | ← M1 |
| **M3 持久化** | localStorage 读写 + 状态机 | §4.1 / §5 | F3 | FE | in-dev (#2 store + debounce 已实现) | localStorage Web API + shared/toast.ts | ← M1 |
| **M4 导出** | 下载 .md + 复制 HTML | §4.3 | F4 | FE | accepted | File / Blob API、Clipboard API | ← M1, ← M2 |
| **M5 布局** | 响应式双栏 / tab 切换 | §3 (依赖图) | F5 | FE | accepted | CSS Container Queries / media queries | 容纳 M1/M2 + 装饰 M6 |
| **M6 主题** | 浅深色切换 + 持久化 | §4.4 | F6 | FE | accepted | `prefers-color-scheme` media query、localStorage | → M5 (写入 data-theme) |
| **M7 i18n** | UI 字符串抽象 + 中文 dict | §4.5 | §5 (非功能) | FE | in-dev (#3 实现) | — | 横切，被 M1-M6 chrome 文案消费 |

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
| **核心职责** | 订阅 M1 状态变更，调用渲染管线（parse → sanitize → DOM），输出预览 DOM |
| **输入** | M1 的 `document.text` |
| **输出** | 渲染后的 DOM 节点（供 M4 复制 HTML 时读取 innerHTML）|
| **PRD 功能项** | F2.1 渲染区 / F2.2 CommonMark 全集 / F2.3 滚动同步（MVP 不做）|
| **AC 覆盖** | AC-1 (基础 + 复杂 Markdown 渲染)、AC-5 (性能) |
| **内部组件** | `PreviewArea` / `MarkdownPipeline (parse + sanitize)` |
| **关键约束** | **必须 sanitize**（共识 TBD-4 决议，安全红线）|
| **不做** | 不写源文回 M1 / 不做滚动同步（v1.1+）|

### M3 持久化

| 维度 | 内容 |
|------|------|
| **核心职责** | M1 状态变更后 debounce 500ms 写入 localStorage；页面打开时还原；提供清空操作 |
| **输入** | M1 的 `onChange` 事件流、清空按钮触发 |
| **输出** | 初始化时返回还原的源文给 M1；写入失败时 toast 提示 |
| **PRD 功能项** | F3.1 debounce 写入 / F3.2 还原 / F3.3 清空 |
| **AC 覆盖** | AC-2 (持久化往返) |
| **状态机** | IDLE / DIRTY / SAVING / ERROR（见共识 §5）|
| **localStorage key** | `editor.document.v1` |
| **错误处理** | QuotaExceededError → toast（共识 TBD-3）|
| **不做** | 不做云同步 / 不做 IndexedDB（v1.1+ 切换）|

### M4 导出

| 维度 | 内容 |
|------|------|
| **核心职责** | 提供下载 .md 文件 + 复制 HTML 到剪贴板两个操作 |
| **输入** | M1 的 `document.text`、M2 的渲染 DOM 节点（取 innerHTML） |
| **输出** | 文件下载（浏览器触发）/ 剪贴板写入 |
| **PRD 功能项** | F4.1 .md / F4.2 HTML |
| **AC 覆盖** | AC-3 (下载文件名 + 内容 / 复制 HTML) |
| **内部组件** | `ExportMd` / `CopyHtml` |
| **文件名** | `editor-YYYYMMDD-HHmmss.md`（本地时区，共识 TBD-6）|
| **HTML 范围** | innerHTML 无 outer wrapper（共识 TBD-7）|
| **错误处理** | Clipboard API 不可用时 toast 引导手动选择复制 |

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
