import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from '@/shared/toast';

describe('shared/toast (stub) — forwards to console', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('level=info → console.info with [toast:info] prefix', () => {
    toast.show('hello', 'info');
    expect(console.info).toHaveBeenCalledWith('[toast:info] hello');
  });

  it('level=warn → console.warn with [toast:warn] prefix', () => {
    toast.show('be careful', 'warn');
    expect(console.warn).toHaveBeenCalledWith('[toast:warn] be careful');
  });

  it('level=error → console.error with [toast:error] prefix', () => {
    toast.show('boom', 'error');
    expect(console.error).toHaveBeenCalledWith('[toast:error] boom');
  });

  it('level defaults to info when omitted', () => {
    toast.show('default');
    expect(console.info).toHaveBeenCalledWith('[toast:info] default');
  });

  it('durationMs argument is accepted (currently ignored in stub)', () => {
    expect(() => toast.show('x', 'info', 1000)).not.toThrow();
  });
});
