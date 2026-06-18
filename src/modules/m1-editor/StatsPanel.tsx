import { Show, For, type Accessor } from 'solid-js';
import { t } from '@/modules/m7-i18n/i18n';
import type { DocStats } from './wordcount';

export interface StatsPanelProps {
  open: boolean;
  onClose: () => void;
  stats: Accessor<DocStats>;
}

/**
 * 文档统计弹层（v3.2 / ADR-028 D2）。点击 status bar 开；纯数字 textContent 渲染。
 * 锚定在编辑区底部 status bar 上方（绝对定位）。
 */
export function StatsPanel(props: StatsPanelProps) {
  const rows = (): [string, string | number][] => {
    const s = props.stats();
    const mins = s.minutes === 0 ? '0' : s.minutes === -1 ? '<1' : String(s.minutes);
    return [
      ['stats.charsWithSpaces', s.charsWithSpaces],
      ['stats.charsNoSpaces', s.charsNoSpaces],
      ['stats.words', s.words],
      ['stats.cjk', s.cjk],
      ['stats.headings', s.headings],
      ['stats.paragraphs', s.paragraphs],
      ['stats.readingTime', mins],
    ];
  };

  return (
    <Show when={props.open}>
      {/* 点击遮罩关闭（透明，捕获外部点击）*/}
      <div class="stats-backdrop" onClick={props.onClose} />
      <div class="stats-panel" role="dialog" aria-label={t('stats.title')}>
        <div class="stats-panel__title">{t('stats.title')}</div>
        <dl class="stats-panel__list">
          <For each={rows()}>
            {([key, val]) => (
              <div class="stats-row">
                <dt>{t(key)}</dt>
                <dd>{val}</dd>
              </div>
            )}
          </For>
        </dl>
      </div>
    </Show>
  );
}
