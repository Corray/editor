import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createTheme } from '@/modules/m6-theme/theme';
import type { ThemeAPI } from '@/modules/m6-theme/api';

interface TestContext {
  api: ThemeAPI;
  dispose: () => void;
}

function setup(): TestContext {
  let api!: ThemeAPI;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    api = createTheme();
  });
  return { api, dispose };
}

function mockMatchMedia(prefersDark: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  );
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('M6 theme — UT-TH (init + toggle + setTheme + DOM/localStorage sync)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('UT-TH-001 / F-B1: localStorage "light" wins over system "dark"', async () => {
    localStorage.setItem('editor.theme.v1', 'light');
    mockMatchMedia(true);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    dispose();
  });

  it('UT-TH-002 / F-B2: localStorage "dark" wins over system "light"', async () => {
    localStorage.setItem('editor.theme.v1', 'dark');
    mockMatchMedia(false);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    dispose();
  });

  it('UT-TH-003 / F-B3: no localStorage + system light → light', async () => {
    mockMatchMedia(false);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('light');
    dispose();
  });

  it('UT-TH-004 / F-B4: no localStorage + system dark → dark', async () => {
    mockMatchMedia(true);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    dispose();
  });

  it('F-B5: no localStorage + no matchMedia API → light fallback', async () => {
    // jsdom doesn't implement matchMedia by default; we do NOT stub here
    // to verify the catch-fallthrough path.
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('light');
    dispose();
  });

  it('UT-TH-005: toggle flips light ↔ dark and writes DOM', async () => {
    mockMatchMedia(false);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('light');

    api.toggle();
    await flushMicrotasks();
    expect(api.theme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    api.toggle();
    await flushMicrotasks();
    expect(api.theme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    dispose();
  });

  it('UT-TH-006: setTheme writes localStorage + dataset', async () => {
    mockMatchMedia(false);
    const { api, dispose } = setup();
    await flushMicrotasks();

    api.setTheme('dark');
    await flushMicrotasks();
    expect(api.theme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('editor.theme.v1')).toBe('dark');
    dispose();
  });

  it('invalid localStorage value → ignored, falls back to system pref', async () => {
    localStorage.setItem('editor.theme.v1', 'pink'); // poison
    mockMatchMedia(true);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.theme()).toBe('dark');
    dispose();
  });

  it('createEffect writes localStorage on every theme change', async () => {
    mockMatchMedia(false);
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(localStorage.getItem('editor.theme.v1')).toBe('light');

    api.toggle();
    await flushMicrotasks();
    expect(localStorage.getItem('editor.theme.v1')).toBe('dark');
    dispose();
  });
});
