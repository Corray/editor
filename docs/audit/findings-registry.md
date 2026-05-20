# Findings Registry

所有审查发现的统一索引。每条发现有唯一编号，追踪从发现到处置的全生命周期。

**首次初始化**：YYYY-MM-DD

---

## 编号空间约定

每个 audit phase 用独立编号前缀（项目可自定，建议规则）：

| Phase | 编号前缀 | 例 |
|-------|--------|----|
| Spec | `GAP-NNN` | GAP-001 |
| API | `API-NNN` 或 `API-<MODULE>-NNN` | API-001 / API-LLM-001 |
| Behavior | `BHV-NNN` | BHV-001 |
| Architecture | `ARCH-NNN` | ARCH-001 |
| Integration | `F-INT-NNN` | F-INT-001 |
| Data Model | `F-DM-NNN` | F-DM-001 |
| Issue Process | `IPR-NNN` 或 `IPR-T-NNN` (trend) | IPR-001 / IPR-T-001 |
| Code-Doc Gap | `GAP-CDG-NNN` | GAP-CDG-001 |
| Rule Coverage | `RC-NNN` | RC-001 |

---

## 状态枚举

| 状态 | 含义 |
|------|------|
| `proposed` | 新发现，待 review 确认 |
| `confirmed` | 已确认有效，进入处理 |
| `fixing` | 处理中（有对应 handoff / Issue / commit）|
| `resolved` | 已解决，有证据（commit / artifact）|
| `dismissed` | 排除（误报 / 测试噪声 / 范围外，需 reason）|
| `deferred` | 已确认但推迟（需触发条件）|
| `merged` | 合并到另一条（需 merged-into 引用）|
| `escalated` | 升级（严重度 / 重新分类 / 改编号）|

---

## 维护规则

- 每次 audit 产出新 finding → 在此追加条目（status=proposed）
- 状态变更时同步本文件 + 原 audit 报告末尾追加勘误（audit 报告 immutable）
- 编号一旦分配，不可重用、不可重号

---

## 条目（按 phase 分组）

### Spec 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| GAP-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 LayoutAPI 完整实现（createLayout + matchMedia reactive + mobile tabs UI）| #12 commit `<TBD>` |
| GAP-002 | 2026-05-20 | proposed | LOW | M2 PreviewAPI.getRootElement 未实现（M4 已绕过 pipeline.render）| 同上 |
| GAP-003 | 2026-05-20 | proposed | LOW | F1.2 行号 / F1.3 字号控件 PRD 列了未实现，无 Issue 跟踪 | 同上 |
| GAP-004 | 2026-05-20 | **resolved** (#11) | MEDIUM | 清空按钮 + confirm 实现 + E2E-AC2-002 unskip 通过 | #11 commit `fec015b` |

### API 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| API-M5-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 api.ts / LayoutAPI 完整实现 | #12 commit `<TBD>` |
| API-T-001 | 2026-05-20 | proposed | LOW | shared/toast 完整 UI follow-up Issue 未建（tech-debt 跟踪占位）| 同上 |

### Behavior 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| BHV-001 | 2026-05-20 | **resolved** (#10) | HIGH | E2E 全集未跑 → chromium + webkit 跑通（21 pass / 7 skip / 0 fail）；mobile-safari emulation 不稳定单列 BHV-004 | audit §3；#10 commit `f03e170` |
| BHV-004 | 2026-05-20 | deferred | LOW | mobile-safari emulation 本地 page.goto 30s 超时 — config 暂注释；移动 viewport 已用 iPhone SE context 单独覆盖 AC-4-001 | #10 |
| BHV-002 | 2026-05-20 | **resolved** (#12) | MEDIUM | AC-4 mobile tab UI 实现 + E2E-AC4-002 / 003 unskip 通过 | #12 commit `<TBD>` |
| BHV-003 | 2026-05-20 | proposed | LOW | AC-5 Lighthouse / 真实 perf bench 未跑（按 TBD-T1 留 release 前）| 同上 |

### Issue-process 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| IPR-001 | 2026-05-20 | proposed | LOW | 9 Issues 全部跳过 raised → fe-reviewed 中间态直接 pm-reviewed（项目级 deviation，body 有理由）| audit §4 |
| IPR-T-001 | 2026-05-20 | proposed | LOW | Issue 收尾 comment 预写 commit hash 占位错误 ×1（#8 自捕获修正）— process pattern | 同上 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-20 | 初建 + 首次 multiphase audit 落 11 条 findings（GAP×4 / API×2 / BHV×3 / IPR×2）|
