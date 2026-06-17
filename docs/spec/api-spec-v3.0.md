# 接口设计 v3.0 delta — 国际化（en-US + 语言切换）

> **基线：** 共识 v3.0（accepted）+ ADR-026。data-model = localStorage `editor.lang.v1`。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.0 | 2026-06-17 | Lang 扩 'en-US'；enUSDict 全量；i18n 初始检测+持久化；SettingsDialog 语言 select |

---

## 1. M7 i18n 扩展（ADR-026 D1~D3）

```ts
// api.ts
export type Lang = 'zh-CN' | 'en-US';   // 扩

// i18n.ts
const DICTS: Record<Lang, Record<string, string>> = { 'zh-CN': zhCNDict, 'en-US': enUSDict };
// 初始 lang：localStorage editor.lang.v1（合法）→ 用；否则 navigator.language en* → en-US / 否则 zh-CN
// setLang(next)：更新 signal + 持久化 localStorage（best-effort）
```

- `t()` 读 lang() signal（既有响应式）→ JSX `{t('key')}` 在 lang 变时自动重渲染
- `en-US.dict.ts`：覆盖 zh-CN 全部 key（占位符 {n}/{m} 保留）

## 2. M13 语言段（ADR-026 D4）

- SettingsDialog 语言段：只读"中文" → `<select>`（中文 / English）→ `i18n.setLang(value)`
- 新 i18n key：`settings.language.en`（zh dict='英文' / en dict='English'）

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| api.ts Lang 扩 + i18n.ts DICTS/初始检测/setLang 持久化 | ✓ | `3168c99` |
| en-US.dict.ts 全量翻译（`Record<DictKey,string>` 编译期强制全覆盖）| ✓ | `3168c99` |
| SettingsDialog 语言 select 接 setLang（+全 select aria-label）| ✓ | `3168c99` |
| i18n.test CT-I18N（en key 集==zh + 占位符保留 + 切换 + 持久化）| ✓ | `3168c99` |

> 测试：unit +5（CT-I18N：完整性/非空/占位符/切换/持久化）→ 297；e2e +2 用例双引擎（ac23）→ 166+4skip。首屏 93.80KB。
> **回归修复**：v3.0 加 navigator.language 检测 → Playwright 默认 locale=en-US → 既有中文 e2e 全启英文失败 → `resetStorage` seed zh-CN 确定性基线（systemic）；ac22 select 改 aria-label 定位（v3.0 加语言 select 破坏 `.last()` 位置假设）。en dict 全覆盖靠 `Record<DictKey>` 编译期保证（漏译 = tsc 报错，强于运行时校验）。
