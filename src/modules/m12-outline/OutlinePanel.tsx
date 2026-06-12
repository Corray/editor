import { For, Show, type Accessor } from 'solid-js';
import type { OutlineItem } from './outline';
import { t } from '@/modules/m7-i18n/i18n';

export interface OutlinePanelProps {
  items: Accessor<OutlineItem[]>;
  onJump: (item: OutlineItem) => void;
  /** 当前 section 高亮 index（v2.4 / ADR-020 D3）；省略 = 不高亮 */
  activeIndex?: Accessor<number>;
}

/**
 * 大纲面板（ADR-018 D3）—— sidebar 下半分区，由 AppShell 组合进 DocList children。
 * 标题按 level 缩进；点击 onJump（跳转编排在 AppShell）；无标题显空态。
 * 标题文本 textContent 渲染（无 XSS 面）。
 */
export function OutlinePanel(props: OutlinePanelProps) {
  return (
    <nav class="outline-panel" aria-label={t('outline.title')}>
      <div class="outline-panel__header">{t('outline.title')}</div>
      <Show
        when={props.items().length > 0}
        fallback={<div class="outline-panel__empty">{t('outline.empty')}</div>}
      >
        <ul class="outline-panel__items">
          <For each={props.items()}>
            {(item, i) => (
              <li>
                <button
                  type="button"
                  class={`outline-item outline-item--l${item.level}`}
                  classList={{
                    'outline-item--active': props.activeIndex?.() === i(),
                  }}
                  onClick={() => props.onJump(item)}
                  title={item.text}
                >
                  {item.text}
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </nav>
  );
}
