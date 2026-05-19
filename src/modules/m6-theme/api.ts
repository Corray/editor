import type { Accessor } from 'solid-js';

export type ThemeMode = 'light' | 'dark';

export interface ThemeAPI {
  readonly theme: Accessor<ThemeMode>;
  toggle(): void;
  setTheme(mode: ThemeMode): void;
}

export { createTheme } from './theme';
