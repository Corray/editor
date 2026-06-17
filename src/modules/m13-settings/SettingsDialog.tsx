import { Show, For } from 'solid-js';
import { t, i18n } from '@/modules/m7-i18n/i18n';
import {
  type SettingsAPI,
  SNAPSHOT_INTERVAL_PRESETS,
  SNAPSHOT_MAX_PRESETS,
} from './settings';

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: SettingsAPI;
}

const INTERVAL_LABEL: Record<number, string> = {
  60000: 'settings.interval.1min',
  300000: 'settings.interval.5min',
  600000: 'settings.interval.10min',
};

/**
 * 设置面板（v2.9 / ADR-025 D3）。header ⚙ 打开；help/history 同款骨架。
 * 收口快照间隔/上限 + 语言只读占位（v3.0 接切换）。纯数字/布尔，无安全面。
 */
export function SettingsDialog(props: SettingsDialogProps) {
  const s = props.settings;
  return (
    <Show when={props.open}>
      <div class="settings-backdrop" onClick={props.onClose}>
        <div
          class="settings-dialog"
          role="dialog"
          aria-label={t('settings.title')}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="settings-dialog__header">
            <span>{t('settings.title')}</span>
            <button
              type="button"
              class="settings-dialog__close"
              aria-label={t('doc.close')}
              onClick={props.onClose}
            >
              ×
            </button>
          </div>

          <div class="settings-dialog__body">
            {/* 自动快照开关 */}
            <label class="settings-row">
              <span>{t('settings.autoSnapshot')}</span>
              <input
                type="checkbox"
                checked={s.autoSnapshotEnabled()}
                onChange={(e) => s.setAutoSnapshotEnabled(e.currentTarget.checked)}
              />
            </label>

            {/* 快照间隔（仅自动快照开启时可调） */}
            <Show when={s.autoSnapshotEnabled()}>
              <label class="settings-row">
                <span>{t('settings.interval')}</span>
                <select
                  aria-label={t('settings.interval')}
                  value={String(s.autoSnapshotIntervalMs())}
                  onChange={(e) =>
                    s.setAutoSnapshotIntervalMs(Number(e.currentTarget.value))
                  }
                >
                  <For each={SNAPSHOT_INTERVAL_PRESETS}>
                    {(ms) => (
                      <option value={String(ms)}>{t(INTERVAL_LABEL[ms]!)}</option>
                    )}
                  </For>
                </select>
              </label>
            </Show>

            {/* 每文档快照上限 */}
            <label class="settings-row">
              <span>{t('settings.maxSnapshots')}</span>
              <select
                aria-label={t('settings.maxSnapshots')}
                value={String(s.maxSnapshotsPerDoc())}
                onChange={(e) =>
                  s.setMaxSnapshotsPerDoc(Number(e.currentTarget.value))
                }
              >
                <For each={SNAPSHOT_MAX_PRESETS}>
                  {(n) => <option value={String(n)}>{n}</option>}
                </For>
              </select>
            </label>

            {/* 语言切换（v3.0 / ADR-026 D4：接 v2.9 占位 → select；setLang 即时重渲染+持久化） */}
            <label class="settings-row">
              <span>{t('settings.language')}</span>
              <select
                aria-label={t('settings.language')}
                value={i18n.lang()}
                onChange={(e) => i18n.setLang(e.currentTarget.value as 'zh-CN' | 'en-US')}
              >
                <option value="zh-CN">{t('settings.language.zh')}</option>
                <option value="en-US">{t('settings.language.en')}</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </Show>
  );
}
