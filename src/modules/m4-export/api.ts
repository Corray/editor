import type { Accessor } from 'solid-js';
import { downloadMarkdown } from './ExportMd';
import { copyHtml } from './CopyHtml';
import { render } from '@/modules/m2-preview/pipeline';

export interface ExportAPI {
  downloadMarkdown(): void;
  copyHtml(): Promise<boolean>;
}

/**
 * Build an ExportAPI bound to a reactive text accessor.
 *
 * `copyHtml` resolves the current text through `pipeline.render` (DOMPurify-
 * sanitized) — M4 does **not** depend on M2's DOM mount; see api-spec §3.4.
 * The HTML copied is the inner fragment (no `<html>`/`<body>` wrapper),
 * per consensus TBD-7.
 */
export function createExportAPI(text: Accessor<string>): ExportAPI {
  return {
    downloadMarkdown: () => downloadMarkdown(text()),
    copyHtml: () => copyHtml(render(text())),
  };
}

export { downloadMarkdown, getFileName } from './ExportMd';
export { copyHtml } from './CopyHtml';
