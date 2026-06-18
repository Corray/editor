# 接口设计 v3.2 delta — 文档统计面板

> **基线：** 共识 v3.2（accepted）+ ADR-028。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.2 | 2026-06-18 | wordcount +computeStats/DocStats；EditorArea status bar 点击 + StatsPanel；i18n stats.* |

---

## 1. computeStats（ADR-028 D1）

```ts
export interface DocStats {
  charsWithSpaces: number;
  charsNoSpaces: number;
  words: number;
  cjk: number;
  headings: number;
  paragraphs: number;
  minutes: number; // 同 WordCount.minutes
}
export function computeStats(text: string): DocStats; // 单遍 charCode + 行扫描；复用 countWords 算法
```

## 2. StatsPanel + 装配（ADR-028 D2/D3）

```ts
// m1-editor/StatsPanel.tsx
export function StatsPanel(props: { open: boolean; onClose: () => void; stats: Accessor<DocStats> }): JSX.Element;
```
- EditorArea：status bar `onClick` toggle statsOpen；`createDeferred(text)` → `computeStats` memo → StatsPanel
- i18n：`stats.title / stats.charsWithSpaces / stats.charsNoSpaces / stats.words / stats.cjk / stats.headings / stats.paragraphs / stats.readingTime`

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| wordcount computeStats + DocStats（单遍 + 行扫描，字段与 countWords 一致）| ✓ | `b1de3b1` |
| StatsPanel + EditorArea status bar（button）点击 + deferred | ✓ | `b1de3b1` |
| i18n stats.*（zh+en，+EXPECTED_KEYS）| ✓ | `b1de3b1` |
| .stats-* CSS（弹层锚 status bar 上方 + backdrop 关闭）| ✓ | `b1de3b1` |

> 测试：unit +6（CT-STATS：字符/一致性/标题/段落/空文档/混排）→ 315；e2e +2 用例双引擎（ac25）→ 180+4skip。首屏 95.35KB。
