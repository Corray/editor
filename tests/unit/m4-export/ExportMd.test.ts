import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFileName, downloadMarkdown } from '@/modules/m4-export/ExportMd';

describe('M4 ExportMd — getFileName', () => {
  it('UT-EX-001: filename format editor-YYYYMMDD-HHmmss.md', () => {
    const name = getFileName(new Date());
    expect(name).toMatch(/^editor-\d{8}-\d{6}\.md$/);
  });

  it('zero pads single-digit fields (local time)', () => {
    // 2026-01-05 03:04:05 local
    const now = new Date(2026, 0, 5, 3, 4, 5);
    expect(getFileName(now)).toBe('editor-20260105-030405.md');
  });

  it('handles boundary date Dec 31 23:59:59 local time', () => {
    const now = new Date(2026, 11, 31, 23, 59, 59);
    expect(getFileName(now)).toBe('editor-20261231-235959.md');
  });

  it('uses local time fields, not UTC', () => {
    // Force a specific local-time value; we cannot test cross-TZ easily,
    // but we can assert all fields read from local getters by spying.
    const now = new Date(2026, 5, 15, 10, 20, 30);
    const result = getFileName(now);
    expect(result).toBe('editor-20260615-102030.md');
  });
});

describe('M4 ExportMd — downloadMarkdown', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let lastBlobParts: BlobPart[];
  const OriginalBlob = globalThis.Blob;

  beforeEach(() => {
    createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL =
      createObjectURLMock as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL =
      revokeObjectURLMock as unknown as typeof URL.revokeObjectURL;

    // 拦截 Blob constructor 抓 parts —— jsdom Blob.text() / Response(blob)
    // 都不能 reliably 读 content；从构造时拦截 parts 是最 robust 路径。
    lastBlobParts = [];
    class TrackedBlob extends OriginalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        lastBlobParts = parts;
      }
    }
    globalThis.Blob = TrackedBlob as unknown as typeof Blob;
  });

  afterEach(() => {
    globalThis.Blob = OriginalBlob;
    vi.restoreAllMocks();
  });

  it('UT-EX-002: blob constructed with source text + correct mime', () => {
    let captured: Blob | undefined;
    createObjectURLMock.mockImplementation((b: Blob) => {
      captured = b;
      return 'blob:mock-url';
    });
    downloadMarkdown('hello\nworld');
    expect(captured).toBeInstanceOf(OriginalBlob);
    expect(lastBlobParts).toEqual(['hello\nworld']);
    expect(captured!.type).toMatch(/^text\/markdown/);
  });

  it('UT-EX-003: URL.revokeObjectURL is called with the mint url', () => {
    downloadMarkdown('x');
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });

  it('attaches <a download> to body, clicks, then detaches', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    downloadMarkdown('x');
    expect(appendSpy).toHaveBeenCalled();
    const a = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
    expect(a.tagName).toBe('A');
    expect(a.download).toMatch(/^editor-\d{8}-\d{6}\.md$/);
    expect(a.href).toContain('blob:mock-url');
    expect(removeSpy).toHaveBeenCalled();
  });

  it('uses provided `now` argument for filename', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    downloadMarkdown('x', new Date(2026, 0, 5, 3, 4, 5));
    const a = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement;
    expect(a.download).toBe('editor-20260105-030405.md');
  });
});
