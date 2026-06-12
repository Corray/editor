/**
 * M12 大纲 — 源文 ATX 标题单遍解析（ADR-018 D1 / TBD-v22-2a）。
 *
 * - ATX：`^ {0,3}#{1,6} 标题`（CommonMark ≤3 前导空格；尾随闭合 # 剥离；# 后无内容不收）
 * - fenced code block（``` / ~~~，≤3 前导空格）内不识别标题（伪标题排除，AC-v22-2）
 * - setext 标题（=== / --- 下划线式）不支持 —— 文档化限制（共识 v2.2 张力 A）
 * - 纯函数 O(n)；消费端经 createDeferred 出输入路径（ADR-018 D4）
 */

export interface OutlineItem {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** 标题文本（已剥前缀与尾随闭合 #），仅作 textContent 渲染 */
  text: string;
  /** 0-based 源文行号（跳转滚动用） */
  line: number;
  /** 行首字符偏移（光标定位用） */
  offset: number;
}

/** ≤ topLine 的最后一个标题 index；无 → -1（TOC 当前位置高亮 / ADR-020 D3）。 */
export function activeOutlineIndex(
  items: OutlineItem[],
  topLine: number,
): number {
  let active = -1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && item.line <= topLine) active = i;
    else break;
  }
  return active;
}

const HEADING_RE = /^ {0,3}(#{1,6})\s+(.*)$/;
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;

export function parseOutline(text: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  let inFence = false;
  let fenceChar = '';
  let offset = 0;
  const rawLines = text.split('\n');

  for (let lineNo = 0; lineNo < rawLines.length; lineNo++) {
    const rawLine = rawLines[lineNo] ?? '';
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine; // CRLF 容错

    const fence = FENCE_RE.exec(line);
    const fenceMark = fence?.[1];
    if (fenceMark) {
      const ch = fenceMark.charAt(0);
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (ch === fenceChar) {
        inFence = false; // 同类围栏才闭合（``` 块内的 ~~~ 行不闭合该块）
      }
    } else if (!inFence) {
      const m = HEADING_RE.exec(line);
      const hashes = m?.[1];
      const rest = m?.[2];
      if (hashes && rest !== undefined) {
        // 尾随闭合 #（`## 标题 ##`）剥离；剥完为空 = 无内容标题，不收
        const title = rest.replace(/\s*#+\s*$/, '').trim();
        if (title !== '') {
          items.push({
            level: hashes.length as OutlineItem['level'],
            text: title,
            line: lineNo,
            offset,
          });
        }
      }
    }
    offset += rawLine.length + 1; // +1 = '\n'
  }
  return items;
}
