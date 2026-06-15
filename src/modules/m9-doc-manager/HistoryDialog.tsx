import { For, Show, type Accessor } from 'solid-js';
import { t } from '@/modules/m7-i18n/i18n';
import type { SnapRecord } from './store';

export interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  snapshots: Accessor<SnapRecord[]>;
  onSnapshotNow: () => void;
  onRestore: (snapId: string) => void;
}

/** 相对时间（粗粒度，无需精确）：刚刚 / N 分钟前 / N 小时前 / N 天前。 */
function relTime(ms: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('history.justNow');
  if (min < 60) return t('history.minAgo').replace('{n}', String(min));
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('history.hourAgo').replace('{n}', String(hr));
  return t('history.dayAgo').replace('{n}', String(Math.floor(hr / 24)));
}

/** 字数（CJK 字符 + 非 CJK 词，粗略；与 M1 wordcount 不强一致，仅列表提示）。 */
function roughCount(text: string): number {
  const cjk = text.match(/[぀-ヿ㐀-䶿一-鿿가-힯]/g)?.length ?? 0;
  const words = text
    .replace(/[぀-ヿ㐀-䶿一-鿿가-힯]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return cjk + words;
}

/**
 * 版本历史弹层（v2.6 / ADR-022）。doc-list ⏱ 入口打开。
 * 列表：相对时间 + 字数 + kind 徽标 + 恢复；顶部「立即快照」。恢复 confirm 在 onRestore 内。
 * 快照内容纯本地用户文本，列表用 textContent 渲染（无安全面）。
 */
export function HistoryDialog(props: HistoryDialogProps) {
  // 渲染时取一次 now（相对时间粗粒度，不需响应式刷新）
  const nowMs = (): number => {
    try {
      return Date.now();
    } catch {
      return 0;
    }
  };

  return (
    <Show when={props.open}>
      <div class="history-backdrop" onClick={props.onClose}>
        <div
          class="history-dialog"
          role="dialog"
          aria-label={t('history.title')}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="history-dialog__header">
            <span>{t('history.title')}</span>
            <button
              type="button"
              class="history-dialog__close"
              aria-label={t('doc.close')}
              onClick={props.onClose}
            >
              ×
            </button>
          </div>
          <button
            type="button"
            class="history-dialog__snap"
            onClick={props.onSnapshotNow}
          >
            + {t('history.snapshotNow')}
          </button>
          <Show
            when={props.snapshots().length > 0}
            fallback={
              <div class="history-dialog__empty">{t('history.empty')}</div>
            }
          >
            <ul class="history-dialog__list">
              <For each={props.snapshots()}>
                {(s) => (
                  <li class="history-item">
                    <div class="history-item__meta">
                      <span class={`history-badge history-badge--${s.kind}`}>
                        {t(`history.kind.${s.kind}`)}
                      </span>
                      <span class="history-item__time">
                        {relTime(s.createdAt, nowMs())}
                      </span>
                      <span class="history-item__count">
                        {t('history.words').replace(
                          '{n}',
                          String(roughCount(s.text)),
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      class="history-item__restore"
                      onClick={() => props.onRestore(s.id)}
                    >
                      {t('history.restore')}
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </div>
    </Show>
  );
}
