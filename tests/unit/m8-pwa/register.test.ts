import { describe, it, expect, beforeEach, vi } from 'vitest';
import { wireUpdatePrompt } from '@/modules/m8-pwa/register';
import type {
  RegisterSWFn,
  RegisterSWOptions,
  UpdateSW,
} from '@/modules/m8-pwa/register';
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';

describe('M8 PWA — wireUpdatePrompt (ADR-009 D3 / UT-PWA-update)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // capture the options passed to registerSW + a stub updateSW
  function makeRegisterSW() {
    const updateSW = vi.fn() as unknown as UpdateSW;
    let captured: RegisterSWOptions | undefined;
    const registerSW: RegisterSWFn = (opts) => {
      captured = opts;
      return updateSW;
    };
    return { registerSW, updateSW, getOpts: () => captured };
  }

  it('UT-PWA-001: registers SW with an onNeedRefresh callback', () => {
    const { registerSW, getOpts } = makeRegisterSW();
    wireUpdatePrompt(registerSW);
    expect(typeof getOpts()?.onNeedRefresh).toBe('function');
  });

  it('UT-PWA-002: onNeedRefresh → toast prompt with refresh action', () => {
    const showSpy = vi.spyOn(toast, 'show');
    const { registerSW, getOpts } = makeRegisterSW();
    wireUpdatePrompt(registerSW);

    getOpts()?.onNeedRefresh?.(); // simulate Workbox waiting SW

    expect(showSpy).toHaveBeenCalledTimes(1);
    const call = showSpy.mock.calls[0]!;
    expect(call[0]).toBe(t('pwa.updateAvailable'));
    expect(call[1]).toBe('info');
    expect(call[3]?.label).toBe(t('pwa.refresh'));
    expect(typeof call[3]?.onClick).toBe('function');
  });

  it('UT-PWA-003: clicking refresh → updateSW(true) (skipWaiting + reload)', () => {
    const showSpy = vi.spyOn(toast, 'show');
    const { registerSW, updateSW, getOpts } = makeRegisterSW();
    wireUpdatePrompt(registerSW);

    getOpts()?.onNeedRefresh?.();
    showSpy.mock.calls[0]![3]?.onClick();

    expect(updateSW).toHaveBeenCalledWith(true);
  });
});
