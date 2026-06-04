/**
 * 导入 .md 文件（ADR-006 D4）。本地读取，不上传（共识 §6.3 不联网）。
 *
 * 极简包装 File.text()，作为命名 seam 便于单测 + 未来扩展（如编码检测）。
 * 调用方（chrome）负责覆盖 confirm + 写回 M1。
 */
export function readMarkdownFile(file: File): Promise<string> {
  return file.text();
}
