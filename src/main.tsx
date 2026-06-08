/* @refresh reload */
import { Show, createSignal, createEffect, onCleanup } from 'solid-js';
import type { Accessor, Setter } from 'solid-js';
import { render } from 'solid-js/web';
import { createDocumentState } from '@/modules/m1-editor/state';
import type { DocumentState } from '@/modules/m1-editor/state';
import { createEditorAPI, createEditorPrefs } from '@/modules/m1-editor/api';
import type { EditorAPI, EditorPrefsAPI } from '@/modules/m1-editor/api';
import { EditorArea } from '@/modules/m1-editor/EditorArea';
import { PreviewArea } from '@/modules/m2-preview/PreviewArea';
import { createPersistence } from '@/modules/m3-persistence/store';
import type { PersistenceAPI } from '@/modules/m3-persistence/api';
import {
  createDocManager,
  loadInitialDocs,
} from '@/modules/m9-doc-manager/api';
import type { DocManagerAPI } from '@/modules/m9-doc-manager/api';
import { DocList, DocDrawer } from '@/modules/m9-doc-manager/DocList';
import { createScrollSync } from '@/modules/m10-scroll-sync/sync';
import { createSyncFeature } from '@/modules/m11-sync/feature';
import type { SyncFeature } from '@/modules/m11-sync/feature';
import { createTheme, applyInitialTheme } from '@/modules/m6-theme/theme';
import type { ThemeAPI } from '@/modules/m6-theme/api';
import {
  createExportAPI,
  createShareAPI,
  importer,
  looksBinary,
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
  docManager: DocManagerAPI;
  sync: SyncFeature;
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

  // v2.0 登录（magic link）。MVP：prompt 取 email（极简，真云待 provision）。
  const onLogin = () => {
    const email = window.prompt(t('auth.emailPrompt'));
    if (!email) return;
    toast.show(t('auth.privacy'), 'info'); // 隐私提示：内容将明文存云端（ADR-016 D4）
    void props.sync.signIn(email.trim()).then((r) => {
      toast.show(r.ok ? t('auth.checkEmail') : t('auth.failed'), r.ok ? 'info' : 'warn');
    });
  };
  const onLogout = () => void props.sync.signOut();

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
    // F-V12-2：二进制文件读为乱码 → 拒绝导入（不进编辑器）
    if (looksBinary(text)) {
      toast.show(t('import.notText'), 'warn');
      return;
    }
    // v1.6（ADR-010 D6）：导入 = 新建文档（不覆盖当前）
    void props.docManager.create(text);
  };

  const [drawerOpen, setDrawerOpen] = createSignal(false);

  // M10 滚动同步（v1.7 / ADR-011）：仅桌面双栏挂载；viewport 切换 / 字号变 → 重建。
  const [editorEl, setEditorEl] = createSignal<HTMLTextAreaElement>();
  const [previewEl, setPreviewEl] = createSignal<HTMLElement>();
  createEffect(() => {
    props.prefs.fontSize(); // dep：字号变 → 行高变 → 重建以更新映射
    if (props.layout.viewport() !== 'desktop') return;
    const ed = editorEl();
    const pv = previewEl();
    if (!ed || !pv) return;
    const cs = getComputedStyle(ed);
    let lh = parseFloat(cs.lineHeight);
    if (!Number.isFinite(lh)) lh = parseFloat(cs.fontSize) * 1.6 || 24;
    const sync = createScrollSync(ed, pv, lh);
    onCleanup(() => sync.dispose());
  });

  return (
    <main class="app-shell">
      <header class="app-header">
        <h1>{t('app.title')}</h1>
        <div class="header-actions">
          <Show when={props.layout.viewport() === 'mobile'}>
            <button
              type="button"
              class="header-button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('doc.button')}
            >
              ☰ {t('doc.button')}
            </button>
          </Show>
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
          <Show when={props.sync.enabled}>
            <Show
              when={props.sync.user()}
              fallback={
                <button type="button" class="header-button" onClick={onLogin}>
                  {t('auth.login')}
                </button>
              }
            >
              {(u) => (
                <button
                  type="button"
                  class="header-button"
                  onClick={onLogout}
                  title={u().email}
                >
                  {t('auth.logout')}
                </button>
              )}
            </Show>
          </Show>
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
          <>
            <MobilePanes
              state={props.state}
              mobileTab={props.layout.mobileTab}
              setMobileTab={props.layout.setMobileTab}
              showLineNumbers={props.prefs.showLineNumbers}
            />
            <DocDrawer
              docs={props.docManager}
              open={drawerOpen()}
              onClose={() => setDrawerOpen(false)}
            />
          </>
        }
      >
        <div class="workspace">
          <DocList docs={props.docManager} />
          <div class="panes">
            <div class="editor-pane">
              <EditorArea
                state={props.state}
                showLineNumbers={props.prefs.showLineNumbers}
                editorRef={setEditorEl}
              />
            </div>
            <PreviewArea state={props.state} scrollRef={setPreviewEl} />
          </div>
        </div>
      </Show>
    </main>
  );
}

// 启动序列（v1.6 多文档 / api-spec v1.6 §1 / ADR-010 D4）：
//   1. loadInitialDocs() 先于 render —— 迁移 + 拿 active doc 文本作初始（M9 拥有
//      documents store + 迁移；纯 IDB，无 Solid 信号 → 可在 createRoot 外 await）
//   2. render(createRoot)：state(activeText) → editor → docManager → persistence
//   3. open-shared #doc= → docManager.create（新建文档，不覆盖 / ADR-010 D6）
async function bootstrap(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return;

  applyInitialTheme(); // 同步应用主题，先于 await（防深色 FOUC / async bootstrap）
  const shared = readSharedDocument(); // 在 hash 被清前读
  const initial = await loadInitialDocs(Date.now());
  const activeDoc = initial.docs.find((d) => d.id === initial.activeId);
  const activeText = activeDoc?.text ?? '';

  render(() => {
    const state = createDocumentState(activeText);
    const editor = createEditorAPI(state);
    const docManager = createDocManager({
      initial,
      now: () => Date.now(),
      setEditorText: (txt) => editor.setTextFromStorage(txt),
      getEditorText: state.text,
    });
    const persist = createPersistence(state.text, docManager);
    const sync = createSyncFeature(docManager); // v2.0：env 缺失 → enabled=false（纯本地不变）
    const theme = createTheme();
    const exporter = createExportAPI(state.text);
    const share = createShareAPI(state.text);
    const layout = createLayout();
    const prefs = createEditorPrefs();

    // open-shared：作为新文档导入（不覆盖当前 / ADR-010 D6）
    if (shared !== null) {
      void docManager.create(shared).then(() => {
        if (typeof history !== 'undefined') {
          history.replaceState(null, '', location.pathname + location.search);
        }
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
        docManager={docManager}
        sync={sync}
      />
    );
  }, root);

  // M8 PWA (ADR-009)：注册 SW + 更新提示（registerType:'prompt'）。
  wireUpdatePrompt(registerSW);
}

void bootstrap();
