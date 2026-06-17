/**
 * 格式快捷键（ADR-017 D3）+ 列表自动延续（D4）。所有写入经 replaceRange（undo 保持）。
 */
import { replaceRange } from './edit-text';

export type FormatKind = 'bold' | 'italic' | 'link' | 'code';
export type LinePrefixKind = 'quote' | 'ul' | 'ol';

/**
 * toggle 包裹：①选区自带 marker → 解包；②marker 紧贴选区外侧 → 扩选解包；
 * ③否则包裹。无选区：插入空包裹光标置中。
 * italic（单 `*`）需防误吞 bold 的 `**`：边界恰为 `**`（非 `***`）时不按 italic 解。
 */
function toggleWrap(ta: HTMLTextAreaElement, marker: string): void {
  const value = ta.value;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const m = marker.length;
  const sel = value.slice(s, e);

  // 防误吞守卫：marker='*' 时，边界若是 bold 的 '**'（而非 italic+bold 的 '***'）则不解
  const boldPairAt = (str: string, isStart: boolean): boolean => {
    if (marker !== '*') return false;
    const two = isStart ? str.startsWith('**') : str.endsWith('**');
    const three = isStart ? str.startsWith('***') : str.endsWith('***');
    return two && !three;
  };

  // ① 选区自带 marker（如选中 `**x**`）
  if (
    sel.length >= 2 * m &&
    sel.startsWith(marker) &&
    sel.endsWith(marker) &&
    !boldPairAt(sel, true) &&
    !boldPairAt(sel, false)
  ) {
    replaceRange(ta, s, e, sel.slice(m, sel.length - m), {
      start: s,
      end: e - 2 * m,
    });
    return;
  }

  // ② marker 紧贴选区外侧（光标在 `**|x|**` 内）
  const left = value.slice(Math.max(0, s - m), s);
  const right = value.slice(e, e + m);
  if (left === marker && right === marker) {
    // italic 守卫：外侧再贴一个 '*'（即实际是 '**' 边界）时不解 —— 除非是 '***'
    const outerLeft = value.slice(Math.max(0, s - m - 1), s - m);
    const outerRight = value.slice(e + m, e + m + 1);
    const isBoldBoundary =
      marker === '*' &&
      (outerLeft === '*' || outerRight === '*') &&
      !(outerLeft === '*' && value.slice(Math.max(0, s - 3), s) === '***');
    if (!isBoldBoundary) {
      replaceRange(ta, s - m, e + m, sel, {
        start: s - m,
        end: e - m,
      });
      return;
    }
  }

  // ③ 包裹；无选区 → 空包裹光标置中
  if (s === e) {
    replaceRange(ta, s, e, marker + marker, { start: s + m, end: s + m });
  } else {
    replaceRange(ta, s, e, marker + sel + marker, {
      start: s + m,
      end: e + m,
    });
  }
}

/** Cmd/Ctrl+K：选区 → `[选区](url)` 且选中 `url` 占位；无选区 no-op（共识 TBD-v21-3a）。 */
function wrapLink(ta: HTMLTextAreaElement): void {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  if (s === e) return;
  const sel = ta.value.slice(s, e);
  const text = `[${sel}](url)`;
  const urlStart = s + sel.length + 3; // [sel]( 之后
  replaceRange(ta, s, e, text, { start: urlStart, end: urlStart + 3 });
}

export function applyFormat(ta: HTMLTextAreaElement, kind: FormatKind): void {
  if (kind === 'bold') toggleWrap(ta, '**');
  else if (kind === 'italic') toggleWrap(ta, '*');
  else if (kind === 'code') toggleWrap(ta, '`'); // v2.7：行内代码（单 ` toggle，无误吞问题）
  else wrapLink(ta);
}

/** 行前缀正则（去除判定 / ADR-023 D2）。ol 匹配任意数字前缀。 */
const LINE_PREFIX_RE: Record<LinePrefixKind, RegExp> = {
  quote: /^> /,
  ul: /^- /,
  ol: /^\d+\. /,
};

/**
 * 行前缀 toggle（v2.7 / ADR-023 D2）：选中行整体加/去前缀。
 * toggle：选中行**全部**已带该前缀 → 去除；否则加（ol 加时逐行 1,2,3… 递增）。
 * 单次 replaceRange（一步 undo），选区重算保持覆盖（同 indentSelection 范式）。
 */
export function toggleLinePrefix(
  ta: HTMLTextAreaElement,
  kind: LinePrefixKind,
): void {
  const value = ta.value;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const blockStart = value.lastIndexOf('\n', s - 1) + 1;
  const lineEndIdx = value.indexOf('\n', e === s ? s : e - 1);
  const blockEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  const re = LINE_PREFIX_RE[kind];

  const allPrefixed = lines.every((l) => re.test(l));
  let firstDelta = 0;
  let totalDelta = 0;
  const out = lines
    .map((line, i) => {
      let next: string;
      if (allPrefixed) {
        next = line.replace(re, ''); // 去除
      } else {
        const prefix =
          kind === 'quote' ? '> ' : kind === 'ul' ? '- ' : `${i + 1}. `;
        // 已带（部分行）先剥旧再加（避免 `- - `）；ol 统一重编号
        next = prefix + line.replace(re, '');
      }
      const delta = next.length - line.length;
      if (i === 0) firstDelta = delta;
      totalDelta += delta;
      return next;
    })
    .join('\n');

  if (out === block) return; // no-op
  const newStart = Math.max(blockStart, s + firstDelta);
  const newEnd = Math.max(newStart, e + totalDelta);
  replaceRange(ta, blockStart, blockEnd, out, { start: newStart, end: newEnd });
}

// —— v2.8 表格辅助（ADR-024）——

/** 当前行是否表格行（trim 后 `|` 起头 / ADR-024 D2）。 */
export function isTableRow(line: string): boolean {
  return line.trim().startsWith('|');
}

/** 插入 2 列表格模板（ADR-024 D1），光标选中首单元格占位。 */
export function insertTable(ta: HTMLTextAreaElement): void {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  // 若光标不在行首，先换行起新块
  const atLineStart = s === 0 || ta.value[s - 1] === '\n';
  const lead = atLineStart ? '' : '\n';
  const tpl =
    lead + '| 列1 | 列2 |\n| --- | --- |\n| 单元格 | 单元格 |\n';
  const cellStart = s + lead.length + 2; // '| ' 之后
  replaceRange(ta, s, e, tpl, {
    start: cellStart,
    end: cellStart + 2, // 选中 '列1'
  });
}

/**
 * 单元格文本区间：行内相邻 `|` 之间为一个 cell，返回其 trim 后文本的 [start,end)（绝对偏移）。
 * `| a | b |` → 2 cells（前导/尾随 `|` 外的空段不计）。空单元格 start==end（光标落入点）。
 */
function tableCells(
  value: string,
  lineStart: number,
  lineEnd: number,
): { start: number; end: number }[] {
  const line = value.slice(lineStart, lineEnd);
  const pipes: number[] = [];
  for (let i = 0; i < line.length; i++) if (line[i] === '|') pipes.push(i);
  const cells: { start: number; end: number }[] = [];
  for (let k = 0; k + 1 < pipes.length; k++) {
    const segStart = pipes[k]! + 1;
    const seg = line.slice(segStart, pipes[k + 1]!);
    const lead = seg.length - seg.trimStart().length;
    const trimmed = seg.trim();
    const absStart = lineStart + segStart + lead;
    cells.push({ start: absStart, end: absStart + trimmed.length });
  }
  return cells;
}

/**
 * 表格行内 Tab 单元格导航（ADR-024 D3）。reverse=Shift+Tab。
 * 返回 true=已处理（调用方 preventDefault）；非表格行返 false（交回缩进）。
 */
export function tableCellNav(
  ta: HTMLTextAreaElement,
  reverse: boolean,
): boolean {
  const value = ta.value;
  const pos = ta.selectionStart;
  const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
  const lineEndIdx = value.indexOf('\n', pos);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  if (!isTableRow(value.slice(lineStart, lineEnd))) return false;

  const cells = tableCells(value, lineStart, lineEnd);
  if (cells.length === 0) return false;
  // 当前单元格 index（光标落在哪个 cell 区间内或之前）
  let idx = cells.findIndex((c) => pos <= c.end);
  if (idx === -1) idx = cells.length - 1;

  const select = (c: { start: number; end: number }): void => {
    ta.focus();
    ta.setSelectionRange(c.start, c.end);
  };

  if (!reverse) {
    if (idx < cells.length - 1) {
      select(cells[idx + 1]!); // 行内下一单元格
      return true;
    }
    // 行末单元格 → 下一行首单元格 / 末行新增
    const nextStart = lineEnd + 1;
    const nextEndIdx = value.indexOf('\n', nextStart);
    const nextEnd = nextEndIdx === -1 ? value.length : nextEndIdx;
    if (lineEnd < value.length && isTableRow(value.slice(nextStart, nextEnd))) {
      const nextCells = tableCells(value, nextStart, nextEnd);
      if (nextCells.length > 0) {
        select(nextCells[0]!);
        return true;
      }
    }
    // 末行 → 新增同列数空行
    const cols = cells.length;
    const newRow =
      '\n|' + Array.from({ length: cols }, () => ' 单元格 ').join('|') + '|';
    const insertAt = lineEnd;
    const firstCellStart = insertAt + 3; // newRow: \n | ' ' 单 → '单元格' 起于 +3
    replaceRange(ta, insertAt, insertAt, newRow, {
      start: firstCellStart,
      end: firstCellStart + 3, // 选中 '单元格'
    });
    return true;
  } else {
    if (idx > 0) {
      select(cells[idx - 1]!); // 行内上一单元格
      return true;
    }
    // 行首单元格 → 上一行末单元格
    if (lineStart > 0) {
      const prevEnd = lineStart - 1;
      const prevStart = value.lastIndexOf('\n', prevEnd - 1) + 1;
      if (isTableRow(value.slice(prevStart, prevEnd))) {
        const prevCells = tableCells(value, prevStart, prevEnd);
        if (prevCells.length > 0) {
          select(prevCells[prevCells.length - 1]!);
          return true;
        }
      }
    }
    return true; // 首行行首 → 吞掉（不缩进）
  }
}

/**
 * 代码块围栏（v2.7 / ADR-023 D3）：选区包进 ``` 独立行；无选区插空围栏光标置内。
 */
export function wrapCodeBlock(ta: HTMLTextAreaElement): void {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const sel = ta.value.slice(s, e);
  if (s === e) {
    const text = '```\n\n```';
    replaceRange(ta, s, s, text, { start: s + 4, end: s + 4 }); // 光标置中空行
  } else {
    const text = '```\n' + sel + '\n```';
    const innerStart = s + 4;
    replaceRange(ta, s, e, text, {
      start: innerStart,
      end: innerStart + sel.length,
    });
  }
}

const INDENT = '  '; // 2 空格（ADR-020 D1 / TBD-v24-1a）

/**
 * Tab/Shift+Tab 缩进（ADR-020 D1）。
 * 单光标：Tab 插 2 空格 / Shift+Tab 当前行行首删 ≤2 空格；
 * 有选区：覆盖行整体加/减，单次 replaceRange（一步 undo），选区重算保持覆盖。
 */
export function indentSelection(
  ta: HTMLTextAreaElement,
  dedent: boolean,
): void {
  const value = ta.value;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;

  // 单光标 + Tab：纯插入
  if (s === e && !dedent) {
    replaceRange(ta, s, s, INDENT, {
      start: s + INDENT.length,
      end: s + INDENT.length,
    });
    return;
  }

  // 覆盖行区间 [blockStart, blockEnd)
  const blockStart = value.lastIndexOf('\n', s - 1) + 1;
  const lineEndIdx = value.indexOf('\n', e === s ? s : e - 1);
  const blockEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split('\n');

  let firstDelta = 0;
  let totalDelta = 0;
  const out = lines
    .map((line, i) => {
      let next: string;
      if (dedent) {
        const removed = line.startsWith(INDENT)
          ? INDENT.length
          : line.startsWith(' ')
            ? 1
            : 0;
        next = line.slice(removed);
        if (i === 0) firstDelta = -removed;
        totalDelta -= removed;
      } else {
        next = INDENT + line;
        if (i === 0) firstDelta = INDENT.length;
        totalDelta += INDENT.length;
      }
      return next;
    })
    .join('\n');

  if (out === block) return; // 全部 dedent 不动 → no-op（不污染 undo 栈）
  const newStart = Math.max(blockStart, s + firstDelta);
  const newEnd = Math.max(newStart, e + totalDelta);
  replaceRange(ta, blockStart, blockEnd, out, {
    start: newStart,
    end: newEnd,
  });
}

/** 列表前缀：`- ` / `* ` / `- [ ] ` / `- [x] ` / `1. `（缩进保留）。 */
const LIST_PREFIX_RE = /^(\s*)(?:([-*]) (?:\[([ x])\] )?|(\d+)\. )/;

/**
 * Enter keydown 编排（ADR-017 D4）：列表行 → 续前缀（数字递增 / checkbox 重置）；
 * 裸前缀空项 → 删前缀退出（不换行）。返回 true = 已处理（调用方 preventDefault）。
 * 调用方必须守 e.isComposing（IME 确认候选词的 Enter 不得拦截）。
 */
export function continueList(ta: HTMLTextAreaElement): boolean {
  const s = ta.selectionStart;
  if (s !== ta.selectionEnd) return false; // 有选区 → 默认 Enter 行为
  const value = ta.value;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const line = value.slice(lineStart, s);
  const m = LIST_PREFIX_RE.exec(line);
  if (!m) return false;

  const [full, indent, bullet, checkbox, num] = m;
  const content = line.slice(full.length);
  const lineEndIdx = value.indexOf('\n', s);
  const restOfLine = value.slice(s, lineEndIdx === -1 ? value.length : lineEndIdx);

  // 裸前缀空项（光标前后均无内容）→ 删前缀退出列表
  if (content.trim() === '' && restOfLine.trim() === '') {
    replaceRange(ta, lineStart, lineStart + full.length, '', {
      start: lineStart,
      end: lineStart,
    });
    return true;
  }

  let prefix: string;
  if (num !== undefined) prefix = `${Number(num) + 1}. `;
  else if (checkbox !== undefined) prefix = `${bullet} [ ] `; // 新行重置未勾
  else prefix = `${bullet} `;

  const inserted = `\n${indent}${prefix}`;
  replaceRange(ta, s, s, inserted, {
    start: s + inserted.length,
    end: s + inserted.length,
  });
  return true;
}
