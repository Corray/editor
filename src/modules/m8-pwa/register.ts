/**
 * M8 PWA — Service Worker update-prompt wiring (ADR-009 D3 / api-spec v1.5 §2).
 *
 * Decoupled from the `virtual:pwa-register` virtual module on purpose: it takes
 * `registerSW` as a parameter so it stays unit-testable without the build-time
 * virtual module (UT-PWA-update). `main.tsx` is the only place that imports the
 * real `virtual:pwa-register` and passes its `registerSW` here.
 *
 * On a new SW reaching the waiting state → toast prompt with a "refresh" action
 * (registerType:'prompt'); clicking it triggers skipWaiting + reload via
 * `updateSW(true)`. No silent reload — never interrupts editing (TBD-v15-3 a).
 */
import { toast } from '@/shared/toast';
import { t } from '@/modules/m7-i18n/i18n';

export type UpdateSW = (reloadPage?: boolean) => Promise<void>;
export interface RegisterSWOptions {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}
export type RegisterSWFn = (options?: RegisterSWOptions) => UpdateSW;

/** Wire the SW update prompt. Returns the `updateSW` fn (for testing). */
export function wireUpdatePrompt(registerSW: RegisterSWFn): UpdateSW {
  const updateSW = registerSW({
    onNeedRefresh() {
      // persistent action toast (durationMs ignored when action present)
      toast.show(t('pwa.updateAvailable'), 'info', 0, {
        label: t('pwa.refresh'),
        onClick: () => {
          void updateSW(true); // skipWaiting + reload
        },
      });
    },
  });
  return updateSW;
}
