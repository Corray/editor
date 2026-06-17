import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'solid-js';
import {
  createSettings,
  SNAPSHOT_INTERVAL_PRESETS,
  SNAPSHOT_MAX_PRESETS,
} from '@/modules/m13-settings/settings';
import type { SettingsAPI } from '@/modules/m13-settings/settings';

const KEY = 'editor.settings.v1';

function setup(): { api: SettingsAPI; dispose: () => void } {
  let api!: SettingsAPI;
  let dispose!: () => void;
  createRoot((d) => {
    dispose = d;
    api = createSettings();
  });
  return { api, dispose };
}
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

// 测试计划 v2.9 §家族 持久化族（AC-v29-5/6）
describe('M13 settings — CT-SET', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('CT-SET-1: 默认值 = 原硬编码（5min / 30 / 开）—— 零行为变化基线', () => {
    const { api, dispose } = setup();
    expect(api.autoSnapshotEnabled()).toBe(true);
    expect(api.autoSnapshotIntervalMs()).toBe(300_000);
    expect(api.maxSnapshotsPerDoc()).toBe(30);
    dispose();
  });

  it('CT-SET-2: set + 持久化往返', async () => {
    const { api, dispose } = setup();
    api.setAutoSnapshotEnabled(false);
    api.setAutoSnapshotIntervalMs(60_000);
    api.setMaxSnapshotsPerDoc(50);
    await flush();
    dispose();
    // 新实例从 localStorage hydrate
    const { api: api2, dispose: d2 } = setup();
    expect(api2.autoSnapshotEnabled()).toBe(false);
    expect(api2.autoSnapshotIntervalMs()).toBe(60_000);
    expect(api2.maxSnapshotsPerDoc()).toBe(50);
    d2();
  });

  it('CT-SET-3: 坏 JSON → 回退默认', () => {
    localStorage.setItem(KEY, '{not json');
    const { api, dispose } = setup();
    expect(api.autoSnapshotIntervalMs()).toBe(300_000);
    dispose();
  });

  it('CT-SET-4: 非档位值 → 该字段回退默认（anti-poisoning）', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ autoSnapshotIntervalMs: 999, maxSnapshotsPerDoc: 7, autoSnapshotEnabled: 'x' }),
    );
    const { api, dispose } = setup();
    expect(api.autoSnapshotIntervalMs()).toBe(300_000); // 999 非档位
    expect(api.maxSnapshotsPerDoc()).toBe(30); // 7 非档位
    expect(api.autoSnapshotEnabled()).toBe(true); // 'x' 非 boolean
    dispose();
  });

  it('CT-SET-5: setter 拒绝非档位值（不写入）', () => {
    const { api, dispose } = setup();
    api.setAutoSnapshotIntervalMs(12345); // 非档位
    expect(api.autoSnapshotIntervalMs()).toBe(300_000); // 不变
    api.setMaxSnapshotsPerDoc(99); // 非档位
    expect(api.maxSnapshotsPerDoc()).toBe(30);
    dispose();
  });

  it('CT-SET-6: 档位常量自洽', () => {
    expect(SNAPSHOT_INTERVAL_PRESETS).toContain(300_000);
    expect(SNAPSHOT_MAX_PRESETS).toContain(30);
  });
});
