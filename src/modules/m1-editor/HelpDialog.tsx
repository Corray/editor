import { For, Show } from 'solid-js';
import { t } from '@/modules/m7-i18n/i18n';

const SHORTCUT_KEYS = [
  ['Cmd/Ctrl + F', 'help.k.find'],
  ['Cmd/Ctrl + B', 'help.k.bold'],
  ['Cmd/Ctrl + I', 'help.k.italic'],
  ['Cmd/Ctrl + K', 'help.k.link'],
  ['Tab / Shift+Tab', 'help.k.indent'],
  ['Enter', 'help.k.list'],
  ['Cmd/Ctrl + /', 'help.k.help'],
  ['Esc', 'help.k.esc'],
] as const;

/**
 * 快捷键帮助浮层（ADR-020 D2）。静态 i18n 文案 textContent 渲染，无安全面。
 * Esc / 点击遮罩关闭（Esc 由 AppShell 级 keydown 处理）。
 */
export function HelpDialog(props: { open: boolean; onClose: () => void }) {
  return (
    <Show when={props.open}>
      <div class="help-backdrop" onClick={props.onClose}>
        <div
          class="help-dialog"
          role="dialog"
          aria-label={t('help.title')}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="help-dialog__header">
            <span>{t('help.title')}</span>
            <button
              type="button"
              class="help-dialog__close"
              aria-label={t('doc.close')}
              onClick={props.onClose}
            >
              ×
            </button>
          </div>
          <ul class="help-dialog__list">
            <For each={SHORTCUT_KEYS}>
              {([keys, descKey]) => (
                <li class="help-dialog__row">
                  <kbd class="help-dialog__keys">{keys}</kbd>
                  <span>{t(descKey)}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </Show>
  );
}
