# ADR-028 — 文档统计面板：computeStats + status bar 点击弹层

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-18：D1=computeStats 单遍扩 wordcount / D2=status bar 点击弹层 / D3=deferred 出输入路径）|
| **Date** | 2026-06-18 |
| **Decider** | FE (Corray，共识 v3.2 TBD 全拍) |
| **Context** | 共识 v3.2 / wordcount.ts（countWords + createDeferred 范式）|

## D1 — computeStats 纯函数（TBD-v32-2a/3a）

`m1-editor/wordcount.ts` +`computeStats(text): DocStats`：
- 单遍 charCode 扫描（复用 countWords 的 isCJK/isWordChar）同时累计：`charsWithSpaces`（text.length）/ `charsNoSpaces`（非空白字符）/ `cjk` / `words` / `minutes`
- 行级扫描：`headings`（`^#{1,6}\s` 行数，跳 fenced——简化：不跳 fence，标题统计粗粒度可接受，文档化）/ `paragraphs`（空行分隔的非空块数）
- 与 countWords 的 cjk/words/minutes **保持一致**（同算法），status bar 摘要不变

```ts
export interface DocStats {
  charsWithSpaces: number;
  charsNoSpaces: number;
  words: number;
  cjk: number;
  headings: number;
  paragraphs: number;
  minutes: number; // 同 WordCount.minutes（0/-1/N）
}
export function computeStats(text: string): DocStats;
```

## D2 — status bar 点击弹层（TBD-v32-1a）

- EditorArea status bar `<div class="editor-status">` 加 `onClick` → toggle 本地 statsOpen signal
- `StatsPanel`（m1-editor）：弹层列 7 项；点外部/Esc/再点 status bar 关
- 自包含于 M1（EditorArea 持 statsOpen + StatsPanel），不经 AppShell

## D3 — deferred 出输入路径（TBD-v32-3a）

computeStats 消费 `createDeferred(text)`（同 wordcount 范式）；弹层取已算值，不阻塞输入。

## Consequences

- api-spec delta：wordcount +computeStats/DocStats；EditorArea status bar 点击 + StatsPanel
- i18n：`stats.title/charsWithSpaces/charsNoSpaces/words/cjk/headings/paragraphs/readingTime`
- test-plan delta：字符(含/不含空格) × 词/CJK 与 countWords 一致 × 标题/段落 × 空文档零
- 无 data-model / 无安全面
- 限制：标题统计不跳 fenced code（粗粒度，文档化）；复用 countWords 算法保证 status bar 一致
