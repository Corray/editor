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
  'mermaid.error': '图渲染失败（请检查 mermaid 语法）',

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

  // M1 查找/替换 + 字数统计 (v2.1 / ADR-017)
  'find.placeholder': '查找…',
  'find.replacePlaceholder': '替换为…',
  'find.prev': '上一个',
  'find.next': '下一个',
  'find.replace': '替换',
  'find.replaceAll': '全部替换',
  'find.close': '关闭查找',
  'find.replaced': '已替换 {n} 处',
  'wordcount.empty': '0 字',
  'wordcount.fmt': '{n} 字 · 约 {m} 分钟',

  // M12 大纲 (v2.2 / ADR-018)
  'outline.title': '大纲',
  'outline.empty': '暂无标题',

  // M1 快捷键帮助 (v2.4 / ADR-020)
  'help.button': '快捷键',
  'help.title': '键盘快捷键',
  'help.k.find': '查找 / 替换',
  'help.k.bold': '加粗（选区 toggle）',
  'help.k.italic': '斜体（选区 toggle）',
  'help.k.link': '插入链接',
  'help.k.indent': '缩进 / 取消缩进',
  'help.k.list': '列表自动延续（空项回车退出）',
  'help.k.help': '打开本面板',
  'help.k.esc': '关闭面板 / 下一个 Tab 移动焦点',

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

  // M4 share / import (v1.2; v1.6 import/open-shared 改新建语义 → 退役 2 个 overwrite confirm)
  'share.button': '分享',
  'import.button': '导入',
  'share.ok': '分享链接已复制（含明文内容，勿分享敏感信息）',
  'share.tooLarge': '文档过大，无法生成分享链接，请改用下载 .md',
  'share.linkInvalid': '分享链接无效或不受支持',
  'import.readFail': '文件读取失败',
  'import.notText': '文件不是文本（疑似二进制），无法导入',

  // M9 文档管理 (v1.6)
  'doc.new': '新建',
  'doc.button': '文档',
  'doc.list': '文档列表',
  'doc.delete': '删除',
  'doc.close': '关闭',
  'doc.delete.confirm': '删除此文档？此操作不可撤销。',
  'doc.search': '搜索文档…',
  'doc.rename': '双击重命名',

  // M11 账号 / 云同步 (v2.0)
  'auth.login': '登录',
  'auth.logout': '登出',
  'auth.emailPrompt': '输入邮箱，将发送登录链接：',
  'auth.checkEmail': '登录链接已发送，请查收邮箱',
  'auth.failed': '发送失败，请重试',
  'auth.privacy': '登录后文档将明文同步到云端（勿存敏感信息）',

  // M8 PWA / offline (v1.5)
  'pwa.updateAvailable': '有新版本可用',
  'pwa.refresh': '刷新',
} as const;

export type DictKey = keyof typeof zhCNDict;
