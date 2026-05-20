import type { Accessor, Setter } from 'solid-js';

export type ViewportMode = 'desktop' | 'mobile';
export type MobileTab = 'edit' | 'preview';

export interface LayoutAPI {
  readonly viewport: Accessor<ViewportMode>;
  readonly mobileTab: Accessor<MobileTab>;
  setMobileTab: Setter<MobileTab>;
}

export { createLayout } from './layout';
