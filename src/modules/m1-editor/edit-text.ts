/**
 * 程序化编辑统一 helper（ADR-017 D1）——替换 / 包裹 / 列表延续全部收口到此。
 *
 * 为什么 execCommand：唯一能进浏览器原生 undo 栈的程序化写入路径
 * （setRangeText / 直改 value 均不进栈 → Cmd+Z 撤不掉，AC-v21-7 数据安全级 UX）。
 * TODO(deprecated-api): execCommand 已 deprecated（无移除时间表，三引擎实测可用，
 * e2e 双引擎守行为）；若未来浏览器移除 → 下方 fallback 已就位，仅损 undo 集成。
 */

/**
 * 用 text 替换 [start, end) 区间；完成后将选区设到 select（缺省 = 光标在插入文本末尾）。
 * execCommand 经原生 input 事件触发既有 onInput → signal 写回（不绕过 SoT 单写路径）。
 */
export function replaceRange(
  ta: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
  select?: { start: number; end: number },
): void {
  ta.focus();
  ta.setSelectionRange(start, end);

  let ok = false;
  try {
    // 空串无法 insertText —— 删除语义走 delete 命令
    ok =
      text === ''
        ? start === end || document.execCommand('delete')
        : document.execCommand('insertText', false, text);
  } catch {
    ok = false; // jsdom / 极端环境未实现 → fallback
  }

  if (!ok) {
    ta.setRangeText(text, start, end, 'end');
    // 手动派发 input 让 Solid onInput 写回 signal（undo 集成丢失，功能不坏）
    let ev: Event;
    try {
      ev = new InputEvent('input', { bubbles: true, inputType: 'insertText' });
    } catch {
      ev = new Event('input', { bubbles: true });
    }
    ta.dispatchEvent(ev);
  }

  if (select) ta.setSelectionRange(select.start, select.end);
}
