/**
 * 文档标题自动派生（ADR-010 D5 / TBD-v16-5a）。
 * 取首个 H1（`# ...`）或首非空行，trim + 截断 ~40；空 → 'Untitled'。
 * 无手动重命名（MVP）。
 */
const MAX = 40;
export const UNTITLED = 'Untitled';

export function deriveTitle(text: string): string {
  const lines = text.split('\n');
  // 优先首个 ATX H1
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const h1 = line.match(/^#\s+(.+)$/);
    const candidate = (h1?.[1] ?? line).trim();
    if (candidate) return truncate(candidate);
    // 首非空行即决定（H1 或普通），不再往下
    return truncate(line);
  }
  return UNTITLED;
}

function truncate(s: string): string {
  return s.length > MAX ? s.slice(0, MAX).trimEnd() + '…' : s;
}
