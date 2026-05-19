/**
 * M2 Preview API surface.
 *
 * 本 Issue (#1) 仅实现 `render` 纯函数（见 `pipeline.ts`）；
 * `getRootElement` 留给后续 M2 集成 Issue（含 Solid effect 订阅 M1 signal）。
 */
export type Render = (markdown: string) => string;

export interface PreviewAPI {
  render: Render;
  getRootElement(): HTMLElement | null;
}

export { render } from './pipeline';
