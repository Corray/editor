import { createSignal, createEffect, type Accessor } from 'solid-js';

/**
 * M13 用户设置（v2.9 / ADR-025）——收口散落常量（快照间隔/上限）单一来源。
 *
 * 范式照搬 M1 prefs / M6 theme：signal + createEffect 镜像 + localStorage 持久化 +
 * anti-poisoning 读取。默认值 = 原硬编码（快照 5min/30）→ 不改设置零行为变化（AC-v29-6）。
 * M9 manager 读本 API 的 accessor 决定快照行为（store.ts 纯 IDB 层不 import 本模块）。
 */
export interface SettingsAPI {
  readonly autoSnapshotEnabled: Accessor<boolean>;
  readonly autoSnapshotIntervalMs: Accessor<number>;
  readonly maxSnapshotsPerDoc: Accessor<number>;
  setAutoSnapshotEnabled(v: boolean): void;
  setAutoSnapshotIntervalMs(ms: number): void;
  setMaxSnapshotsPerDoc(n: number): void;
}

export const SNAPSHOT_INTERVAL_PRESETS = [60_000, 300_000, 600_000] as const; // 1/5/10 min
export const SNAPSHOT_MAX_PRESETS = [10, 30, 50] as const;

const DEFAULTS = {
  autoSnapshotEnabled: true,
  autoSnapshotIntervalMs: 300_000, // 5min（= ADR-022 原常量）
  maxSnapshotsPerDoc: 30, // = ADR-022 原常量
} as const;

const STORAGE_KEY = 'editor.settings.v1';

interface StoredSettings {
  autoSnapshotEnabled: boolean;
  autoSnapshotIntervalMs: number;
  maxSnapshotsPerDoc: number;
}

/** 读取 + anti-poisoning：枚举/类型不合法 → 该字段回默认；JSON 坏/不可用 → 全量默认。 */
function readInitial(): StoredSettings {
  const fallback: StoredSettings = { ...DEFAULTS };
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return fallback;
  }
  if (!raw) return fallback;
  try {
    const p = JSON.parse(raw) as Partial<StoredSettings>;
    const intervals = SNAPSHOT_INTERVAL_PRESETS as readonly number[];
    const maxes = SNAPSHOT_MAX_PRESETS as readonly number[];
    return {
      autoSnapshotEnabled:
        typeof p.autoSnapshotEnabled === 'boolean'
          ? p.autoSnapshotEnabled
          : DEFAULTS.autoSnapshotEnabled,
      autoSnapshotIntervalMs:
        typeof p.autoSnapshotIntervalMs === 'number' &&
        intervals.includes(p.autoSnapshotIntervalMs)
          ? p.autoSnapshotIntervalMs
          : DEFAULTS.autoSnapshotIntervalMs,
      maxSnapshotsPerDoc:
        typeof p.maxSnapshotsPerDoc === 'number' &&
        maxes.includes(p.maxSnapshotsPerDoc)
          ? p.maxSnapshotsPerDoc
          : DEFAULTS.maxSnapshotsPerDoc,
    };
  } catch {
    return fallback;
  }
}

export function createSettings(): SettingsAPI {
  const init = readInitial();
  const [autoSnapshotEnabled, setEnabled] = createSignal(init.autoSnapshotEnabled);
  const [autoSnapshotIntervalMs, setInterval] = createSignal(init.autoSnapshotIntervalMs);
  const [maxSnapshotsPerDoc, setMax] = createSignal(init.maxSnapshotsPerDoc);

  // 镜像持久化（任一变更 → 写 localStorage，best-effort）
  createEffect(() => {
    const payload: StoredSettings = {
      autoSnapshotEnabled: autoSnapshotEnabled(),
      autoSnapshotIntervalMs: autoSnapshotIntervalMs(),
      maxSnapshotsPerDoc: maxSnapshotsPerDoc(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota / 不可用 — best effort */
    }
  });

  return {
    autoSnapshotEnabled,
    autoSnapshotIntervalMs,
    maxSnapshotsPerDoc,
    setAutoSnapshotEnabled: (v) => setEnabled(v),
    setAutoSnapshotIntervalMs: (ms) => {
      if ((SNAPSHOT_INTERVAL_PRESETS as readonly number[]).includes(ms)) setInterval(ms);
    },
    setMaxSnapshotsPerDoc: (n) => {
      if ((SNAPSHOT_MAX_PRESETS as readonly number[]).includes(n)) setMax(n);
    },
  };
}
