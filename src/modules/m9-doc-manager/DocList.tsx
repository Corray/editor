import { For, Show, createSignal, type JSX } from 'solid-js';
import { t } from '@/modules/m7-i18n/i18n';
import type { DocManagerAPI } from './api';

interface InnerProps {
  docs: DocManagerAPI;
  onAfterSelect?: () => void; // 移动端选中后关抽屉
  /** v2.6：打开某文档版本历史（仅 IDB 可用时传入；不传 → 不渲染 ⏱ 入口）。 */
  onHistory?: (id: string) => void;
}

/** 共享列表主体：搜索 + 新建 + 文档项（标题 / 内联重命名 + 删除）。active 高亮。 */
function DocListBody(props: InnerProps) {
  const m = props.docs;
  const [editingId, setEditingId] = createSignal<string | null>(null); // v1.8 内联重命名
  const select = (id: string) => {
    if (editingId()) return; // 重命名中不切换
    void m.switchTo(id);
    props.onAfterSelect?.();
  };
  const remove = (id: string, e: Event) => {
    e.stopPropagation(); // 不触发行切换
    if (window.confirm(t('doc.delete.confirm'))) void m.remove(id);
  };
  const commitRename = (id: string, value: string) => {
    void m.rename(id, value);
    setEditingId(null);
  };
  return (
    <div class="doc-list">
      <input
        type="search"
        class="doc-list__search"
        placeholder={t('doc.search')}
        aria-label={t('doc.search')}
        value={m.query()}
        onInput={(e) => m.setQuery(e.currentTarget.value)}
      />
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
              <Show
                when={editingId() === d.id}
                fallback={
                  <span
                    class="doc-list__title"
                    title={t('doc.rename')}
                    onDblClick={(e) => {
                      e.stopPropagation();
                      setEditingId(d.id);
                    }}
                  >
                    {d.title}
                  </span>
                }
              >
                <input
                  class="doc-list__rename"
                  value={d.title}
                  autofocus
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(d.id, e.currentTarget.value);
                    else if (e.key === 'Escape') setEditingId(null); // 取消，不提交
                  }}
                  onBlur={(e) => {
                    // 仅当仍在编辑本项才提交：Esc 已置 null → unmount 触发的 blur 跳过（不误提交）
                    if (editingId() === d.id) commitRename(d.id, e.currentTarget.value);
                  }}
                />
              </Show>
              <Show when={editingId() !== d.id}>
                {/* F-V18-3：可见 ✎ 入口（双击发现性低）—— 点击进编辑 */}
                <button
                  type="button"
                  class="doc-list__rename-btn"
                  aria-label={t('doc.rename')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(d.id);
                  }}
                >
                  ✎
                </button>
                {/* v2.6：版本历史入口（仅 IDB 可用时 onHistory 传入 / ADR-022 D5）*/}
                <Show when={props.onHistory}>
                  <button
                    type="button"
                    class="doc-list__history-btn"
                    aria-label={t('history.button')}
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onHistory!(d.id);
                    }}
                  >
                    ⏱
                  </button>
                </Show>
              </Show>
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

/** 桌面左侧 sidebar。children 渲染于文档列表之后（v2.2 大纲分区，app 层组合 / ADR-018 D3）。 */
export function DocList(props: {
  docs: DocManagerAPI;
  children?: JSX.Element;
  onHistory?: (id: string) => void;
}) {
  return (
    <aside class="doc-sidebar" aria-label={t('doc.list')}>
      <DocListBody docs={props.docs} onHistory={props.onHistory} />
      {props.children}
    </aside>
  );
}

/** 移动端抽屉覆盖层（open 时显示，选中/新建后关）。 */
export function DocDrawer(props: {
  docs: DocManagerAPI;
  open: boolean;
  onClose: () => void;
  onHistory?: (id: string) => void;
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
          <DocListBody
            docs={props.docs}
            onAfterSelect={props.onClose}
            onHistory={props.onHistory}
          />
        </div>
      </div>
    </Show>
  );
}
