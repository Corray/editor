/**
 * M2 Preview API surface.
 *
 * 仅暴露 `render` 纯函数（见 `pipeline.ts`）。预览 DOM 由 `PreviewArea` 组件
 * 订阅 M1 `text()` signal 自渲染，不经此契约。
 *
 * 历史：曾声明 `getRootElement()` 供 M4 导出取 DOM，但 M4 已改直接调
 * `pipeline.render(text)`（#9 反哺，解耦 DOM 挂载状态）→ 该方法零消费方，
 * #14 GAP-002 删除以消除契约/实现 drift。未来若需直接访问预览 DOM
 * （scroll-sync / 复制选中 HTML），连同其消费方 + 测试一起补回。
 */
export type Render = (markdown: string) => string;

export interface PreviewAPI {
  render: Render;
}

export { render } from './pipeline';
