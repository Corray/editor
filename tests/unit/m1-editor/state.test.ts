import { describe, it, expect } from 'vitest';
import { createDocumentState } from '@/modules/m1-editor/state';
import { createEditorAPI } from '@/modules/m1-editor/api';

describe('M1 state — createDocumentState', () => {
  it('default initial is empty string', () => {
    const state = createDocumentState();
    expect(state.text()).toBe('');
  });

  it('accepts initial value', () => {
    const state = createDocumentState('hello');
    expect(state.text()).toBe('hello');
  });

  it('setText updates text accessor', () => {
    const state = createDocumentState();
    state.setText('world');
    expect(state.text()).toBe('world');
  });
});

describe('M1 api — createEditorAPI', () => {
  it('text accessor proxies state.text reactively', () => {
    const state = createDocumentState('x');
    const api = createEditorAPI(state);
    expect(api.text()).toBe('x');
    state.setText('y');
    expect(api.text()).toBe('y');
  });

  it('setTextFromStorage writes through to state', () => {
    const state = createDocumentState();
    const api = createEditorAPI(state);
    api.setTextFromStorage('restored');
    expect(state.text()).toBe('restored');
  });

  it('clear() resets text to empty string', () => {
    const state = createDocumentState('content');
    const api = createEditorAPI(state);
    api.clear();
    expect(state.text()).toBe('');
  });

  it('EditorAPI surface does not expose setText (only setTextFromStorage / clear)', () => {
    const state = createDocumentState();
    const api = createEditorAPI(state);
    // Type-level: setText is not in EditorAPI; runtime defensive check
    expect((api as unknown as Record<string, unknown>).setText).toBeUndefined();
  });
});
