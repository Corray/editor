import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encodeShareText,
  buildShareUrl,
  readSharedDocument,
  SHARE_URL_MAX,
} from '@/modules/m4-export/ShareUrl';
import { createShareAPI } from '@/modules/m4-export/api';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';

/** Deterministic high-entropy text (LCG) — resists lz compression, so the
 *  encoded URL exceeds SHARE_URL_MAX. (A cyclic string would compress to ~0.) */
function bigIncompressible(): string {
  let seed = 123456789;
  let s = '';
  for (let i = 0; i < 20_000; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    s += String.fromCharCode(33 + (seed % 90));
  }
  return s;
}

function setHash(h: string): void {
  window.location.hash = h;
}

describe('M4 ShareUrl — UT-SHARE / UT-LOAD (encode / decode / limit)', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('UT-SHARE-001: encode→decode round-trip (ascii)', () => {
    const text = '# Hello\n\nsome **markdown**';
    setHash(`#doc=${encodeShareText(text)}`);
    expect(readSharedDocument()).toBe(text);
  });

  it('UT-SHARE-001b: round-trip with CJK + special chars (#, &, newline, <>)', () => {
    const text = '# 标题\n\n中文 & <world> #hash 行尾\n- 列表';
    setHash(`#doc=${encodeShareText(text)}`);
    expect(readSharedDocument()).toBe(text);
  });

  it('UT-SHARE-001c: encoded payload is URL-safe (no + / = space)', () => {
    const enc = encodeShareText('# 标题 with spaces & symbols');
    expect(/[+/= ]/.test(enc)).toBe(false);
    expect(enc.startsWith('1.')).toBe(true); // version prefix
  });

  it('UT-LOAD-002: readSharedDocument decodes #doc=1.<payload>', () => {
    setHash(`#doc=${encodeShareText('restored from link')}`);
    expect(readSharedDocument()).toBe('restored from link');
  });

  it('UT-LOAD-003: no hash → null', () => {
    expect(readSharedDocument()).toBeNull();
  });

  it('UT-LOAD-INVALID: unknown version → null', () => {
    setHash('#doc=9.whatever');
    expect(readSharedDocument()).toBeNull();
  });

  it('UT-LOAD-INVALID-2: garbage payload → null (decompress fails)', () => {
    setHash('#doc=1.!!!not-valid-lz!!!');
    // lz decompress of invalid → null
    expect(readSharedDocument()).toBeNull();
  });

  it('UT-LOAD-INVALID-3: non-doc hash → null', () => {
    setHash('#something-else');
    expect(readSharedDocument()).toBeNull();
  });

  it('UT-SHARE-build: buildShareUrl returns full URL with #doc= for small doc', () => {
    const url = buildShareUrl('# small');
    expect(url).not.toBeNull();
    expect(url).toContain('#doc=1.');
  });

  it('UT-SHARE-004: oversized doc → buildShareUrl null (over SHARE_URL_MAX)', () => {
    expect(buildShareUrl(bigIncompressible())).toBeNull();
    expect(SHARE_URL_MAX).toBe(8000);
  });
});

describe('M4 createShareAPI — share() outcomes (clipboard + toast)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('UT-SHARE-success / UT-SHARE-006: small doc → clipboard + share.ok (privacy) + true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const toastSpy = vi.spyOn(toast, 'show').mockImplementation(() => {});
    const ok = await createShareAPI(() => '# hi').share();
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#doc=1.'));
    expect(toastSpy).toHaveBeenCalledWith(t('share.ok'), 'info');
  });

  it('UT-SHARE-004b: oversized → share.tooLarge + false + no clipboard write', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const toastSpy = vi.spyOn(toast, 'show').mockImplementation(() => {});
    const ok = await createShareAPI(bigIncompressible).share();
    expect(ok).toBe(false);
    expect(toastSpy).toHaveBeenCalledWith(t('share.tooLarge'), 'warn');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('clipboard write rejects → clipboard.fail + false', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const toastSpy = vi.spyOn(toast, 'show').mockImplementation(() => {});
    const ok = await createShareAPI(() => '# hi').share();
    expect(ok).toBe(false);
    expect(toastSpy).toHaveBeenCalledWith(t('clipboard.fail'), 'warn');
  });
});
