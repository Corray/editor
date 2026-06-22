# ADR-033 — 主题增强：强调色预设（M13 settings + data-accent）

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-22：D1=5 档预设并入 settings / D2=data-accent 属性正交 M6 / D3=浅深双值 / D4=不加整套主题）|
| **Date** | 2026-06-22 |
| **Decider** | FE (Corray，共识 v3.7 TBD 全拍) |
| **Context** | 共识 v3.7 / ADR-025（M13 settings）/ M6 theme（data-theme）|

## D1 — accentColor 并入 M13 settings（TBD-v37-1a/3a）

settings +`accentColor`（'blue'|'green'|'purple'|'orange'|'rose'，默认 'blue'）；`ACCENT_PRESETS` 常量；anti-poisoning（非档位回 'blue'）。createSettings createEffect 应用 `document.documentElement.dataset.accent`。

## D2 — data-accent 属性（正交 M6 / 张力 B）

强调色用独立 `data-accent`（M13 驱动），与 M6 `data-theme` 正交——两维度独立。`accentColor='blue'`（默认）→ 移除 data-accent（用 variables.css 默认 --accent，零变化）；非默认 → 设 data-accent。

## D3 — 浅深双值（张力 A）

variables.css 加 `[data-accent=x] { --accent: 浅值 }` + `[data-theme=dark][data-accent=x] { --accent: 深值 }`，4 非默认色 × 2 = 8 规则。对比度预设保证两模式可读。

## D4 — 不加整套预设主题（TBD-v37-2a）

仅强调色；不加 sepia/high-contrast（全套 var 工作量大、价值低）。诚实砍，避免膨胀。

## Consequences

- api-spec delta：SettingsAPI +accentColor/setAccentColor + ACCENT_PRESETS；SettingsDialog 强调色段（5 色块/select）
- data-model：localStorage `editor.settings.v1` +accentColor
- i18n：`settings.accent` + 5 色名（settings.accent.blue/green/purple/orange/rose）
- test-plan delta：5 档持久化 × 非档位回退 × data-accent 应用 × 默认蓝零变化
- 无安全面：枚举校验 + CSS 变量
- 限制：仅 5 预设（无任意色）；不加整套主题
