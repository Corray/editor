import type { DictKey } from './zh-CN.dict';

/**
 * English dict (v3.0 / ADR-026) — must cover EVERY key in zh-CN.dict（张力 A：缺 key
 * 回退裸 key）。类型 `Record<DictKey, string>` 编译期强制全覆盖（漏 key 即 tsc 报错）。
 * 占位符 {n}/{m} 与 zh 一致保留。
 */
export const enUSDict: Record<DictKey, string> = {
  // chrome / app
  'app.title': 'editor',

  // M2 preview
  'preview.placeholder': 'Type Markdown on the left; the preview appears here',
  'render.fail': 'Render failed',
  'mermaid.error': 'Diagram render failed (check mermaid syntax)',

  // chrome buttons
  'clear.button': 'Clear',
  'clear.confirm': 'Clear the document? This cannot be undone',
  'download.button': 'Download .md',
  'copy.button': 'Copy HTML',
  'theme.toggle': 'Toggle theme',

  // M1 editor prefs
  'editor.fontDecrease': 'Decrease font size',
  'editor.fontIncrease': 'Increase font size',
  'editor.lineNumbers': 'Toggle line numbers',

  // M1 format toolbar (v2.7)
  'fmt.toolbar': 'Format toolbar',
  'fmt.bold': 'Bold',
  'fmt.italic': 'Italic',
  'fmt.code': 'Inline code',
  'fmt.link': 'Link',
  'fmt.quote': 'Quote',
  'fmt.ul': 'Bulleted list',
  'fmt.ol': 'Numbered list',
  'fmt.codeblock': 'Code block',
  'fmt.table': 'Insert table',

  // M1 find/replace + word count (v2.1)
  'find.placeholder': 'Find…',
  'find.replacePlaceholder': 'Replace with…',
  'find.prev': 'Previous',
  'find.next': 'Next',
  'find.replace': 'Replace',
  'find.replaceAll': 'Replace all',
  'find.close': 'Close find',
  'find.replaced': 'Replaced {n}',
  'wordcount.empty': '0 words',
  'wordcount.fmt': '{n} words · ~{m} min',

  // M1 document stats panel (v3.2)
  'stats.title': 'Document stats',
  'stats.charsWithSpaces': 'Characters (with spaces)',
  'stats.charsNoSpaces': 'Characters (no spaces)',
  'stats.words': 'Words',
  'stats.cjk': 'CJK characters',
  'stats.headings': 'Headings',
  'stats.paragraphs': 'Paragraphs',
  'stats.readingTime': 'Reading time (min)',

  // M2 callout container (v3.5)
  'callout.note': 'Note',
  'callout.tip': 'Tip',
  'callout.warning': 'Warning',
  'callout.danger': 'Danger',

  // M12 outline (v2.2)
  'outline.title': 'Outline',
  'outline.empty': 'No headings',

  // M1 keyboard help (v2.4)
  'help.button': 'Shortcuts',
  'help.title': 'Keyboard shortcuts',
  'help.k.find': 'Find / replace',
  'help.k.bold': 'Bold (toggle selection)',
  'help.k.italic': 'Italic (toggle selection)',
  'help.k.link': 'Insert link',
  'help.k.indent': 'Indent / outdent',
  'help.k.list': 'List auto-continue (empty item exits)',
  'help.k.help': 'Open this panel',
  'help.k.esc': 'Close panel / next Tab moves focus',
  'help.k.print': 'Print (preview only, save as PDF)',

  // M4 export HTML (v2.5)
  'exportHtml.button': 'Export HTML',

  // M13 settings (v2.9)
  'settings.button': 'Settings',
  'settings.title': 'Settings',
  'settings.autoSnapshot': 'Auto snapshot',
  'settings.interval': 'Snapshot interval',
  'settings.interval.1min': '1 minute',
  'settings.interval.5min': '5 minutes',
  'settings.interval.10min': '10 minutes',
  'settings.maxSnapshots': 'Snapshots per document',
  'settings.language': 'Language',
  'settings.language.zh': '中文',
  'settings.language.en': 'English',
  'settings.accent': 'Accent color',
  'settings.accent.blue': 'Blue',
  'settings.accent.green': 'Green',
  'settings.accent.purple': 'Purple',
  'settings.accent.orange': 'Orange',
  'settings.accent.rose': 'Rose',

  // M9 version snapshots (v2.6)
  'history.button': 'Version history',
  'history.title': 'Version history',
  'history.empty': 'No snapshots',
  'history.snapshotNow': 'Snapshot now',
  'history.restore': 'Restore',
  'history.restore.confirm':
    'Restore this version? Current content is saved as a protection snapshot first.',
  'history.restored': 'Restored (current content saved as a protection snapshot)',
  'history.snapped': 'Snapshot saved',
  'history.words': '{n} words',
  'history.justNow': 'just now',
  'history.minAgo': '{n} min ago',
  'history.hourAgo': '{n} h ago',
  'history.dayAgo': '{n} d ago',
  'history.kind.auto': 'Auto',
  'history.kind.manual': 'Manual',
  'history.kind.restore': 'Restore point',

  // M5 mobile tab
  'tab.edit': 'Edit',
  'tab.preview': 'Preview',

  // M3 persistence toast
  'storage.quota': 'Storage quota full; cannot save',
  'storage.unavailable': 'Persistence unavailable; do not close the page',
  'storage.degraded': 'Degraded to basic storage; large documents may be limited',
  'storage.loadError': 'Failed to load saved content; please refresh',

  // M4 export toast
  'clipboard.ok': 'Copied to clipboard',
  'clipboard.fail': 'Copy failed; please select the preview content manually',

  // M4 share / import
  'share.button': 'Share',
  'import.button': 'Import',
  'share.ok': 'Share link copied (contains plaintext content; do not share sensitive info)',
  'share.tooLarge': 'Document too large for a share link; use Download .md instead',
  'share.linkInvalid': 'Share link invalid or unsupported',
  'import.readFail': 'File read failed',
  'import.notText': 'File is not text (looks binary); cannot import',

  // M9 document management (v1.6)
  'doc.new': 'New',
  'doc.button': 'Docs',
  'doc.list': 'Document list',
  'doc.delete': 'Delete',
  'doc.close': 'Close',
  'doc.delete.confirm': 'Delete this document? This cannot be undone.',
  'doc.search': 'Search documents…',
  'doc.rename': 'Double-click to rename',

  // M11 account / cloud sync (v2.0)
  'auth.login': 'Sign in',
  'auth.logout': 'Sign out',
  'auth.emailPrompt': 'Enter your email; a sign-in link will be sent:',
  'auth.checkEmail': 'Sign-in link sent; please check your email',
  'auth.failed': 'Send failed; please retry',
  'auth.privacy': 'After sign-in, documents sync to the cloud in plaintext (avoid sensitive info)',

  // M8 PWA / offline (v1.5)
  'pwa.updateAvailable': 'A new version is available',
  'pwa.refresh': 'Refresh',
};
