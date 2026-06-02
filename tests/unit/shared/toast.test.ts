import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast } from '@/shared/toast';

describe('shared/toast — real DOM toast (API-T-001)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('UT-TOAST-001: show() injects a .toast into a .toast-container on body', () => {
    toast.show('hello');
    const container = document.querySelector('.toast-container');
    expect(container).not.toBeNull();
    const el = container?.querySelector('.toast');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('hello');
  });

  it('UT-TOAST-002: level maps to a modifier class; default is info', () => {
    toast.show('a', 'warn');
    toast.show('b', 'error');
    toast.show('c'); // default info
    const toasts = [...document.querySelectorAll('.toast')];
    expect(toasts.some((t) => t.classList.contains('toast--warn'))).toBe(true);
    expect(toasts.some((t) => t.classList.contains('toast--error'))).toBe(true);
    expect(toasts.some((t) => t.classList.contains('toast--info'))).toBe(true);
  });

  it('UT-TOAST-003: container has aria-live=polite role=status', () => {
    toast.show('x');
    const container = document.querySelector('.toast-container');
    expect(container?.getAttribute('aria-live')).toBe('polite');
    expect(container?.getAttribute('role')).toBe('status');
  });

  it('UT-TOAST-004: multiple toasts stack in the same container', () => {
    toast.show('one');
    toast.show('two');
    const containers = document.querySelectorAll('.toast-container');
    expect(containers.length).toBe(1);
    const only = containers[0];
    expect(only?.querySelectorAll('.toast').length).toBe(2);
  });

  it('UT-TOAST-005: auto-dismisses after durationMs (+ leave anim)', () => {
    vi.useFakeTimers();
    toast.show('bye', 'info', 1000);
    expect(document.querySelectorAll('.toast').length).toBe(1);

    vi.advanceTimersByTime(1000); // duration elapsed → enters leaving
    const el = document.querySelector('.toast');
    expect(el?.classList.contains('toast--leaving')).toBe(true);

    vi.advanceTimersByTime(200); // leave anim window → removed
    expect(document.querySelectorAll('.toast').length).toBe(0);
  });

  it('UT-TOAST-006: container is recreated after being torn down', () => {
    toast.show('first');
    expect(document.querySelectorAll('.toast-container').length).toBe(1);
    document.body.innerHTML = ''; // simulate teardown
    toast.show('second');
    const container = document.querySelector('.toast-container');
    expect(container).not.toBeNull();
    expect(container?.querySelector('.toast')?.textContent).toBe('second');
  });

  it('UT-TOAST-007: durationMs is optional (defaults applied, no throw)', () => {
    expect(() => toast.show('x', 'info')).not.toThrow();
    expect(() => toast.show('y')).not.toThrow();
  });
});
