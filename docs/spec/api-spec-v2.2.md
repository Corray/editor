# 接口设计 v2.2 delta — 大纲/TOC 面板

> v1.0 接口增量。M12 大纲新增。
> **基线：** 共识 v2.2（accepted）+ ADR-018。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.2 | 2026-06-11 | M12 parseOutline + OutlinePanel；DocList +children slot；AppShell 跳转编排 |

---

## 1. M12 解析（ADR-018 D1，纯函数）

```ts
// m12-outline/outline.ts
export interface OutlineItem {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;   // 标题文本（已剥前缀 # 与尾随闭合 #），textContent 渲染
  line: number;   // 0-based 源文行号（跳转滚动用）
  offset: number; // 行首字符偏移（光标定位用）
}
/** ATX 标题单遍解析；fenced code block 内不识别；setext 不支持（文档化） */
export function parseOutline(text: string): OutlineItem[];
```

## 2. M12 面板组件

```ts
// m12-outline/OutlinePanel.tsx
export interface OutlinePanelProps {
  items: Accessor<OutlineItem[]>;
  onJump: (item: OutlineItem) => void;
}
// 渲染：标题列表按 level 缩进（.outline-item--l{n}）；空 → t('outline.empty') 空态
```

## 3. 装配（AppShell / DocList）

- `DocList` props 扩展：`children?: JSX.Element`（渲染于文档列表之后；DocDrawer 不传 → 移动端行为不变）
- AppShell（桌面分支）：`createDeferred(text)` → `parseOutline` memo → `<DocList docs={...}><OutlinePanel items onJump/></DocList>`
- `onJump`（ADR-018 D2）：editorEl `focus` + `setSelectionRange(offset, offset)` + `scrollTop = line×lh − clientHeight/2`；预览由 M10 scroll 事件自然联动
- i18n 新 key：`outline.title` / `outline.empty`

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| outline.ts parseOutline（ATX + fenced 跳过）| ✓ | `7626be0` |
| OutlinePanel（缩进列表 + 空态）| ✓ | `7626be0` |
| DocList children slot + sidebar 分区 CSS | ✓ | `7626be0` |
| AppShell deferred parse + onJump 编排 | ✓ | `7626be0` |
| i18n outline.*（+EXPECTED_KEYS）| ✓ | `7626be0` |

> 测试：unit +10（CT-OL×10）→ 230；e2e +4 用例双引擎（ac15）→ 116 + 2 skip。
