import { describe, it, expect, afterEach } from 'vitest';
import { render as renderSolid, cleanup } from '@solidjs/testing-library';
import { createDocumentState } from '@/modules/m1-editor/state';
import { PreviewArea } from '@/modules/m2-preview/PreviewArea';

afterEach(() => {
  cleanup();
});

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('M2 PreviewArea — CT-M2 + integration', () => {
  it('CT-M2-001: renders markdown from M1 state', async () => {
    const state = createDocumentState('# Hello');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('Hello');
  });

  it('CT-M2-002: empty state shows placeholder (textContent path)', async () => {
    const state = createDocumentState();
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('.preview-placeholder')).not.toBeNull();
    expect(container.querySelector('.preview-content')).toBeNull();
  });

  it('CT-M2-003: XSS <script> not live in DOM', async () => {
    const state = createDocumentState('<script>alert(1)</script>');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('script')).toBeNull();
  });

  it('CT-M2-003: XSS inline event handler stripped from DOM', async () => {
    const state = createDocumentState('<img src=x onerror=alert(1)>');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('[onerror]')).toBeNull();
  });

  it('CT-M2-003: javascript: URL stripped from links in DOM', async () => {
    const state = createDocumentState('[a](javascript:alert(1))');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it('text change updates preview synchronously', async () => {
    const state = createDocumentState('# A');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('A');

    state.setText('# B');
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('B');
  });

  it('empty → non-empty: placeholder swaps to content', async () => {
    const state = createDocumentState('');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('.preview-placeholder')).not.toBeNull();
    expect(container.querySelector('.preview-content')).toBeNull();

    state.setText('hello');
    await flush();
    expect(container.querySelector('.preview-placeholder')).toBeNull();
    expect(container.querySelector('.preview-content')).not.toBeNull();
  });

  it('non-empty → empty: content swaps back to placeholder', async () => {
    const state = createDocumentState('hello');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('.preview-content')).not.toBeNull();

    state.setText('');
    await flush();
    expect(container.querySelector('.preview-content')).toBeNull();
    expect(container.querySelector('.preview-placeholder')).not.toBeNull();
  });

  it('aria-label "Preview" present on root', async () => {
    const state = createDocumentState();
    const { getByLabelText } = renderSolid(() => <PreviewArea state={state} />);
    expect(getByLabelText('Preview')).toBeInstanceOf(HTMLDivElement);
  });
});
