import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSignal } from 'solid-js';
import { createExportAPI } from '@/modules/m4-export/api';

describe('M4 ExportAPI — createExportAPI', () => {
  let lastBlobParts: BlobPart[];
  const OriginalBlob = globalThis.Blob;

  beforeEach(() => {
    URL.createObjectURL = vi
      .fn()
      .mockReturnValue('blob:mock') as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;

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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('downloadMarkdown writes current accessor value', () => {
    const [text] = createSignal('# Hello');
    const api = createExportAPI(text);
    api.downloadMarkdown();
    expect(lastBlobParts).toEqual(['# Hello']);
  });

  it('downloadMarkdown picks up signal updates (reactive read)', () => {
    const [text, setText] = createSignal('initial');
    const api = createExportAPI(text);
    setText('updated');
    api.downloadMarkdown();
    expect(lastBlobParts).toEqual(['updated']);
  });

  it('copyHtml passes rendered HTML through clipboard', async () => {
    const [text] = createSignal('# Hello');
    let captured: string | undefined;
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn((html: string) => {
          captured = html;
          return Promise.resolve();
        }),
      },
    });
    const api = createExportAPI(text);
    const ok = await api.copyHtml();
    expect(ok).toBe(true);
    expect(captured).toBeDefined();
    expect(captured!).toContain('<h1>Hello</h1>');
  });

  it('UT-EX-006: copied HTML has no <html>/<body> outer wrapper', async () => {
    const [text] = createSignal('# x');
    let captured = '';
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn((html: string) => {
          captured = html;
          return Promise.resolve();
        }),
      },
    });
    const api = createExportAPI(text);
    await api.copyHtml();
    expect(captured.startsWith('<html')).toBe(false);
    expect(captured.startsWith('<body')).toBe(false);
    expect(captured.startsWith('<!DOCTYPE')).toBe(false);
  });

  it('copyHtml returns false when clipboard unavailable', async () => {
    const [text] = createSignal('x');
    vi.stubGlobal('navigator', {});
    const api = createExportAPI(text);
    expect(await api.copyHtml()).toBe(false);
  });
});
