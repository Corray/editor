/**
 * MVP 中文 dict — 各模块 chrome 文案统一来源。
 *
 * 新增 key 时同步更新：
 *   - 本文件
 *   - tests/unit/m7-i18n/i18n.test.ts 中的 EXPECTED_KEYS 白名单
 *
 * 命名约定：`<模块>.<场景>` 或 `<功能>.<状态>`，全小写 dot-separated。
 */
export const zhCNDict = {
  // chrome / app
  'app.title': 'editor',

  // M2 preview
  'preview.placeholder': '在左侧输入 Markdown，这里会显示预览',
  'render.fail': '渲染失败',

  // chrome buttons
  'clear.button': '清空',
  'clear.confirm': '确认清空？此操作不可撤销',
  'download.button': '下载 .md',
  'copy.button': '复制 HTML',
  'theme.toggle': '切换主题',

  // M5 mobile tab
  'tab.edit': '编辑',
  'tab.preview': '预览',

  // M3 persistence toast
  'storage.quota': '存储配额已满，无法保存',
  'storage.unavailable': '持久化不可用，请勿关闭页面',
  'doc.large': '内容较长（>1MB），性能可能下降',

  // M4 export toast
  'clipboard.ok': '已复制到剪贴板',
  'clipboard.fail': '复制失败，请手动选择预览区内容复制',
} as const;

export type DictKey = keyof typeof zhCNDict;
