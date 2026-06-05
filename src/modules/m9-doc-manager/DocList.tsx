import { For, Show } from 'solid-js';
import { t } from '@/modules/m7-i18n/i18n';
import type { DocManagerAPI } from './api';

interface InnerProps {
  docs: DocManagerAPI;
  onAfterSelect?: () => void; // 移动端选中后关抽屉
}

/** 共享列表主体：新建 + 文档项（标题 + 删除）。active 高亮，点选切换。 */
function DocListBody(props: InnerProps) {
  const m = props.docs;
  const select = (id: string) => {
    void m.switchTo(id);
    props.onAfterSelect?.();
  };
  const remove = (id: string, e: Event) => {
    e.stopPropagation(); // 不触发行切换
    if (window.confirm(t('doc.delete.confirm'))) void m.remove(id);
  };
  return (
    <div class="doc-list">
      <button
        type="button"
        class="doc-list__new"
        onClick={() => {
          void m.create();
          props.onAfterSelect?.();
        }}
      >
        + {t('doc.new')}
      </button>
      <ul class="doc-list__items" role="listbox" aria-label={t('doc.list')}>
        <For each={m.docs()}>
          {(d) => (
            <li
              class="doc-list__item"
              classList={{ 'doc-list__item--active': d.id === m.activeId() }}
              role="option"
              aria-selected={d.id === m.activeId()}
              onClick={() => select(d.id)}
            >
              <span class="doc-list__title">{d.title}</span>
              <button
                type="button"
                class="doc-list__del"
                aria-label={t('doc.delete')}
                onClick={(e) => remove(d.id, e)}
              >
                ×
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

/** 桌面左侧 sidebar。 */
export function DocList(props: { docs: DocManagerAPI }) {
  return (
    <aside class="doc-sidebar" aria-label={t('doc.list')}>
      <DocListBody docs={props.docs} />
    </aside>
  );
}

/** 移动端抽屉覆盖层（open 时显示，选中/新建后关）。 */
export function DocDrawer(props: {
  docs: DocManagerAPI;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Show when={props.open}>
      <div class="doc-drawer-backdrop" onClick={props.onClose}>
        <div
          class="doc-drawer"
          role="dialog"
          aria-label={t('doc.list')}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            class="doc-drawer__close"
            aria-label={t('doc.close')}
            onClick={props.onClose}
          >
            ×
          </button>
          <DocListBody docs={props.docs} onAfterSelect={props.onClose} />
        </div>
      </div>
    </Show>
  );
}
