import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createPersistence } from '@/modules/m3-persistence/store';
import type { DocManagerAPI } from '@/modules/m9-doc-manager/api';
import { t } from '@/modules/m7-i18n/i18n';

/**
 * M3 v1.6 — 自动存盘时机/状态机（ADR-010 D4）。
 * M3 不再碰 IDB；写目标 = docManager.saveActiveText（单写者 = M9）。
 * 迁移/IDB/降级测试已下沉到 tests/unit/m9-doc-manager。
 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function mockDocManager(
  saveActiveText: DocManagerAPI['saveActiveText'],
): DocManagerAPI {
  const [docs] = createSignal([]);
  const [activeId] = createSignal('D_x');
  const [query] = createSignal('');
  return {
    docs,
    activeId,
    query,
    setQuery: vi.fn(),
    saveActiveText,
    create: vi.fn(async () => 'D_new'),
    switchTo: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    rename: vi.fn(async () => {}),
    setSyncHooks: vi.fn(),
    mergeRemote: vi.fn(async () => []),
  };
}

describe('M3 persistence v1.6 — 状态机 + 委托 M9', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UT-M3-001: edit → DIRTY → debounce → saveActiveText 调用 → IDLE', async () => {
    const save = vi.fn(async () => {});
    const dm = mockDocManager(save);
    const [text, setText] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text, dm);
    });
    expect(api.status()).toBe('IDLE');
    setText('# hi');
    await flushMicrotasks();
    expect(api.status()).toBe('DIRTY');
    await sleep(650);
    await flushMicrotasks();
    expect(save).toHaveBeenCalledWith('# hi');
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-M3-002: saveActiveText reject → ERROR + quota toast', async () => {
    const { toast } = await import('@/shared/toast');
    const toastSpy = vi.spyOn(toast, 'show').mockImplementation(() => {});
    const save = vi.fn(async () => {
      throw new Error('save fail');
    });
    const dm = mockDocManager(save);
    const [text, setText] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text, dm);
    });
    setText('x');
    await sleep(650);
    await flushMicrotasks();
    expect(api.status()).toBe('ERROR');
    expect(toastSpy).toHaveBeenCalledWith(t('storage.quota'), 'error');
    dispose();
  });

  it('UT-M3-003: clear → saveActiveText("")（清空 active 内容）', async () => {
    const save = vi.fn(async () => {});
    const dm = mockDocManager(save);
    const [text] = createSignal('# something');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text, dm);
    });
    await api.clear();
    expect(save).toHaveBeenCalledWith('');
    expect(api.status()).toBe('IDLE');
    dispose();
  });

  it('UT-M3-004: disable() 停止 debounced 写（不调 saveActiveText）', async () => {
    const save = vi.fn(async () => {});
    const dm = mockDocManager(save);
    const [text, setText] = createSignal('');
    let api!: import('@/modules/m3-persistence/api').PersistenceAPI;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      api = createPersistence(text, dm);
    });
    api.disable();
    setText('x');
    await sleep(650);
    await flushMicrotasks();
    expect(save).not.toHaveBeenCalled();
    dispose();
  });
});
