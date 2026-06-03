/* @refresh reload */
import { Show } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import { render } from 'solid-js/web';
import { createDocumentState } from '@/modules/m1-editor/state';
import type { DocumentState } from '@/modules/m1-editor/state';
import { createEditorAPI, createEditorPrefs } from '@/modules/m1-editor/api';
import type { EditorAPI, EditorPrefsAPI } from '@/modules/m1-editor/api';
import { EditorArea } from '@/modules/m1-editor/EditorArea';
import { PreviewArea } from '@/modules/m2-preview/PreviewArea';
import {
  createPersistence,
  loadStoredDocument,
} from '@/modules/m3-persistence/store';
import type { PersistenceAPI } from '@/modules/m3-persistence/api';
import { createTheme } from '@/modules/m6-theme/theme';
import type { ThemeAPI } from '@/modules/m6-theme/api';
import { createExportAPI } from '@/modules/m4-export/api';
import type { ExportAPI } from '@/modules/m4-export/api';
import { createLayout } from '@/modules/m5-layout/layout';
import type { LayoutAPI, MobileTab } from '@/modules/m5-layout/api';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import './styles/main.css';

interface AppShellProps {
  state: DocumentState;
  editor: EditorAPI;
  theme: ThemeAPI;
  exporter: ExportAPI;
  persist: PersistenceAPI;
  layout: LayoutAPI;
  prefs: EditorPrefsAPI;
}

interface MobilePanesProps {
  state: DocumentState;
  mobileTab: Accessor<MobileTab>;
  setMobileTab: Setter<MobileTab>;
  showLineNumbers: Accessor<boolean>;
}

function MobilePanes(props: MobilePanesProps) {
  return (
    <>
      <div class="mobile-tabs" role="tablist" aria-label="Mobile panes">
        <button
          type="button"
          role="tab"
          class="mobile-tab"
          classList={{ 'mobile-tab--active': props.mobileTab() === 'edit' }}
          aria-selected={props.mobileTab() === 'edit'}
          onClick={() => props.setMobileTab('edit')}
        >
          {t('tab.edit')}
        </button>
        <button
          type="button"
          role="tab"
          class="mobile-tab"
          classList={{
            'mobile-tab--active': props.mobileTab() === 'preview',
          }}
          aria-selected={props.mobileTab() === 'preview'}
          onClick={() => props.setMobileTab('preview')}
        >
          {t('tab.preview')}
        </button>
      </div>
      <div class="panes panes--mobile">
        <Show when={props.mobileTab() === 'edit'}>
          <div class="editor-pane">
            <EditorArea
              state={props.state}
              showLineNumbers={props.showLineNumbers}
            />
          </div>
        </Show>
        <Show when={props.mobileTab() === 'preview'}>
          <PreviewArea state={props.state} />
        </Show>
      </div>
    </>
  );
}

function AppShell(props: AppShellProps) {
  const onCopy = async () => {
    const ok = await props.exporter.copyHtml();
    toast.show(
      t(ok ? 'clipboard.ok' : 'clipboard.fail'),
      ok ? 'info' : 'warn',
    );
  };

  const onClear = () => {
    if (window.confirm(t('clear.confirm'))) {
      props.editor.clear(); // 同步清 UI
      void props.persist.clear(); // 异步删 IDB + 遗留 key（fire-and-forget）
    }
  };

  return (
    <main class="app-shell">
      <header class="app-header">
        <h1>{t('app.title')}</h1>
        <div class="header-actions">
          <button type="button" class="header-button" onClick={onClear}>
            {t('clear.button')}
          </button>
          <button
            type="button"
            class="header-button"
            onClick={() => props.exporter.downloadMarkdown()}
          >
            {t('download.button')}
          </button>
          <button type="button" class="header-button" onClick={onCopy}>
            {t('copy.button')}
          </button>
          <button
            type="button"
            class="header-button"
            onClick={() => props.prefs.decreaseFontSize()}
            aria-label={t('editor.fontDecrease')}
          >
            A−
          </button>
          <button
            type="button"
            class="header-button"
            onClick={() => props.prefs.increaseFontSize()}
            aria-label={t('editor.fontIncrease')}
          >
            A+
          </button>
          <button
            type="button"
            class="header-button"
            classList={{
              'header-button--active': props.prefs.showLineNumbers(),
            }}
            aria-pressed={props.prefs.showLineNumbers()}
            onClick={() => props.prefs.toggleLineNumbers()}
            aria-label={t('editor.lineNumbers')}
          >
            #
          </button>
          <button
            type="button"
            class="theme-toggle"
            onClick={() => props.theme.toggle()}
            aria-label={t('theme.toggle')}
          >
            {t('theme.toggle')}
          </button>
        </div>
      </header>
      <Show
        when={props.layout.viewport() === 'desktop'}
        fallback={
          <MobilePanes
            state={props.state}
            mobileTab={props.layout.mobileTab}
            setMobileTab={props.layout.setMobileTab}
            showLineNumbers={props.prefs.showLineNumbers}
          />
        }
      >
        <div class="panes">
          <div class="editor-pane">
            <EditorArea
              state={props.state}
              showLineNumbers={props.prefs.showLineNumbers}
            />
          </div>
          <PreviewArea state={props.state} />
        </div>
      </Show>
    </main>
  );
}

const root = document.getElementById('root');
if (root) {
  // 启动序列（v1.1 异步 / api-spec v1.1 §2 / ADR-005 D4）：
  //   1. createDocumentState('') — 先空（IDB 异步，首帧拿不到文档）
  //   2. createEditorAPI / createPersistence(state.text) — 订阅 text debounce 写 IDB
  //   3. 其余 chrome（theme / exporter / layout / prefs）同步装配
  //   4. loadStoredDocument() 异步 hydrate（含一次性迁移）→ resolve 后 setTextFromStorage
  //      （共识 TBD-v11-1 (a)：空 editor 闪现后填入；IDB 单 key 读通常 <50ms）
  //
  // createPersistence / createTheme 内部跑 createEffect，须在 createRoot 内；
  // render() 已包 createRoot，装配放回调里。
  render(() => {
    const state = createDocumentState('');
    const editor = createEditorAPI(state);
    const persist = createPersistence(state.text);
    const theme = createTheme();
    const exporter = createExportAPI(state.text);
    const layout = createLayout();
    const prefs = createEditorPrefs();

    // 异步还原（不阻塞首帧）。**竞争防护**：若用户在 hydrate 窗口（<50ms）内已
    // 输入，state.text() 非空 → 不还原，避免 setTextFromStorage 覆盖用户输入（数据丢失）。
    // 还原命中时 setText 会触发 persist effect 写回同值到 IDB（幂等无害）。
    void loadStoredDocument().then((stored) => {
      if (stored && state.text() === '') editor.setTextFromStorage(stored);
    });
    return (
      <AppShell
        state={state}
        editor={editor}
        theme={theme}
        exporter={exporter}
        persist={persist}
        layout={layout}
        prefs={prefs}
      />
    );
  }, root);
}
