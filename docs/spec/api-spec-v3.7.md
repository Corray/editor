# 接口设计 v3.7 delta — 主题增强（强调色）

> **基线：** 共识 v3.7（accepted）+ ADR-033。data-model = localStorage settings +accentColor。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.7 | 2026-06-22 | SettingsAPI +accentColor；data-accent 应用；variables.css 强调色规则；SettingsDialog 段 |

---

## 1. M13 settings 扩展（ADR-033）

```ts
export const ACCENT_PRESETS = ['blue', 'green', 'purple', 'orange', 'rose'] as const;
export interface SettingsAPI {
  // …既有…
  readonly accentColor: Accessor<string>; // 默认 'blue'
  setAccentColor(c: string): void;        // 非档位忽略
}
// createSettings createEffect：accentColor='blue' → 删 data-accent；否则 dataset.accent=值
// readInitial anti-poisoning：非 ACCENT_PRESETS → 'blue'
```

## 2. CSS（variables.css）

```css
[data-accent='green'] { --accent: #16a34a; }
[data-theme='dark'][data-accent='green'] { --accent: #4ade80; }
/* purple/orange/rose 同构（浅深双值）；blue=默认不需规则 */
```

## 3. SettingsDialog + i18n

- 强调色段：5 色块 / select；`i18n settings.accent` + `settings.accent.{blue,green,purple,orange,rose}`
- zh：强调色/蓝/绿/紫/橙/玫红；en：Accent/Blue/Green/Purple/Orange/Rose

## 4. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| settings +accentColor + ACCENT_PRESETS + createEffect 应用 data-accent | ⏳ | — |
| variables.css 强调色 4×2 规则 | ⏳ | — |
| SettingsDialog 强调色段 | ⏳ | — |
| i18n settings.accent.*（zh+en，+EXPECTED_KEYS）| ⏳ | — |
