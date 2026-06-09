import { describe, it, expect, afterEach, vi } from 'vitest';
import { render as renderSolid, cleanup } from '@solidjs/testing-library';
import { createDocumentState } from '@/modules/m1-editor/state';
import { PreviewArea } from '@/modules/m2-preview/PreviewArea';

afterEach(() => {
  vi.useRealTimers();
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

// perf / BHV-008 实测反哺：大文档 / 含 mermaid → render() 防抖，不阻塞每键输入。
// 小文档保持即时（无感）。锁定 PREVIEW_DEBOUNCE_THRESHOLD=10_000 / DEBOUNCE_MS=120 行为。
describe('M2 PreviewArea — 大文档渲染防抖（perf / BHV-008）', () => {
  it('CT-M2-DEBOUNCE-1: 大文档（>10KB）→ render 防抖，停顿后才落定', async () => {
    vi.useFakeTimers();
    const state = createDocumentState('# Start');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('Start'); // 初始小文档即时

    const big = '# BIG\n\n' + 'lorem ipsum dolor sit amet. '.repeat(500); // ~14KB > 阈值
    state.setText(big);
    await flush();
    // 防抖窗内：尚未重渲染，仍是旧内容
    expect(container.querySelector('h1')?.textContent).toBe('Start');

    vi.advanceTimersByTime(150); // 越过 120ms 防抖
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('BIG'); // 落定
  });

  it('CT-M2-DEBOUNCE-2: 小文档（<10KB）→ 即时渲染，无需等防抖', async () => {
    vi.useFakeTimers();
    const state = createDocumentState('# A');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    state.setText('# B');
    await flush(); // 不推进定时器
    expect(container.querySelector('h1')?.textContent).toBe('B');
  });

  it('CT-M2-DEBOUNCE-3: 含 mermaid 的小文档也防抖（消除每键闪烁 / F-V14-1）', async () => {
    vi.useFakeTimers();
    const state = createDocumentState('# Plain');
    const { container } = renderSolid(() => <PreviewArea state={state} />);
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('Plain');

    state.setText('# Diagram\n\n```mermaid\ngraph TD\nA-->B\n```'); // 小但含 mermaid
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('Plain'); // 防抖窗内仍旧内容

    vi.advanceTimersByTime(150);
    await flush();
    expect(container.querySelector('h1')?.textContent).toBe('Diagram');
  });
});
