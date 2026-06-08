import type { Accessor } from 'solid-js';
import { downloadMarkdown } from './ExportMd';
import { copyHtml } from './CopyHtml';
import { buildShareUrl } from './ShareUrl';
import { readMarkdownFile } from './ImportFile';
import { render } from '@/modules/m2-preview/pipeline';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';

export interface ExportAPI {
  downloadMarkdown(): void;
  copyHtml(): Promise<boolean>;
}

/** URL 分享（v1.2 / ADR-006）。 */
export interface ShareAPI {
  /** 生成分享 URL（lz 编码内容到 #doc=），复制剪贴板 + 隐私 toast；
   *  超限 / 剪贴板失败 → false + toast（不产坏链接）。 */
  share(): Promise<boolean>;
}

/** 导入 .md（v1.2 / ADR-006）。读文件文本，调用方负责 confirm + 写回 M1。 */
export interface ImportAPI {
  readFile(file: File): Promise<string>;
}

/**
 * Build an ExportAPI bound to a reactive text accessor.
 *
 * `copyHtml` resolves the current text through `pipeline.render` (DOMPurify-
 * sanitized) — M4 does **not** depend on M2's DOM mount; see api-spec §3.4.
 */
export function createExportAPI(text: Accessor<string>): ExportAPI {
  return {
    downloadMarkdown: () => downloadMarkdown(text()),
    // v1.7：剥离 data-source-line（M2 滚动同步内部属性，不该进用户复制的 HTML）
    copyHtml: () =>
      copyHtml(render(text()).replace(/ data-source-line="\d+"/g, '')),
  };
}

/** Build a ShareAPI bound to the text accessor (clipboard + toast orchestration). */
export function createShareAPI(text: Accessor<string>): ShareAPI {
  return {
    share: async () => {
      const url = buildShareUrl(text());
      if (url === null) {
        toast.show(t('share.tooLarge'), 'warn'); // 超限拒绝（TBD-v12-1）
        return false;
      }
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        toast.show(t('clipboard.fail'), 'warn');
        return false;
      }
      toast.show(t('share.ok'), 'info'); // 隐私明文提示（TBD-v12-5）
      return true;
    },
  };
}

/** Stateless ImportAPI（readFile 本地读，无状态）。 */
export const importer: ImportAPI = {
  readFile: (file) => readMarkdownFile(file),
};

export { downloadMarkdown, getFileName } from './ExportMd';
export { copyHtml } from './CopyHtml';
export { buildShareUrl, readSharedDocument, SHARE_URL_MAX } from './ShareUrl';
export { readMarkdownFile, looksBinary } from './ImportFile';
