import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { createEditorPrefs, FONT_SIZE_PRESETS } from '@/modules/m1-editor/prefs';
import type { EditorPrefsAPI } from '@/modules/m1-editor/api';

interface TestContext {
  api: EditorPrefsAPI;
  dispose: () => void;
}

function setup(): TestContext {
  let api!: EditorPrefsAPI;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    api = createEditorPrefs();
  });
  return { api, dispose };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const STORAGE_KEY = 'editor.prefs.v1';

describe('M1 prefs — UT-PREF (font size + line numbers + persistence)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--editor-font-size');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UT-PREF-001: defaults — fontSize 15, lineNumbers on', async () => {
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.fontSize()).toBe(15);
    expect(api.showLineNumbers()).toBe(true);
    dispose();
  });

  it('UT-PREF-002: increase steps up through presets, clamps at top', async () => {
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.fontSize()).toBe(15);
    api.increaseFontSize();
    expect(api.fontSize()).toBe(17);
    api.increaseFontSize(); // already at max
    expect(api.fontSize()).toBe(17);
    dispose();
  });

  it('UT-PREF-003: decrease steps down through presets, clamps at bottom', async () => {
    const { api, dispose } = setup();
    await flushMicrotasks();
    api.decreaseFontSize();
    expect(api.fontSize()).toBe(13);
    api.decreaseFontSize(); // already at min
    expect(api.fontSize()).toBe(13);
    dispose();
  });

  it('UT-PREF-004: presets are exactly [13, 15, 17]', () => {
    expect([...FONT_SIZE_PRESETS]).toEqual([13, 15, 17]);
  });

  it('UT-PREF-005: toggleLineNumbers flips the flag', async () => {
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.showLineNumbers()).toBe(true);
    api.toggleLineNumbers();
    expect(api.showLineNumbers()).toBe(false);
    api.toggleLineNumbers();
    expect(api.showLineNumbers()).toBe(true);
    dispose();
  });

  it('UT-PREF-006: fontSize mirrors to --editor-font-size CSS var', async () => {
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(
      document.documentElement.style.getPropertyValue('--editor-font-size'),
    ).toBe('15px');
    api.increaseFontSize();
    await flushMicrotasks();
    expect(
      document.documentElement.style.getPropertyValue('--editor-font-size'),
    ).toBe('17px');
    dispose();
  });

  it('UT-PREF-007: changes persist to localStorage as JSON', async () => {
    const { api, dispose } = setup();
    await flushMicrotasks();
    api.decreaseFontSize();
    api.toggleLineNumbers();
    await flushMicrotasks();
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      fontSize: 13,
      showLineNumbers: false,
    });
    dispose();
  });

  it('UT-PREF-008: valid stored prefs are restored on init', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 17, showLineNumbers: false }),
    );
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.fontSize()).toBe(17);
    expect(api.showLineNumbers()).toBe(false);
    dispose();
  });

  it('UT-PREF-009: poisoned fontSize (out of presets) → default 15', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 99, showLineNumbers: true }),
    );
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.fontSize()).toBe(15);
    dispose();
  });

  it('UT-PREF-010: malformed JSON → full default', async () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.fontSize()).toBe(15);
    expect(api.showLineNumbers()).toBe(true);
    dispose();
  });

  it('UT-PREF-011: non-boolean showLineNumbers → default true', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fontSize: 13, showLineNumbers: 'yes' }),
    );
    const { api, dispose } = setup();
    await flushMicrotasks();
    expect(api.fontSize()).toBe(13);
    expect(api.showLineNumbers()).toBe(true);
    dispose();
  });
});
