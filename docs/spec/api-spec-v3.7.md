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
| settings +accentColor + ACCENT_PRESETS + createEffect applyAccent（blue→删属性）| ✓ | `02003c5` |
| variables.css 强调色 4×2 规则（green/purple/orange/rose × 浅深）| ✓ | `02003c5` |
| SettingsDialog 强调色段（5 色块 + active 环）| ✓ | `02003c5` |
| i18n settings.accent.*（zh+en，+EXPECTED_KEYS）| ✓ | `02003c5` |

> 测试：unit +5（CT-SET-7~11：默认/持久化+应用/blue 删属性/非档位/坏值回退）→ 347；e2e +2 用例双引擎（ac30，含 --accent computed 值验）→ 202+4skip。首屏 97.01KB。
