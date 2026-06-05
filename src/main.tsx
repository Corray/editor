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
import {
  createExportAPI,
  createShareAPI,
  importer,
  readSharedDocument,
} from '@/modules/m4-export/api';
import type { ExportAPI, ShareAPI } from '@/modules/m4-export/api';
import { createLayout } from '@/modules/m5-layout/layout';
import type { LayoutAPI, MobileTab } from '@/modules/m5-layout/api';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import { registerSW } from 'virtual:pwa-register';
import { wireUpdatePrompt } from '@/modules/m8-pwa/register';
import './styles/main.css';

interface AppShellProps {
  state: DocumentState;
  editor: EditorAPI;
  theme: ThemeAPI;
  exporter: ExportAPI;
  persist: PersistenceAPI;
  layout: LayoutAPI;
  prefs: EditorPrefsAPI;
  share: ShareAPI;
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

  const onShare = () => {
    void props.share.share(); // 内部 toast（ok / tooLarge / copyFail）
  };

  let fileInput: HTMLInputElement | undefined;
  const onImportPick = () => fileInput?.click();
  const onImportChange = async (
    e: Event & { currentTarget: HTMLInputElement },
  ) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = ''; // 允许同一文件再次导入
    if (!file) return;
    let text: string;
    try {
      text = await importer.readFile(file);
    } catch {
      toast.show(t('import.readFail'), 'warn');
      return;
    }
    // 覆盖保护（TBD-v12-4）：当前非空先 confirm
    if (props.state.text() !== '' && !window.confirm(t('import.overwrite.confirm')))
      return;
    props.editor.setTextFromStorage(text);
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
          <button type="button" class="header-button" onClick={onShare}>
            {t('share.button')}
          </button>
          <button type="button" class="header-button" onClick={onImportPick}>
            {t('import.button')}
          </button>
          <input
            ref={(el) => (fileInput = el)}
            type="file"
            accept=".md,.markdown,.txt"
            style={{ display: 'none' }}
            onChange={onImportChange}
          />
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
    const share = createShareAPI(state.text);
    const layout = createLayout();
    const prefs = createEditorPrefs();

    // 加载优先级（api-spec v1.2 §2 / data-model v1.2 §3）：URL 分享 > IDB。
    const shared = readSharedDocument();
    if (shared !== null) {
      // 显式打开分享链接：本机 IDB 非空且内容不同 → confirm（TBD-v12-3）再覆盖。
      void loadStoredDocument().then((existing) => {
        if (!existing || existing === shared) {
          editor.setTextFromStorage(shared);
        } else if (window.confirm(t('share.overwrite.confirm'))) {
          editor.setTextFromStorage(shared);
        } else {
          // 取消覆盖 → 保留本机文档（否则编辑器停在空，丢失本机文档的显示）
          editor.setTextFromStorage(existing);
        }
        // 清 #doc=（防 reload 重触发 + 不长留地址栏）
        if (typeof history !== 'undefined') {
          history.replaceState(null, '', location.pathname + location.search);
        }
      });
    } else {
      // 正常 IDB 异步还原 + 竞争防护（v1.1）：hydrate 窗口内已输入则不覆盖。
      void loadStoredDocument().then((stored) => {
        if (stored && state.text() === '') editor.setTextFromStorage(stored);
      });
    }
    return (
      <AppShell
        state={state}
        editor={editor}
        theme={theme}
        exporter={exporter}
        persist={persist}
        layout={layout}
        prefs={prefs}
        share={share}
      />
    );
  }, root);

  // M8 PWA (ADR-009)：注册 SW + 更新提示（registerType:'prompt'）。
  // dev 下 devOptions.enabled:false → registerSW 为 no-op；真 SW 仅 build+preview/线上。
  wireUpdatePrompt(registerSW);
}
