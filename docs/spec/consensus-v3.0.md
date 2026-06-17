# 共识文档 v3.0 — 国际化（en-US dict + 语言切换）

> v1.0 共识增量 delta（2026-06-17 四项打磨 scope 第四项 / 压轴）。
>
> **状态：** `accepted`（2026-06-17；TBD-v30-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M7 delta → ADR-026 → api/test-plan delta → 实现
> **命名：** semver tag **v1.10.0-rc.1**。L2（扩 M7 i18n + M13 设置语言段，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.0-draft | 2026-06-17 | en-US dict（全量 ~103 key）+ 语言切换 + 持久化；接 v2.9 语言占位；3 TBD |
| v3.0 | 2026-06-17 | TBD-v30-1~3 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

M7 i18n 框架早铺好（`setLang` 存在，api.ts 注释"Reserved for v1.1+"），但 `Lang` 仅 `'zh-CN'`、DICTS 只有中文 dict。本版补 en-US dict + 语言切换 + 持久化——**补完已设计未落地**。放在打磨批最后做，一次性覆盖 v2.7~v2.9 新增的全部 key。

**范围（仅）：** en-US dict（全量）+ Lang 扩 + setLang 持久化 + M13 设置语言段接切换。
**不在本次：** 更多语言（日/韩等）/ 文档内容 i18n（用户文档本身不翻译）/ 复数/日期本地化框架（当前文案无此需求）。

---

## 2. 张力

### 张力 A — dict 完整性（缺 key 回退丑）
`t()` 缺 key 回退 key 字符串本身（如 `'fmt.bold'`）。en-US dict **必须全量覆盖** zh-CN 的每个 key，否则切英文出现裸 key。需机制保证两 dict key 集一致（EXPECTED_KEYS 白名单已覆盖 zh-CN；en 加同款校验）。

### 张力 B — 默认语言 vs 用户选择
产品中文优先（业务定位"中文速记"），但有英文用户。首访默认：纯 zh-CN vs 检测 `navigator.language`。已选择后持久化（localStorage），不再检测。

---

## 3. 待确认项（TBD-v30-x）

### TBD-v30-1 — 首访默认语言〔需你拍板〕
- **(a) 检测 `navigator.language`：`en*` → en-US，否则 zh-CN；之后以用户选择持久化为准**〔AI 倾向：英文用户首屏即英文，中文用户不受影响〕
- (b) 一律默认 zh-CN（中文优先，英文用户手动切）
- (c) 一律默认 en-US（不符产品定位，不推荐）

### TBD-v30-2 — en-US 翻译范围
- **(a) 全量 ~103 key 翻译**（张力 A 完整性，加 en dict EXPECTED_KEYS 校验防漏）〔AI 倾向：唯一正确解，部分翻译切英文露裸 key〕
- (b) 仅核心 chrome（其余回退）→ 露裸 key，不接受

### TBD-v30-3 — 语言切换入口与生效
- **(a) M13 设置面板语言段（接 v2.9 只读占位）→ select 切换 → 即时全 UI 重渲染 + 持久化**〔AI 倾向：Solid t() 响应式，切换即时生效〕
- (b) header 加语言按钮（header 已挤，不建议）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M7 delta（+en-US dict + 语言切换 + 持久化）| §M7 |
| **ADR-026** | Lang 扩 'zh-CN'\|'en-US' + en dict 全量 + setLang localStorage 持久化 + 首访 navigator.language 检测 + M13 语言段接切换 | L2 |
| api-spec delta | i18n Lang 扩 + en-US dict；M13 SettingsDialog 语言段 select | 契约 |
| data-model | localStorage `editor.lang.v1`（或并入 settings）| 轻量 |
| test-plan delta | 家族：`en dict key 集 = zh dict（无缺漏）× 切换即时生效 × 持久化往返 × 首访检测（en/zh navigator）× 默认回退` | 覆盖 |

---

## 5. 验收条件（AC-v30-x）

- AC-v30-1：en-US dict 覆盖 zh-CN **全部** key（无缺漏 → 无裸 key 露出）
- AC-v30-2：设置面板语言 select 切 English → 全 UI 文案即时变英文（无需刷新）
- AC-v30-3：语言选择持久化 → 刷新后保留
- AC-v30-4：首访无持久化值 → 按 navigator.language 检测（en\* → en-US / 否则 zh-CN）
- AC-v30-5：localStorage 坏值 → 回退默认（检测结果）不崩
- AC-v30-6：既有零回归（默认中文用户行为不变 / 所有现有功能文案正常）

> 无安全面：dict 为静态文案常量；语言值枚举校验；localStorage 存储。
