# 共识文档 v1.7 — 滚动同步（编辑 ↔ 预览）

> v1.0 共识增量 delta（consensus 反复 defer 3 次的「滚动同步」补完）。
>
> **状态：** `accepted`（2026-06-05；TBD-v17-1~3 AI 倾向 + v17-4=(a) 双向 / v17-5=(a) 常开无开关 拍板）
> **flow 位置：** 共识 draft → module-list（M2 渲染加 source-line + M5/新滚动同步逻辑）→ 架构 + ADR-011 → api/test-plan delta → 实现
> **命名：** semver tag 将是 **v0.8.0**（同先例）。L2 级（动 M1/M2/M5，不动持久化/数据模型）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.7-draft | 2026-06-05 | 编辑区↔预览区滚动联动（source-line 映射）；5 TBD 待 accept |

---

## 1. 动机与范围

桌面双栏下，编辑区与预览区**各自独立滚动**——编辑到文档中部，预览还停在顶部，对照不便。本版让两栏滚动联动。

**范围（仅）：** 桌面双栏的编辑↔预览滚动同步。
**不在本次：** 移动端（单栏 tab，无同时双栏，无意义）；同步高亮当前行 / 光标定位 / 拖拽分栏宽度。

---

## 2. 张力

### 张力 A — 映射精度（行 vs 比例）
纯比例同步（scrollTop%）在含图/表/公式（块高差异大）时严重漂移。精确映射需"源文行 ↔ 渲染块"对应。见 **TBD-v17-1**。

### 张力 B — data-source-line 过 DOMPurify（安全相关）
markdown-it 可由 `token.map` 给渲染块标源文行号（`data-source-line`），但 **DOMPurify 默认剥离 `data-*`**（v1.4 mermaid 实测踩过）。要让行号属性存活，须放宽 sanitize 配置（`ADD_ATTR`）——触及 ADR-002 sanitize 红线，需 XSS 复验。见 **TBD-v17-2**。

### 张力 C — 双向同步的反馈环
A 滚动 → 程序滚 B → B 的 scroll 事件回头驱动 A → 抖动/死循环。见 **TBD-v17-3**。

---

## 3. 待确认项（TBD-v17-x；HOW 在 ADR-011）

### TBD-v17-1 — 映射策略
- **(a) source-line 映射**：markdown-it core rule 给块级 token 标 `data-source-line`（`token.map[0]`）→ 编辑区 scrollTop 换算顶部可见行 → 二分找最近 `data-source-line` 元素 → 对齐预览〔AI 倾向〕— 精确，抗块高差异
- (b) 比例同步（scrollTop%）→ 简单但图/表/公式下漂移 → **拒绝**

### TBD-v17-2 — data-source-line 过 sanitize（安全相关 / `[SECURITY REVIEW REQUIRED]`）
- **(a) `render` 的 DOMPurify 加 `ADD_ATTR:['data-source-line']`**〔AI 倾向〕— `data-source-line` 是惰性数字属性（无执行语义），放行面极小；其余 sanitize 严格不变；**必须 XSS 复验**（现有 XSS e2e + DOM 断言确认放行 data-source-line 不破防）
- (b) sanitize 后再解析回填行号 → 复杂/脆弱 → 拒绝
- (c) 不标行号、退回比例 → 即 TBD-v17-1(b)，拒绝

### TBD-v17-3 — 反馈环防护
- **(a) 程序滚动前置 `syncing` 标志 + 短窗（或 rAF）→ 被驱动方 scroll 事件在窗内忽略**〔AI 倾向〕

### TBD-v17-4 — 同步方向〔需你拍板：UX〕
- **(a) 双向**：编辑滚→预览跟，预览滚→编辑跟（反馈环用 TBD-v17-3 防）〔AI 倾向〕
- (b) 仅编辑→预览（预览滚动不驱动编辑）→ 更简单，少反馈环风险，但预览侧滚动时编辑不跟

### TBD-v17-5 — 开关〔需你拍板：UX〕
- **(a) 常开（无开关，MVP）**〔AI 倾向：零配置，符合轻量定位〕
- (b) header 加「滚动同步」toggle（用户可关）→ 多一个 chrome 按钮 + 持久化偏好（仿 M1 prefs）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 渲染加 source-line core rule + sanitize ADD_ATTR；新增滚动同步逻辑（归 M5 布局 或 新 M10）| §M2/M5 |
| 架构 + **ADR-011** | source-line 映射算法 + data-source-line/sanitize（安全）+ 反馈环防护 + 双向编排 + 桌面 only | L2 + security |
| api-spec delta | render 加 data-source-line 契约 + 滚动同步 wiring（editor/preview scroll 监听 + 映射）| 契约 |
| test-plan delta | 家族：`内容(纯文本/含图表公式块高差异) × 方向(编辑驱动/预览驱动) × 边界(顶/底/空)`；**XSS 复验 ADD_ATTR 不破防** | 覆盖 |

---

## 5. 验收条件（v1.7 新增 AC，待 test-plan 细化）

- AC-v17-1：编辑区滚到中部 → 预览区滚到对应内容（source-line 对齐，桌面）
- AC-v17-2：含图/表/公式（块高差异大）→ 同步仍对齐（非比例漂移）
- AC-v17-3：双向（TBD-v17-4a）：预览滚 → 编辑跟；无抖动/死循环（反馈环防护）
- AC-v17-4：移动端单栏不启用滚动同步（无回归）
- AC-v17-5：**XSS 复验**：放行 data-source-line 后，恶意输入仍无脚本执行（ADR-002 红线，发布门槛）

> AC-v17-5 是安全门槛（动了 sanitize 配置）。比照 v1.3/v1.4 XSS 门槛严格度（DOM 级断言 + e2e）。
