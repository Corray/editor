const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Build filename `editor-YYYYMMDD-HHmmss.md` in local time (consensus §4.3 / TBD-6).
 *
 * Pure function — `now` is a parameter for deterministic testing.
 */
export function getFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const mo = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const mi = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  return `editor-${y}${mo}${d}-${h}${mi}${s}.md`;
}

/**
 * Trigger browser download of `text` as .md file.
 *
 * Side effects (browser only): creates a Blob, mints an object URL, builds a
 * detached <a download>, clicks it, removes it, then revokes the URL.
 * No-op when document is unavailable (SSR / Node without DOM).
 */
export function downloadMarkdown(text: string, now?: Date): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = getFileName(now);
  // Some browsers require the element to be attached for `download` to work.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
