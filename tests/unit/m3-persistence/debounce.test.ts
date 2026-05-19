import { describe, it, expect, vi } from 'vitest';
import { debounce } from '@/modules/m3-persistence/debounce';

describe('debounce', () => {
  it('delays call by ms', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 500);
    d();
    vi.advanceTimersByTime(499);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('resets timer on consecutive calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 500);
    d();
    vi.advanceTimersByTime(400);
    d(); // reset
    vi.advanceTimersByTime(400); // 400ms since reset, should not fire
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100); // 500ms since reset → fires
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('cancel prevents pending call', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 500);
    d();
    d.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancel before any call is noop (no throw)', () => {
    const fn = vi.fn();
    const d = debounce(fn, 500);
    expect(() => d.cancel()).not.toThrow();
  });

  it('forwards args to fn', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn as (...a: never[]) => void, 500);
    d('a' as never, 1 as never);
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledWith('a', 1);
    vi.useRealTimers();
  });
});
