# 测试计划 v1.7 delta — 滚动同步（M10 + source-line）

> v1.0 测试计划增量。覆盖 M10 + source-line 标注 + XSS 复验。
> **基线：** 共识 v1.7 AC-v17-1~5 + ADR-011。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.7 | 2026-06-05 | source-line 映射 + 双向同步 + 反馈环 + ADD_ATTR XSS 复验 |

---

## 1. 家族维度（枚举）

`内容(纯文本 / 含图表公式块高差异) × 方向(编辑驱动 / 预览驱动) × 边界(顶 / 底 / 空 / 单行)`

source-line 标注 + XSS 可单测（render 输出 DOM 断言）；滚动联动行为依赖真实布局/scrollTop → e2e（桌面 viewport）。

## 2. AC ↔ 测试映射

| AC | 场景 | 层级 | 测试 |
|----|------|------|------|
| — | render 块元素带 data-source-line（H1/段落/列表等）| 单测 | UT-M2-source-line（DOMParser 断言 data-source-line 存在 + 值合理）|
| **AC-v17-5** | **XSS 复验**：ADD_ATTR data-source-line 后恶意输入仍无执行；不放行其他属性 | 单测 + e2e | UT-M2-sanitize-add-attr（`<script>`/`onerror`/`javascript:` 仍剥离，仅 data-source-line 放行）+ E2E-v17-xss 双引擎 |
| AC-v17-1 | 编辑滚到中部 → 预览对齐对应内容 | e2e(桌面) | E2E-v17-001 |
| AC-v17-2 | 含图/表/公式（块高差异）→ 对齐非比例漂移 | e2e | E2E-v17-002 |
| AC-v17-3 | 双向：预览滚 → 编辑跟；无抖动/死循环 | e2e | E2E-v17-003（预览驱动 + 反馈环不震荡）|
| AC-v17-4 | 移动端单栏不启用（无回归）| e2e(mobile) | E2E-v17-004（移动端滚动不联动 / 不报错）|

## 3. 关键测试纪律

- **XSS 复验是发布门槛**（动了 sanitize 配置 / ADR-002 红线）：UT 断言 `<script>`/`onerror`/`<img onerror>`/`javascript:` href 仍被剥离，**仅** data-source-line 放行；e2e 双引擎 DOM 级断言无 alert / 无 script（比照 v1.3/v1.4 门槛）
- **滚动 e2e 需真实布局**：jsdom 无真实 scrollTop/offsetTop/getBoundingClientRect 布局 → 映射行为落 e2e（真浏览器，桌面 viewport）
- **反馈环验证**：E2E-v17-003 驱动一侧后等待，断言另一侧到位且**未反复来回**（可检查 scrollTop 稳定 / 无持续变化）
- **块高差异是 source-line 优于比例的关键场景**：E2E-v17-002 用含大图/表的文档，验证对齐到正确块（非比例位置）

## 4. 不测 / 边界

- 不测像素级精确对齐（source-line 对齐到块顶即可，块内偏移 MVP 不细调）
- 不测移动端滚动同步（设计不启用）
- 极端：超长单行 / 无 data-source-line 元素（纯 inline）→ 降级不报错（best-effort 对齐）
