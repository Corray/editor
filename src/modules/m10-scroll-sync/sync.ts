/**
 * M10 滚动同步（v1.7 / ADR-011）—— 桌面编辑↔预览双向联动。
 *
 * 映射：M2 渲染的块元素带 `data-source-line`（源文行号）。
 *   - 编辑→预览：editor.scrollTop/lineHeight ≈ 顶部可见行 → 找 line ≤ 该行的最近
 *     块元素 → 预览滚到其位置
 *   - 预览→编辑：预览视口顶部最近块元素 → 其 line → editor.scrollTop = line*lineHeight
 * 反馈环防护（D3）：程序滚动前置 `syncing`，被驱动方 scroll 在窗内忽略（rAF 清）。
 * 仅桌面双栏挂载（移动单栏无意义）；viewport 切换时由调用方 dispose。
 */
export interface ScrollSync {
  dispose(): void;
}

export function createScrollSync(
  editorEl: HTMLTextAreaElement,
  previewEl: HTMLElement,
  lineHeight: number,
): ScrollSync {
  let syncing = false;

  // 元素在预览滚动内容中的相对顶部偏移（抗 offsetParent 差异）
  function relTop(el: Element): number {
    return (
      el.getBoundingClientRect().top -
      previewEl.getBoundingClientRect().top +
      previewEl.scrollTop
    );
  }
  function lineEls(): Element[] {
    return [...previewEl.querySelectorAll('[data-source-line]')];
  }
  function endSync(): void {
    requestAnimationFrame(() => {
      syncing = false;
    });
  }

  function syncEditorToPreview(): void {
    if (syncing) return;
    const els = lineEls();
    if (!els.length) return;
    const topLine = Math.round(editorEl.scrollTop / lineHeight);
    let target: Element | null = null;
    for (const el of els) {
      const line = Number(el.getAttribute('data-source-line'));
      if (line <= topLine) target = el;
      else break; // 块按源序升序，超过即停
    }
    syncing = true;
    previewEl.scrollTop = target ? relTop(target) : 0;
    endSync();
  }

  function syncPreviewToEditor(): void {
    if (syncing) return;
    const els = lineEls();
    if (!els.length) return;
    const st = previewEl.scrollTop;
    let line = 0;
    for (const el of els) {
      if (relTop(el) <= st + 1) line = Number(el.getAttribute('data-source-line'));
      else break;
    }
    syncing = true;
    editorEl.scrollTop = line * lineHeight;
    endSync();
  }

  editorEl.addEventListener('scroll', syncEditorToPreview, { passive: true });
  previewEl.addEventListener('scroll', syncPreviewToEditor, { passive: true });

  return {
    dispose() {
      editorEl.removeEventListener('scroll', syncEditorToPreview);
      previewEl.removeEventListener('scroll', syncPreviewToEditor);
    },
  };
}
