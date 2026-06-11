import { Show } from 'solid-js';
import type { FindControllerAPI } from './find';
import { t } from '@/modules/m7-i18n/i18n';

export interface FindBarProps {
  find: FindControllerAPI;
}

/**
 * 嵌入式查找/替换栏（编辑面板顶部 / TBD-v21-1a）。
 * Enter / Shift+Enter 下/上一个；Esc 关闭回焦编辑器；窄屏 flex-wrap 自动两行。
 */
export function FindBar(props: FindBarProps) {
  const count = () => {
    const total = props.find.matches().length;
    if (props.find.query() === '') return '';
    if (total === 0) return '0/0';
    return `${props.find.activeIndex() + 1}/${total}`;
  };

  const onFindKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) props.find.prev();
      else props.find.next();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      props.find.hide();
    }
  };

  return (
    <Show when={props.find.open()}>
      <div class="find-bar" role="search">
        <input
          class="find-input"
          type="text"
          placeholder={t('find.placeholder')}
          aria-label={t('find.placeholder')}
          value={props.find.query()}
          onInput={(e) => props.find.setQuery(e.currentTarget.value)}
          onKeyDown={onFindKeyDown}
          ref={(el) => setTimeout(() => el.focus())}
        />
        <span class="find-count" aria-live="polite">
          {count()}
        </span>
        <button
          type="button"
          class="find-button"
          onClick={() => props.find.prev()}
          aria-label={t('find.prev')}
        >
          ↑
        </button>
        <button
          type="button"
          class="find-button"
          onClick={() => props.find.next()}
          aria-label={t('find.next')}
        >
          ↓
        </button>
        <input
          class="find-input"
          type="text"
          placeholder={t('find.replacePlaceholder')}
          aria-label={t('find.replacePlaceholder')}
          value={props.find.replaceText()}
          onInput={(e) => props.find.setReplaceText(e.currentTarget.value)}
          onKeyDown={onFindKeyDown}
        />
        <button
          type="button"
          class="find-button"
          onClick={() => props.find.replaceCurrent()}
        >
          {t('find.replace')}
        </button>
        <button
          type="button"
          class="find-button"
          onClick={() => props.find.replaceAll()}
        >
          {t('find.replaceAll')}
        </button>
        <button
          type="button"
          class="find-button find-button--close"
          onClick={() => props.find.hide()}
          aria-label={t('find.close')}
        >
          ✕
        </button>
      </div>
    </Show>
  );
}
