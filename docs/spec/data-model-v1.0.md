# 数据模型 v1.0 — editor MVP

| 字段 | 值 |
|------|----|
| **状态** | `accepted` (TBD-D1~D3 全部采纳 AI 倾向) |
| **版本** | v1.0 |
| **基线** | PRD v1.0 + 共识 v1.0 + 模块 v1.0 + 架构 v1.0 |
| **首版日期** | 2026-05-19 |
| **最近评审** | 2026-05-19 (v0.1 → v1.0) |
| **owner** | FE (Corray) |
| **配套文件** | `api-spec-v1.0.md` (接口设计) |
| **下游** | → 测试计划 → 代码 |

---

## 0. 定位

按 spec-to-code-flow §4 的数据模型角度。editor 是纯 FE / 无后端数据库——「Collection / Table」在此映射为：

- **localStorage Schema** — 浏览器持久化的 key / value 格式
- **运行时数据结构** — TS type/interface（M1 source state、M3 状态机、M6 theme 等）
- **状态机详细** — M3 的 IDLE / DIRTY / SAVING / ERROR 转换 / 入口 / 出口 / 副作用
- **版本迁移策略** — schema 演进规则

---

## 1. 版本史

| 版本 | 日期 | 摘要 |
|------|------|------|
| v0.1 | 2026-05-19 | AI 起草，含 3 localStorage keys + 4 运行时 type + M3 状态机详细 + TBD-D1~D3 |
| v1.0 | 2026-05-19 | Corray 全盘接受 TBD-D1~D3；进入下游测试计划阶段 |

---

## 2. 持久化总览

editor 唯一持久化通道是 **浏览器 localStorage**（同步 API / 字符串 KV / 5-10MB 配额 / 同源 sandbox / 用户可清除）。

**MVP 不引入：** IndexedDB / sessionStorage / Cookies / 任何外部存储。v1.1+ 迁移 IndexedDB 时本节文档新建 v2.0 + 加迁移层 ADR。

---

## 3. localStorage Schema

### 3.1 Key 命名规则

`editor.<scope>.v<schema-version>`

- `editor.` 命名空间前缀，避免与同源其他应用冲突
- `<scope>` 业务范围（document / theme / notice / ...）
- `v<N>` schema 语义版本，**整数递增**，破坏性变更升 v2

### 3.2 Key 清单

| Key | 类型 | 内容 | 写入方 | 读取方 |
|-----|------|------|-------|-------|
| `editor.document.v1` | `string` | Markdown 源文（UTF-8 / 无 BOM / 任意换行符） | M3（debounce 500ms） | M3.init() |
| `editor.theme.v1` | `string` | 主题模式 `"light" \| "dark"` | M6.toggle / setTheme | M6.init() |
| `editor.notice.large-doc.v1` | `string` | 一次性 toast 已展示标记，值固定为 `"1"` | M3 首次发现 >1MB 时 | M3 内部，避免重复提示 |

### 3.3 序列化格式

**所有 value 直接存字符串**，不包 JSON wrapper。理由：

- `document` 是用户原文，包 JSON 反而多一次序列化 / 反序列化 / 容易出转义错
- `theme` / `notice` 是 enum 字面量，字符串本身就是 schema
- localStorage 只存 string，包不包都是 string

> **副作用：** 无法在 value 里嵌入 `schema_version` / `lastModifiedAt` 元数据。这是 MVP 取舍——见 §7 版本迁移策略。

### 3.4 配额假设

- 单 key 上限：通常 5-10MB（按浏览器）
- 我们的硬约束：`document` 单 key < 5MB 不阻塞写入
- 超出抛 `QuotaExceededError` → M3 状态机走 ERROR 分支 → toast

---

## 4. 运行时数据结构

### 4.1 DocumentState (M1)

```ts
// modules/m1-editor/state.ts
import { createSignal, type Accessor, type Setter } from 'solid-js';

type Markdown = string;  // branded 别名（语义标识，运行时即 string）

export interface DocumentState {
  text: Accessor<Markdown>;
  setText: Setter<Markdown>;  // private，模块内使用
}

export function createDocumentState(initial: Markdown = ''): DocumentState {
  const [text, setText] = createSignal<Markdown>(initial);
  return { text, setText };
}
```

**约束：**
- `text` 是字符串，不预解析 / 不 normalize
- 换行符保留用户原样（不强制 LF）
- 上限不约束（M3 大文档 toast）

### 4.2 ThemeState (M6)

```ts
// modules/m6-theme/state.ts
export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  theme: Accessor<ThemeMode>;
  setTheme: Setter<ThemeMode>;
}

// 初始化逻辑（M6.init()）：
// 1. localStorage('editor.theme.v1') 命中 → 用之
// 2. matchMedia('(prefers-color-scheme: dark)') → 用系统
// 3. fallback 'light'
```

### 4.3 LayoutState (M5)

```ts
// modules/m5-layout/state.ts
export type ViewportMode = 'desktop' | 'mobile';
export type MobileTab = 'edit' | 'preview';

export interface LayoutState {
  viewport: Accessor<ViewportMode>;     // 由 matchMedia('(max-width: 767px)') 驱动
  mobileTab: Accessor<MobileTab>;
  setMobileTab: Setter<MobileTab>;
}
```

`mobileTab` 默认 `'edit'`，**不持久化**（用户每次访问从编辑开始）。

### 4.4 I18nState (M7)

```ts
// modules/m7-i18n/state.ts
export type Lang = 'zh-CN';

interface Dict {
  [key: string]: string;
}

export interface I18nState {
  lang: Accessor<Lang>;
  dict: Dict;
}
```

MVP 内联 zh-CN dict，不动态加载。

---

## 5. M3 状态机详细

### 5.1 状态枚举

```ts
export type SaveStatus = 'IDLE' | 'DIRTY' | 'SAVING' | 'ERROR';
```

### 5.2 状态转换表

| from | event | to | 副作用 |
|------|-------|----|-------|
| IDLE | M1.text() change | DIRTY | 重置 debounce timer (500ms) |
| DIRTY | M1.text() change | DIRTY | 重置 debounce timer (再次 500ms) |
| DIRTY | timer fires | SAVING | `localStorage.setItem(...)` 调用开始 |
| SAVING | setItem success | IDLE | (清除 timer state) |
| SAVING | setItem throws (Quota) | ERROR | `toast.show(t('storage.quota'), 'error')` |
| ERROR | M1.text() change | DIRTY | 重置 debounce timer，给下次重试机会 |
| ERROR | 5s idle | IDLE | 默认 fallback，避免永久卡 ERROR |
| any | M3.clear() | IDLE | `localStorage.removeItem(...)` |

### 5.3 不变量（测试断言用）

- `status` 不可在 SAVING 时被改成 DIRTY（DIRTY 入队等 SAVING 完成）
- localStorage 写入仅发生在 DIRTY → SAVING 这一边
- `M3.clear()` 在任意 status 都立即生效（清空是用户显式动作，优先级高）

---

## 6. 大文档一次性 toast

| 触发条件 | 动作 |
|---------|------|
| M3.init() 时检测 `text.length > 1_000_000` | 不弹（已是回访态）|
| M1.text() change 触发后 `text.length > 1_000_000` **且** `editor.notice.large-doc.v1` 未设 | 弹 toast `t('doc.large')` + `localStorage.setItem('editor.notice.large-doc.v1', '1')` |
| `editor.notice.large-doc.v1` 已设 | 永不再弹（同一 origin 同浏览器一次）|
| 用户 `M3.clear()` | 同时 `localStorage.removeItem('editor.notice.large-doc.v1')` 重置 |

---

## 7. 版本迁移策略

### 7.1 何时升 schema 版本

- 现有 key 的 value 编码 / 含义变更（如 `theme` 从 `"light"/"dark"` 改成 JSON 对象）
- 概念性废弃（如 v1.1 切 IndexedDB，`editor.document.v1` 整体退出）

### 7.2 升 v2 时怎么迁移

```
M3.init() 加载顺序：
1. 尝试读 `editor.document.v2`  → 用之
2. 命中 fallback: 读 `editor.document.v1`
   ├─ 迁移转换 v1 → v2 schema
   ├─ 写入 v2 key
   └─ 保留 v1 key 一段时间（如 6 个月），方便用户回滚
3. 都没命中 → 视作空文档
```

迁移层代码集中放在 `modules/m3-persistence/migrations/v1-to-v2.ts`。

### 7.3 元数据策略（MVP 不做）

MVP value 是纯字符串，无 `schema_version` / `updatedAt` 内嵌——这是 v1.0 取舍。如果 v2 引入元数据，会从纯字符串切到 JSON wrapper：

```json
{
  "schema": "editor.document.v2",
  "updatedAt": "2026-05-19T10:00:00Z",
  "text": "..."
}
```

切换时遵循 §7.2 的迁移路径。

---

## 8. 决议汇总（原 TBD-D1~D3）

| # | 议题 | 决议（v1.0）|
|---|------|-----------|
| TBD-D1 | localStorage value 编码 | ✓ 纯字符串（MVP），未来切 JSON 走 §7.2 迁移路径 |
| TBD-D2 | 大文档 toast 阈值 | ✓ 1MB |
| TBD-D3 | ERROR 5s fallback IDLE | ✓ 合理（避免永久卡 ERROR，下次输入自然 retry）|

> 3 项已转为正式决议。

---

## 9. 评审决策记录

| 日期 | 评审人 | 决议 | 备注 |
|------|-------|------|------|
| 2026-05-19 | Corray | v0.1 → v1.0，全盘接受 TBD-D1~D3 | AI 倾向方案全部采纳 |

**下一步：** 进入下一节点 = **测试计划**（含本数据模型的状态机不变量测试）。
