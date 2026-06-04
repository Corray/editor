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

  // M1 editor prefs (F1.2 行号 / F1.3 字号)
  'editor.fontDecrease': '减小字号',
  'editor.fontIncrease': '增大字号',
  'editor.lineNumbers': '切换行号',

  // M5 mobile tab
  'tab.edit': '编辑',
  'tab.preview': '预览',

  // M3 persistence toast
  'storage.quota': '存储配额已满，无法保存',
  'storage.unavailable': '持久化不可用，请勿关闭页面',
  'storage.degraded': '已降级到基础存储，大文档可能受限',
  'storage.loadError': '加载已保存内容失败，请刷新重试',

  // M4 export toast
  'clipboard.ok': '已复制到剪贴板',
  'clipboard.fail': '复制失败，请手动选择预览区内容复制',

  // M4 share / import (v1.2)
  'share.button': '分享',
  'import.button': '导入',
  'share.ok': '分享链接已复制（含明文内容，勿分享敏感信息）',
  'share.tooLarge': '文档过大，无法生成分享链接，请改用下载 .md',
  'share.linkInvalid': '分享链接无效或不受支持',
  'share.overwrite.confirm': '打开分享内容将替换当前文档，是否继续？',
  'import.overwrite.confirm': '导入将替换当前文档，是否继续？',
  'import.readFail': '文件读取失败',
} as const;

export type DictKey = keyof typeof zhCNDict;
