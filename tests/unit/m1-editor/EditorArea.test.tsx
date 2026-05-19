import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@solidjs/testing-library';
import { createDocumentState } from '@/modules/m1-editor/state';
import { EditorArea } from '@/modules/m1-editor/EditorArea';

afterEach(() => {
  cleanup();
});

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('M1 EditorArea — CT-M1 (component tests)', () => {
  it('CT-M1-001: renders a textarea element', () => {
    const state = createDocumentState();
    const { container } = render(() => <EditorArea state={state} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();
  });

  it('CT-M1-002: input event triggers state.setText', () => {
    const state = createDocumentState();
    const { getByRole } = render(() => <EditorArea state={state} />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'hello' } });
    expect(state.text()).toBe('hello');
  });

  it('CT-M1-003: setText (e.g., setTextFromStorage) reflects in textarea.value', async () => {
    const state = createDocumentState();
    const { getByRole } = render(() => <EditorArea state={state} />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    state.setText('restored');
    await flushMicrotasks();
    expect(textarea.value).toBe('restored');
  });

  it('CT-M1-004: clearing state empties the textarea', async () => {
    const state = createDocumentState('initial-content');
    const { getByRole } = render(() => <EditorArea state={state} />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('initial-content');
    state.setText('');
    await flushMicrotasks();
    expect(textarea.value).toBe('');
  });

  it('has aria-label "Markdown editor" for accessibility', () => {
    const state = createDocumentState();
    const { getByLabelText } = render(() => <EditorArea state={state} />);
    expect(getByLabelText('Markdown editor')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('disables browser spellcheck via attribute "false" (prevents Markdown red underlines)', () => {
    const state = createDocumentState();
    const { getByRole } = render(() => <EditorArea state={state} />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    // spellcheck is enumerated, not boolean — missing attr defaults to true.
    // Test the attribute (DOM truth) instead of IDL property (jsdom incomplete).
    expect(textarea.getAttribute('spellcheck')).toBe('false');
  });

  it('initial value flows through to textarea on first render', () => {
    const state = createDocumentState('start');
    const { getByRole } = render(() => <EditorArea state={state} />);
    const textarea = getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('start');
  });
});
