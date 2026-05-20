/**
 * Copy `html` string to system clipboard.
 *
 * @returns `true` on success, `false` if:
 *   - Clipboard API unavailable (HTTP context / older browser / no `navigator`)
 *   - `writeText` rejects (user-denied permission, focus, etc.)
 *
 * Caller decides how to surface failure (typically toast `t('clipboard.fail')`).
 */
export async function copyHtml(html: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch {
    return false;
  }
}
