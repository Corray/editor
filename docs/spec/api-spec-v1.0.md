# 接口设计 v1.0 — editor MVP

| 字段 | 值 |
|------|----|
| **状态** | `accepted` (TBD-I1~I4 全部采纳 AI 倾向) |
| **版本** | v1.0 |
| **基线** | PRD v1.0 + 共识 v1.0 + 模块 v1.0 + 架构 v1.0 |
| **首版日期** | 2026-05-19 |
| **最近评审** | 2026-05-19 (v0.1 → v1.0) |
| **owner** | FE (Corray) |
| **配套文件** | `data-model-v1.0.md` (数据模型) |
| **下游** | → 测试计划 → 代码 |

---

## 0. 定位

按 spec-to-code-flow §4 的「接口设计 + 数据模型」节点。editor 是纯 FE / 无后端 / 无 API route，传统意义的「接口设计」在此处映射为：

- **模块间通信契约** — M1-M7 各自暴露的 TS interface
- **事件流** — 模块间的订阅 / 调用时序
- **错误协议** — 跨模块统一的 toast / log 约定

数据视角（localStorage schema / 状态机详细）在配套 `data-model-v0.1.md` 中描述。

---

## 1. 版本史

| 版本 | 日期 | 摘要 |
|------|------|------|
| v0.1 | 2026-05-19 | AI 起草，含 7 模块 TS API + 5 时序图 + TBD-I1~I4 |
| v1.0 | 2026-05-19 | Corray 全盘接受 TBD-I1~I4；进入下游测试计划阶段 |

---

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| **SoT 模型** | M1 的 `signal(text)` 是源文唯一 SoT；M2 / M3 / M4 通过订阅派生 |
| **细粒度响应式** | 用 Solid Signal / Store 暴露状态，订阅方按需 recompute |
| **TS strict** | 所有 API 用严格类型；可空字段显式 `\| null`；不滥用 `any` |
| **副作用边界** | I/O（localStorage / Clipboard / Blob）封装在各模块内，不外漏 |
| **错误传递** | 模块内捕获异常 → toast / log，不向上抛（除非调用方语义需要） |

---

## 3. 模块间通信契约

### 3.1 M1 Editor

```ts
// modules/m1-editor/api.ts
import type { Accessor, Setter } from 'solid-js';

export interface EditorAPI {
  /** Markdown 源文 SoT - readonly accessor，外部只读 */
  readonly text: Accessor<string>;

  /** 内部 setter - 仅 M1 自身组件使用，不导出给其他模块 */
  // (private — 不在 API surface 中)

  /** 显式编程式更新源文（M3 init 还原时调用） */
  setTextFromStorage(initial: string): void;

  /** 清空内容（M3 / chrome 调用） */
  clear(): void;

  /** 字号 / 行高 / 行号显示 - 内部状态，不导出 */
}
```

**消费方：**
- M2 `subscribe(text)` → 触发渲染
- M3 `subscribe(text)` → debounce 写入
- M4 读 `text()` 当下值用于导出

### 3.2 M2 Preview

```ts
// modules/m2-preview/api.ts
export interface PreviewAPI {
  /** 渲染管线：markdown 源文 → 安全 HTML 字符串 */
  render(markdown: string): string;  // 已 sanitize（DOMPurify）

  /** 获取当前预览区根 DOM（M4 导出 HTML 时用） */
  getRootElement(): HTMLElement | null;
}
```

**实现说明：**
- `render()` 是纯函数（无副作用），可被单测
- DOM 层订阅 M1 `text()` signal，自动调用 `render()` 并替换 innerHTML

**实现追溯：**

| 入口 | 状态 | Issue / commit |
|------|------|---------------|
| `render()` (pipeline.ts) | ✓ 已实现（2026-05-19）| #1 — markdown-it v14 + DOMPurify v3 双保险，17 单测全绿，覆盖率 100% |
| `getRootElement()` | ⏳ 待 M2 集成 Issue | 后续 Issue（含 Solid effect 订阅 M1）|

### 3.3 M3 Persistence

```ts
// modules/m3-persistence/api.ts
export type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'ERROR';

export interface PersistenceAPI {
  /** 启动时还原；找不到返回空字符串 */
  init(): string;

  /** 当前保存状态（UI 不直接呈现，但暴露供 debug / 测试） */
  readonly status: Accessor<SaveStatus>;

  /** 清空 localStorage 中文档 key */
  clear(): void;

  /** 启动 / 关闭 debounce 写入（默认启动） */
  enable(): void;
  disable(): void;
}
```

**调用方：**
- M1 main.tsx 启动时 `const initial = m3.init(); m1.setTextFromStorage(initial)`
- M1 subscribe text → 内部触发 `setItem`（无显式 API，封装在 M3 内部）

**实现追溯：**

| 入口 | 状态 | Issue / commit |
|------|------|---------------|
| `createPersistence(text)` (store.ts) | ✓ 已实现（2026-05-19）| #2 — Solid effect on(text, ..., {defer:true}) 订阅；状态机 IDLE/DIRTY/SAVING/ERROR；debounce 500ms；QuotaExceededError → toast → ERROR → 5s fallback；1MB 一次性 toast；clear() reset 一切 |
| `debounce()` (debounce.ts) | ✓ 已实现 | #2 — 通用 helper，5 单测 100% 覆盖 |
| 测试 | ✓ 18 单测（11 UT-PR + 7 补充）| store.test.ts 94.62% / debounce.test.ts 100% |

### 3.4 M4 Export

```ts
// modules/m4-export/api.ts
export interface ExportAPI {
  /** 下载当前文档为 .md 文件 */
  downloadMarkdown(): void;

  /**
   * 复制预览区渲染后 HTML 到剪贴板。
   * @returns Promise<true> 成功 / Promise<false> Clipboard API 不可用
   */
  copyHtml(): Promise<boolean>;
}
```

**依赖：**
- 读 M1 `editor.text()`
- 读 M2 `getRootElement()?.innerHTML`

### 3.5 M5 Layout

```ts
// modules/m5-layout/api.ts
export type ViewportMode = 'desktop' | 'mobile';
export type MobileTab = 'edit' | 'preview';

export interface LayoutAPI {
  readonly viewport: Accessor<ViewportMode>;
  readonly mobileTab: Accessor<MobileTab>;
  setMobileTab(tab: MobileTab): void;
}
```

### 3.6 M6 Theme

```ts
// modules/m6-theme/api.ts
export type ThemeMode = 'light' | 'dark';

export interface ThemeAPI {
  readonly theme: Accessor<ThemeMode>;
  toggle(): void;          // light <-> dark
  setTheme(mode: ThemeMode): void;
}
```

### 3.7 M7 i18n

```ts
// modules/m7-i18n/api.ts
export type Lang = 'zh-CN';  // MVP 仅 zh-CN

export interface I18nAPI {
  readonly lang: Accessor<Lang>;
  t(key: string): string;  // 同步查询；未命中返回 key 本身
  setLang(lang: Lang): void;  // v1.1+ 接入点预留
}
```

**实现追溯：**

| 入口 | 状态 | Issue / commit |
|------|------|---------------|
| `i18n` singleton + `t()` | ✓ 已实现（2026-05-19）| #3 — module-level singleton；plain const dict + 字面 key type；t() fallback 到 key 本身；setLang 预留接入点 |
| `zh-CN.dict.ts` | ✓ 15 keys 白名单 | 覆盖 M2/M3/M4/M5 chrome 文案 |
| **遗留 follow-up** | ⚠ M3 toast 文案当前硬编（#2 实现时 M7 未存在）| 后续 Issue「M3 i18n integration」抓 fix-pattern-scan |

---

## 4. 共享工具协议

### 4.1 Toast

跨模块统一调用的瞬时提示。

```ts
// shared/toast.ts
export type ToastLevel = 'info' | 'warn' | 'error';

export interface ToastAPI {
  show(message: string, level?: ToastLevel, durationMs?: number): void;
}

// 默认实例（imperative）
export const toast: ToastAPI;
```

**实现追溯：**

| 入口 | 状态 | Issue / commit |
|------|------|---------------|
| `toast.show()` | ⚠ MVP **stub**（console.{info,warn,error} 转发）| #2 — 接口稳定，TODO(post-mvp): full DOM toast UI（后续单独 Issue）|

**约定：**
- M3 配额满 → `toast.show(t('storage.quota.full'), 'error')`
- M4 剪贴板失败 → `toast.show(t('clipboard.fail'), 'warn')`
- M3 大文档（>1MB）一次性提示 → `toast.show(t('doc.large'), 'info', 8000)`

---

## 5. 事件流时序图

### 5.1 启动序列

```
[browser load]
  ↓
main.tsx
  ↓
M7.init()                  (dict 已内联)
M3.init() → initialText    (从 localStorage 读)
M6.init()                  (读 localStorage / system preference)
  ↓
M1.setTextFromStorage(initialText)
M5.mount()                 (容器挂载 M1 / M2 / chrome)
  ↓
M2 effect: subscribe(M1.text) → render → setInnerHTML
  ↓
[ready, user can interact]
```

### 5.2 用户输入 → 预览 → 持久化

```
user keypress
  ↓
M1 内部 setter 更新 text signal
  ↓
  ├─→ M2 effect: text() → pipeline.render() → setInnerHTML  (同步)
  └─→ M3 effect: text() → debounce(500ms) → setItem        (异步)
                                              ↓ ok        → status = IDLE
                                              ↓ quota err → status = ERROR + toast
```

### 5.3 用户清空

```
user click "清空" button
  ↓
chrome 调用 toast.confirm(t('clear.confirm'))   (MVP 用 window.confirm)
  ↓ user OK
M1.clear()                  → text = ''
M3.clear()                  → localStorage.removeItem(key)
  ↓
M2 effect 自动重渲染（empty placeholder）
```

### 5.4 用户导出 .md

```
user click "下载 .md"
  ↓
M4.downloadMarkdown()
  ├─ M1.text()                                    → markdown
  ├─ new Blob([markdown], {type:'text/markdown'}) → blob
  ├─ URL.createObjectURL(blob)                    → url
  ├─ <a href={url} download={filename}>.click()
  └─ URL.revokeObjectURL(url)                     (cleanup)
```

### 5.5 用户复制 HTML

```
user click "复制 HTML"
  ↓
M4.copyHtml()
  ├─ M2.getRootElement()?.innerHTML            → html
  ├─ navigator.clipboard.writeText(html)       → Promise
  │    ↓ ok   → toast.show(t('clipboard.ok'), 'info')
  │    ↓ err  → toast.show(t('clipboard.fail'), 'warn'); return false
  └─ return true
```

### 5.6 用户切主题

```
user click theme toggle
  ↓
M6.toggle()
  ├─ theme signal: 'light' ↔ 'dark'
  ├─ document.documentElement.dataset.theme = theme
  └─ localStorage.setItem('editor.theme.v1', theme)
```

---

## 6. 状态流转图（M3 Persistence）

```
           ┌──────┐
init()────→│ IDLE │
           └──────┘
               │ M1.text() change
               ↓
           ┌──────┐    500ms 无新输入   ┌────────┐
           │ DIRTY │ ─────────────────→│ SAVING │
           └──────┘                    └────────┘
               ↑                             │
               │ 新输入打断                    │ setItem
               │                             ↓
               │                       ┌──────────┐
               └───────────────────────│ ok→IDLE  │
                                       │ err→ERROR│
                                       └──────────┘
                                              │
                                              │ toast 后 5s 或下次写入成功
                                              ↓
                                          IDLE
```

**说明：** UI 不直接呈现状态，用于内部决策 + 单元测试断言。

---

## 7. 决议汇总（原 TBD-I1~I4）

| # | 议题 | 决议（v1.0）|
|---|------|-----------|
| TBD-I1 | M1 输入：textarea vs contenteditable | ✓ textarea（简单 / 移动键盘友好 / 防意外格式化）|
| TBD-I2 | Toast 注入：imperative singleton vs Solid context | ✓ imperative singleton（跨模块直接 import）|
| TBD-I3 | M3 写入失败自动重试 | ✓ 不重试（下次输入自然 retry）|
| TBD-I4 | M2 render 是否带缓存 | ✓ 纯函数（MVP markdown-it 够快；v1.1+ 再加 memoization）|

> 4 项已转为正式决议。

---

## 8. 评审决策记录

| 日期 | 评审人 | 决议 | 备注 |
|------|-------|------|------|
| 2026-05-19 | Corray | v0.1 → v1.0，全盘接受 TBD-I1~I4 | AI 倾向方案全部采纳 |

**下一步：** 进入下一节点 = **测试计划**。
