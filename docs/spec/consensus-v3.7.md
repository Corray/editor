# 共识文档 v3.7 — 主题增强（强调色）

> v1.0 共识增量 delta（2026-06-22 第四批 scope 第三项 / 收尾）。
>
> **状态：** `accepted`（2026-06-22；TBD-v37-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M6/M13 delta → ADR-033 → api/test-plan delta → 实现
> **命名：** semver tag **v1.17.0-rc.1**。L1~L2（M13 settings + variables.css，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.7-draft | 2026-06-22 | 强调色预设（设置面板）；3 TBD |
| v3.7 | 2026-06-22 | TBD-v37-1~3 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

`--accent`（按钮 hover / active / 链接，25 处）目前固定蓝。本版让用户选强调色——纯装饰，价值低（PM 已知，纳入收尾）。

**范围（仅）：** 强调色预设 + 设置面板选择 + 持久化。
**不在本次（诚实砍）：** 新增整套预设主题（sepia/high-contrast 等）—— 每个需全套 CSS 变量，价值低于成本；light/dark + 强调色已满足"主题增强"诉求。任意 color picker（暗色对比度不可控）。

---

## 2. 张力

### 张力 A — 强调色 × 浅深色对比度
单一强调色值在浅/深色下对比度不同。方案：每预设给浅/深两值（`[data-accent=x]` + `[data-theme=dark][data-accent=x]`），保证两模式可读。

### 张力 B — 与 M6 theme 解耦
M6 用 `data-theme`。强调色用独立 `data-accent` 属性（M13 settings 驱动），不耦合 M6——两维度正交。

---

## 3. 待确认项（TBD-v37-x）

### TBD-v37-1 — 强调色方式
- **(a) 5 档预设**（蓝默认 / 绿 / 紫 / 橙 / 玫红，各带浅深双值）〔AI 倾向：无 picker 复杂度 + 暗色对比度预设保证〕
- (b) input[type=color] 任意色（暗色对比度不可控，可能不可读）

### TBD-v37-2 — 是否加整套预设主题
- **(a) 不加**（仅 light/dark + 强调色；新整套主题价值低于成本）〔AI 倾向：诚实砍，避免膨胀〕
- (b) 加 sepia / high-contrast（全套 var，工作量大价值低）

### TBD-v37-3 — 持久化 + 入口
- **(a) 并入 M13 settings（`accentColor` 字段）+ 设置面板选择**（复用 settings 持久化 / anti-poisoning）〔AI 倾向〕
- (b) 独立 localStorage（重复范式）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M13 delta（+accentColor）+ M6 注（accent 正交）| §M13 |
| **ADR-033** | M13 settings +accentColor（5 档 anti-poisoning）+ createEffect 应用 `data-accent` + variables.css 5×2 强调色规则 + SettingsDialog 选择 | L2 |
| api-spec delta | SettingsAPI +accentColor/setAccentColor + ACCENT_PRESETS；SettingsDialog 强调色段 | 契约 |
| data-model | localStorage `editor.settings.v1` +accentColor 字段 | 轻量 |
| test-plan delta | 家族：`5 档持久化 × 非档位回退默认 × data-accent 应用 × 默认蓝零变化 × 浅深各有值` | 覆盖 |

---

## 5. 验收条件（AC-v37-x）

- AC-v37-1：设置面板选强调色（5 档）→ 按钮/链接 accent 即时变
- AC-v37-2：强调色持久化 → 刷新保留
- AC-v37-3：浅色 + 深色下各预设均有对应值（对比度可读）
- AC-v37-4：默认 = 蓝（现值）→ 不选时零变化（既有行为回归）
- AC-v37-5：坏值 → 回退默认蓝不崩
- AC-v37-6：既有零回归（主题切换 / 设置其他项 / 语言）

> 无安全面：accent 值枚举校验，CSS 变量驱动。
