import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyHtml } from '@/modules/m4-export/CopyHtml';

describe('M4 CopyHtml — copyHtml', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('UT-EX-004 / F-F1: clipboard.writeText resolves → true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyHtml('<p>hi</p>');
    expect(writeText).toHaveBeenCalledWith('<p>hi</p>');
    expect(ok).toBe(true);
  });

  it('UT-EX-005 / F-F3: navigator without clipboard → false', async () => {
    vi.stubGlobal('navigator', {});
    const ok = await copyHtml('<p>x</p>');
    expect(ok).toBe(false);
  });

  it('navigator.clipboard exists but writeText missing → false', async () => {
    vi.stubGlobal('navigator', { clipboard: {} });
    const ok = await copyHtml('<p>x</p>');
    expect(ok).toBe(false);
  });

  it('writeText rejects (permission denied) → false (no throw)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyHtml('<p>x</p>');
    expect(ok).toBe(false);
  });
});
