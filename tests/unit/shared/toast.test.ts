import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from '@/shared/toast';

describe('shared/toast (stub) — forwards to console', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('level=info → console.info with [toast:info] prefix', () => {
    toast.show('hello', 'info');
    expect(infoSpy).toHaveBeenCalledWith('[toast:info] hello');
  });

  it('level=warn → console.warn with [toast:warn] prefix', () => {
    toast.show('be careful', 'warn');
    expect(warnSpy).toHaveBeenCalledWith('[toast:warn] be careful');
  });

  it('level=error → console.error with [toast:error] prefix', () => {
    toast.show('boom', 'error');
    expect(errorSpy).toHaveBeenCalledWith('[toast:error] boom');
  });

  it('level defaults to info when omitted', () => {
    toast.show('default');
    expect(infoSpy).toHaveBeenCalledWith('[toast:info] default');
  });

  it('durationMs argument is accepted (currently ignored in stub)', () => {
    expect(() => toast.show('x', 'info', 1000)).not.toThrow();
  });
});
