/* @refresh reload */
import { render } from 'solid-js/web';
import { createDocumentState } from '@/modules/m1-editor/state';
import type { DocumentState } from '@/modules/m1-editor/state';
import { createEditorAPI } from '@/modules/m1-editor/api';
import type { EditorAPI } from '@/modules/m1-editor/api';
import { EditorArea } from '@/modules/m1-editor/EditorArea';
import { PreviewArea } from '@/modules/m2-preview/PreviewArea';
import {
  createPersistence,
  readStoredDocument,
} from '@/modules/m3-persistence/store';
import { createTheme } from '@/modules/m6-theme/theme';
import type { ThemeAPI } from '@/modules/m6-theme/api';
import { createExportAPI } from '@/modules/m4-export/api';
import type { ExportAPI } from '@/modules/m4-export/api';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';
import './styles/main.css';

interface AppShellProps {
  state: DocumentState;
  editor: EditorAPI;
  theme: ThemeAPI;
  exporter: ExportAPI;
}

function AppShell(props: AppShellProps) {
  const onCopy = async () => {
    const ok = await props.exporter.copyHtml();
    toast.show(
      t(ok ? 'clipboard.ok' : 'clipboard.fail'),
      ok ? 'info' : 'warn',
    );
  };

  return (
    <main class="app-shell">
      <header class="app-header">
        <h1>{t('app.title')}</h1>
        <div class="header-actions">
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
            class="theme-toggle"
            onClick={() => props.theme.toggle()}
            aria-label={t('theme.toggle')}
          >
            {t('theme.toggle')}
          </button>
        </div>
      </header>
      <div class="panes">
        <div class="editor-pane">
          <EditorArea state={props.state} />
        </div>
        <PreviewArea state={props.state} />
      </div>
    </main>
  );
}

const root = document.getElementById('root');
if (root) {
  // 启动序列（架构 v1.0 §4.1）：
  //   1. readStoredDocument 静态读取（不依赖 reactive state）
  //   2. createDocumentState(initial) — M1 SoT
  //   3. createEditorAPI(state) — 对外契约（chrome 主动调 clear / setTextFromStorage）
  //   4. createPersistence(state.text) — 订阅 text，debounce 500ms 写回
  //   5. createTheme() — 三级 fallback + DOM 同步
  //   6. render AppShell
  //
  // createPersistence / createTheme 内部都跑 createEffect，必须在 createRoot 内；
  // render() 内部已包 createRoot，所以装配放在 render 的回调里。
  render(() => {
    const initial = readStoredDocument();
    const state = createDocumentState(initial);
    const editor = createEditorAPI(state);
    createPersistence(state.text);
    const theme = createTheme();
    const exporter = createExportAPI(state.text);
    return (
      <AppShell
        state={state}
        editor={editor}
        theme={theme}
        exporter={exporter}
      />
    );
  }, root);
}
