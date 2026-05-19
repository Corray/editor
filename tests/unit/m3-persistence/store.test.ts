import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createPersistence } from '@/modules/m3-persistence/store';
import type { PersistenceAPI } from '@/modules/m3-persistence/api';
import { toast } from '@/shared/toast';

interface TestContext {
  api: PersistenceAPI;
  setText: (v: string) => void;
  dispose: () => void;
}

function setup(initial = ''): TestContext {
  const [text, setText] = createSignal(initial);
  let api!: PersistenceAPI;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    api = createPersistence(text);
  });
  return { api, setText, dispose };
}

async function flushMicrotasks(): Promise<void> {
  // Solid effects schedule on microtasks; flush twice to cover nested updates.
  await Promise.resolve();
  await Promise.resolve();
}

describe('M3 persistence — UT-PR (state machine + invariants)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.spyOn(toast, 'show').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('UT-PR-001 / F-C1: IDLE + input → DIRTY', async () => {
    const { api, setText, dispose } = setup();
    expect(api.status()).toBe('IDLE');
    setText('hello');
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');
    dispose();
  });

  it('UT-PR-002 / F-C3: DIRTY + input → DIRTY (timer reset)', async () => {
    const { api, setText, dispose } = setup();
    setText('a');
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');

    vi.advanceTimersByTime(400);
    setText('ab');
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');

    // 400ms since reset — not yet 500
    vi.advanceTimersByTime(400);
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');
    dispose();
  });

  it('UT-PR-003 / F-C4: DIRTY + 500ms → SAVING → IDLE', async () => {
    const { api, setText, dispose } = setup();
    setText('saved');
    await flushMicrotasks();

    vi.advanceTimersByTime(500);
    await flushMicrotasks();

    expect(localStorage.getItem('editor.document.v1')).toBe('saved');
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-PR-004 / F-C8: SAVING + QuotaExceeded → ERROR + toast', async () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });

    const { api, setText, dispose } = setup();
    setText('x');
    await flushMicrotasks();
    vi.advanceTimersByTime(500);
    await flushMicrotasks();

    expect(api.status()).toBe('ERROR');
    expect(toast.show).toHaveBeenCalledWith(
      expect.stringContaining('quota'),
      'error',
    );
    expect(setItemSpy).toHaveBeenCalled();
    dispose();
  });

  it('UT-PR-005 / F-C12: ERROR + 5s idle → IDLE', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    const { api, setText, dispose } = setup();
    setText('x');
    await flushMicrotasks();
    vi.advanceTimersByTime(500);
    await flushMicrotasks();
    expect(api.status()).toBe('ERROR');

    vi.advanceTimersByTime(5000);
    await flushMicrotasks();
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-PR-006 / F-C5: DIRTY + clear → IDLE + removeItem', async () => {
    localStorage.setItem('editor.document.v1', 'old');
    const { api, setText, dispose } = setup();
    setText('a');
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');

    api.clear();
    expect(localStorage.getItem('editor.document.v1')).toBeNull();
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-PR-007: invariant — setItem(KEY_DOC) only on DIRTY→SAVING', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { api, setText, dispose } = setup();

    setText('a');
    await flushMicrotasks();
    setText('ab');
    await flushMicrotasks();
    setText('abc');
    await flushMicrotasks();

    // 多次 input 不应触发 DOC key setItem（每次都 reset debounce）
    const beforeAdvanceCalls = setItemSpy.mock.calls.filter(
      (c) => c[0] === 'editor.document.v1',
    );
    expect(beforeAdvanceCalls.length).toBe(0);

    vi.advanceTimersByTime(500);
    await flushMicrotasks();

    const docCalls = setItemSpy.mock.calls.filter(
      (c) => c[0] === 'editor.document.v1',
    );
    expect(docCalls.length).toBe(1);
    expect(docCalls[0]?.[1]).toBe('abc');
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-PR-008: init returns stored value', () => {
    localStorage.setItem('editor.document.v1', 'restored');
    const { api, dispose } = setup();
    expect(api.init()).toBe('restored');
    dispose();
  });

  it('UT-PR-009: init returns empty when key absent', () => {
    const { api, dispose } = setup();
    expect(api.init()).toBe('');
    dispose();
  });

  it('UT-PR-010 / F-D21: large doc (>1MB) triggers toast once + sets notice key', async () => {
    const { setText, dispose } = setup();
    const huge = 'x'.repeat(1_000_001);
    setText(huge);
    await flushMicrotasks();

    expect(toast.show).toHaveBeenCalledWith(
      expect.stringContaining('1MB'),
      'info',
      8000,
    );
    expect(localStorage.getItem('editor.notice.large-doc.v1')).toBe('1');
    dispose();
  });

  it('UT-PR-011 / F-D21: large doc toast suppressed when notice key already set', async () => {
    localStorage.setItem('editor.notice.large-doc.v1', '1');
    const { setText, dispose } = setup();
    const huge = 'x'.repeat(1_000_001);

    setText(huge);
    await flushMicrotasks();
    setText(huge + 'y');
    await flushMicrotasks();

    expect(toast.show).not.toHaveBeenCalled();
    dispose();
  });

  it('clear() also resets notice key (large-doc toast can fire again after clear)', async () => {
    localStorage.setItem('editor.notice.large-doc.v1', '1');
    const { api, setText, dispose } = setup();
    api.clear();
    expect(localStorage.getItem('editor.notice.large-doc.v1')).toBeNull();

    const huge = 'x'.repeat(1_000_001);
    setText(huge);
    await flushMicrotasks();
    expect(toast.show).toHaveBeenCalledWith(
      expect.stringContaining('1MB'),
      'info',
      8000,
    );
    dispose();
  });

  it('disable() stops debounced writes', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { api, setText, dispose } = setup();
    api.disable();
    setText('x');
    await flushMicrotasks();
    vi.advanceTimersByTime(500);
    await flushMicrotasks();

    const docCalls = setItemSpy.mock.calls.filter(
      (c) => c[0] === 'editor.document.v1',
    );
    expect(docCalls.length).toBe(0);
    dispose();
  });
});
