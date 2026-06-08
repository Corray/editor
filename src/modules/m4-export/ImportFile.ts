/**
 * 导入 .md 文件（ADR-006 D4）。本地读取，不上传（共识 §6.3 不联网）。
 *
 * 极简包装 File.text()，作为命名 seam 便于单测 + 未来扩展（如编码检测）。
 * 调用方（chrome）负责覆盖 confirm + 写回 M1。
 */
export function readMarkdownFile(file: File): Promise<string> {
  return file.text();
}

/**
 * 启发式判定"读出的文本其实是二进制"（F-V12-2）。file.text() 以 UTF-8 解码，
 * 二进制文件 → 大量 U+FFFD 替换字符或含 NUL。命中则调用方拒绝导入（toast 提示），
 * 避免乱码进编辑器。纯文本（含中文/emoji）不会误判。
 */
export function looksBinary(text: string): boolean {
  if (text.length === 0) return false;
  if (text.includes('\u0000')) return true; // NUL → 几乎必是二进制
  const sample = text.slice(0, 4096);
  let bad = 0;
  for (const ch of sample) if (ch === '\uFFFD') bad++; // U+FFFD 替换字符
  return bad / sample.length > 0.1; // >10% → 判二进制
}
