import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'solid-js';
import { createLayout } from '@/modules/m5-layout/layout';
import type { LayoutAPI } from '@/modules/m5-layout/api';

interface MockMQL {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
}

function mockMatchMedia(matches: boolean): MockMQL {
  const mql: MockMQL = {
    matches,
    media: '(max-width: 767px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql));
  return mql;
}

interface TestContext {
  api: LayoutAPI;
  dispose: () => void;
}

function setup(): TestContext {
  let api!: LayoutAPI;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    api = createLayout();
  });
  return { api, dispose };
}

describe('M5 layout — viewport + mobileTab + matchMedia reactivity', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('init: matchMedia matches → viewport=mobile', () => {
    mockMatchMedia(true);
    const { api, dispose } = setup();
    expect(api.viewport()).toBe('mobile');
    dispose();
  });

  it('init: matchMedia not matches → viewport=desktop', () => {
    mockMatchMedia(false);
    const { api, dispose } = setup();
    expect(api.viewport()).toBe('desktop');
    dispose();
  });

  it('matchMedia API absent → fallback desktop', () => {
    // jsdom by default has no matchMedia; skip stub
    const { api, dispose } = setup();
    expect(api.viewport()).toBe('desktop');
    dispose();
  });

  it('mobileTab default is "edit"', () => {
    mockMatchMedia(true);
    const { api, dispose } = setup();
    expect(api.mobileTab()).toBe('edit');
    dispose();
  });

  it('setMobileTab toggles between edit and preview', () => {
    mockMatchMedia(true);
    const { api, dispose } = setup();
    api.setMobileTab('preview');
    expect(api.mobileTab()).toBe('preview');
    api.setMobileTab('edit');
    expect(api.mobileTab()).toBe('edit');
    dispose();
  });

  it('matchMedia change event flips viewport reactively', () => {
    const mql = mockMatchMedia(false);
    const { api, dispose } = setup();
    expect(api.viewport()).toBe('desktop');

    // Get the bound handler (addEventListener call recorded)
    const handler = mql.addEventListener.mock.calls[0]?.[1] as (
      e: { matches: boolean },
    ) => void;
    expect(typeof handler).toBe('function');

    handler({ matches: true });
    expect(api.viewport()).toBe('mobile');

    handler({ matches: false });
    expect(api.viewport()).toBe('desktop');
    dispose();
  });

  it('dispose removes matchMedia change listener (onCleanup)', () => {
    const mql = mockMatchMedia(false);
    const { dispose } = setup();
    expect(mql.addEventListener).toHaveBeenCalled();
    dispose();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });

  it('mobileTab does not persist (each createLayout starts at edit)', () => {
    mockMatchMedia(true);
    const ctx1 = setup();
    ctx1.api.setMobileTab('preview');
    ctx1.dispose();

    const ctx2 = setup();
    expect(ctx2.api.mobileTab()).toBe('edit'); // fresh instance, no leak
    ctx2.dispose();
  });
});
