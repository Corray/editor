# ADR-026 — 国际化：en-US dict + 语言切换 + 持久化

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-17：D1=Lang 扩+en 全量 dict / D2=setLang 持久化 localStorage / D3=首访 navigator.language 检测 / D4=M13 语言段接切换）|
| **Date** | 2026-06-17 |
| **Decider** | FE (Corray，共识 v3.0 TBD 全拍) |
| **Context** | 共识 v3.0 / M7 i18n（setLang 已存，DICTS 仅 zh-CN）/ M13 settings（语言占位）|

## D1 — Lang 扩 + en-US 全量 dict（TBD-v30-2a）

- `Lang = 'zh-CN' | 'en-US'`（api.ts）；`DICTS` 加 `'en-US': enUSDict`
- `m7-i18n/en-US.dict.ts`：覆盖 zh-CN **全部** key（无缺漏，张力 A）；保留占位符 `{n}`/`{m}`
- 完整性校验：i18n.test EXPECTED_KEYS 同时校验 en dict（两 dict key 集 == EXPECTED_KEYS）

## D2 — setLang 持久化（TBD-v30-3a）

- localStorage `editor.lang.v1`；setLang 写入 + lang signal 更新
- `t()` 读 lang() signal（已响应式）→ Solid JSX `{t('key')}` 在 lang 变时**自动重渲染**（无需刷新，AC-v30-2）

## D3 — 首访检测（TBD-v30-1a）

- 初始 lang：localStorage 有值且合法 → 用；否则 `navigator.language` `en*` → en-US / 否则 zh-CN
- 坏值/不可用 → 回退检测结果（AC-v30-5）

## D4 — M13 语言段接切换（TBD-v30-3a）

- SettingsDialog 语言段：v2.9 只读"中文" → 改 select（中文 / English）→ `i18n.setLang(value)`
- i18n key `settings.language.en` 新增

## Consequences

- module-list：M7 delta（+en dict + 切换 + 持久化）
- data-model：localStorage `editor.lang.v1`
- api-spec delta：Lang 扩；enUSDict；i18n 初始检测 + 持久化；SettingsDialog 语言 select
- i18n：+`settings.language.en`（zh + en 各加）
- test-plan delta：en key 集 == zh × 切换即时 × 持久化 × 首访检测 × 坏值回退
- 无安全面：静态文案 + 枚举校验 lang 值
- 风险：未来新增 key 须同步 zh + en（EXPECTED_KEYS 校验拦截漏译）
