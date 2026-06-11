# 接口设计 v2.1 delta — 编辑增强包

> v1.0 接口增量。M1 新增查找/替换控制器 + 格式命令 + 列表延续 + 字数统计。
> **基线：** 共识 v2.1（accepted）+ ADR-017。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.1 | 2026-06-11 | M1 +FindControllerAPI +applyFormat +continueList +wordCount；EditorArea props 扩展；编辑 pane 底部 status bar |

---

## 1. 程序化编辑 helper（ADR-017 D1，模块内私有）

```ts
// m1-editor/edit-text.ts（内部，不出 M1 契约）
/** 选区定位 + execCommand('insertText') 优先（保 undo），失败 fallback setRangeText+input 事件 */
export function replaceRange(
  ta: HTMLTextAreaElement,
  start: number, end: number, text: string,
  select?: { start: number; end: number },  // 完成后的选区（绝对偏移）
): void;
```

## 2. FindControllerAPI（ADR-017 D2）

```ts
// m1-editor/find.ts
export interface FindControllerAPI {
  readonly open: Accessor<boolean>;
  readonly query: Accessor<string>;
  readonly replaceText: Accessor<string>;
  readonly matches: Accessor<number[]>;      // 命中起点偏移（小写化字面量扫描）
  readonly activeIndex: Accessor<number>;    // 0-based；matches 空时 -1
  show(): void;                              // 打开 + 聚焦查找输入
  hide(): void;                              // 关闭 + 回焦 textarea
  setQuery(q: string): void;
  setReplaceText(r: string): void;
  next(): void;                              // 选区跳转 + 滚动估算居中；尾部环回
  prev(): void;
  replaceCurrent(): void;                    // 替换当前命中 → 跳下一个
  replaceAll(): void;                        // 从后往前全替换 + toast 计数
}
export function createFindController(
  state: DocumentState,
  ta: () => HTMLTextAreaElement | undefined,
): FindControllerAPI;
```

## 3. 格式命令 + 列表延续（ADR-017 D3/D4）

```ts
// m1-editor/commands.ts
export type FormatKind = 'bold' | 'italic' | 'link';
/** toggle 语义：选区带/紧邻 marker → 解包；否则包裹。无选区：B/I 空包裹光标置中，K no-op */
export function applyFormat(ta: HTMLTextAreaElement, kind: FormatKind): void;
/** Enter keydown 编排：列表行 → 续前缀/数字递增/checkbox 重置/空项退出。
 *  返回 true = 已处理（调用方 preventDefault）。e.isComposing 时调用方不得调用（IME 守卫）。 */
export function continueList(ta: HTMLTextAreaElement): boolean;
```

## 4. 字数统计（ADR-017 D5）

```ts
// m1-editor/wordcount.ts（纯函数，unit 主战场）
export interface WordCount { chars: number; cjk: number; words: number; minutes: number } // minutes: 0=空, -1=<1
export function countWords(text: string): WordCount;
export function formatWordCount(wc: WordCount, t: I18nT): string; // "N 字 · ~M 分钟"
```

## 5. 装配（EditorArea / AppShell）

- `EditorAreaProps` 扩展：`find?: FindControllerAPI`（传入则渲染查找栏 + 容器内拦 Cmd/Ctrl+F）
- EditorArea keydown 编排：`Cmd/Ctrl+F → find.show()`；`Cmd/Ctrl+B/I/K → applyFormat`；`Enter（!isComposing）→ continueList`
- 编辑 pane 底部 status bar：`<div class="editor-status">`，显 `formatWordCount(countWords(state.text()))`（memo）
- i18n 新 key：`find.placeholder / find.replace / find.next / find.prev / find.replaceAll / find.count / find.replaced / wordcount.fmt` 等（M7 dict）

## 6. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| edit-text.ts replaceRange（execCommand+fallback）| ⏳ | — |
| find.ts FindController（扫描/跳转/替换）| ⏳ | — |
| commands.ts applyFormat（B/I/K toggle）| ⏳ | — |
| commands.ts continueList（4 前缀 + 空退 + IME 守卫）| ⏳ | — |
| wordcount.ts countWords/formatWordCount | ⏳ | — |
| EditorArea 集成（FindBar + keydown + status bar）| ⏳ | — |
| i18n find.* / wordcount.* | ⏳ | — |
