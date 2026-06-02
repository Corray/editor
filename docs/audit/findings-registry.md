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
| GAP-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 LayoutAPI 完整实现（createLayout + matchMedia reactive + mobile tabs UI）| #12 commit `a9fc822` |
| GAP-002 | 2026-05-20 | proposed (backlog) | LOW | M2 PreviewAPI.getRootElement 未实现（M4 已绕过 pipeline.render）| backlog #14 |
| GAP-003 | 2026-05-20 | **resolved** (#15) | LOW | F1.2 行号 gutter + F1.3 字号 A-/A+ 三档实现（EditorPrefsAPI + localStorage 持久化）| #15 commit `6bc2977` |
| GAP-004 | 2026-05-20 | **resolved** (#11) | MEDIUM | 清空按钮 + confirm 实现 + E2E-AC2-002 unskip 通过 | #11 commit `fec015b` |

### API 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| API-M5-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 api.ts / LayoutAPI 完整实现 | #12 commit `a9fc822` |
| API-T-001 | 2026-05-20 | proposed (backlog) | LOW | shared/toast 完整 UI follow-up Issue 未建（tech-debt 跟踪占位）| backlog #14 |

### Behavior 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| BHV-001 | 2026-05-20 | **resolved** (#10) | HIGH | E2E 全集未跑 → chromium + webkit 跑通（21 pass / 7 skip / 0 fail）；mobile-safari emulation 不稳定单列 BHV-004 | audit §3；#10 commit `f03e170` |
| BHV-004 | 2026-05-20 | **resolved** (#15) | LOW | mobile-safari page.goto 30s 超时随 Playwright 1.43→1.60 升级消失；移除 AC4-003 chromium-only skip → 在 webkit + isMobile context 跑通（真 webkit-mobile 覆盖）；dead mobile-safari project config 清理 | #15 commit `20ad1c5` |
| BHV-002 | 2026-05-20 | **resolved** (#12) | MEDIUM | AC-4 mobile tab UI 实现 + E2E-AC4-002 / 003 unskip 通过 | #12 commit `a9fc822` |
| BHV-003 | 2026-05-20 | **resolved** (#15) | LOW | perf bench 一次性跑通并记基线（docs/perf/baseline-v0.1.0.md）：Lighthouse 92 / input→preview 34ms / bundle 64.26KB gz，三项全过预算；deploy.yml 加 bundle-size CI 闸（`pnpm size`）+ E2E-AC5-002 延迟实测。Lighthouse CI 仍按 TBD-T1 留 v1.1 | #15 commit `13a7dce` |
| BHV-005 | 2026-06-02 | **resolved** (#15) | MEDIUM | **GAP-003 回归**：header 加 A-/A+/# 3 按钮后 7 按钮在 320px 不换行 → document 横向溢出（破 AC-4-001）；BHV-004 跑 e2e 时捕获（GAP-003 当时只跑 unit+desktop visual 漏 e2e）。修：`.header-actions { flex-wrap: wrap }` | #15 commit `eac71bb` |

### Issue-process 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| IPR-001 | 2026-05-20 | proposed (backlog) | LOW | 9 Issues 全部跳过 raised → fe-reviewed 中间态直接 pm-reviewed（项目级 deviation，body 有理由）| audit §4 / backlog #16 |
| IPR-T-001 | 2026-05-20 | proposed (backlog) | LOW | Issue 收尾 comment 预写 commit hash 占位错误 ×1（#8 自捕获修正）— process pattern | audit §4 / backlog #16 |

---

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-20 | 初建 + 首次 multiphase audit 落 11 条 findings（GAP×4 / API×2 / BHV×3 / IPR×2）|
| 2026-05-21 | v0.1.0 收尾：Issue #1–#12 批量切 `fe-confirmed` + close（释 release v0.1.0 / commit `a9fc822..c80d2e5`）；resolved findings 关联 Issue 已全部关闭，proposed/deferred findings（GAP-002/003、API-T-001、BHV-003/004、IPR-001/IPR-T-001）保留至 v0.1.x / v0.2 处理 |
| 2026-05-21 | 残余 6 条 LOW findings backlog 化：建 3 个 umbrella Issue —— #14 tech-debt（GAP-002 + API-T-001）/ #15 deferred-feature（GAP-003 + BHV-003 + BHV-004）/ #16 process（IPR-001 + IPR-T-001）；关联列已更新，状态保留 proposed/deferred 标 (backlog) 副词，等触发条件后逐条转 fixing |
| 2026-06-02 | #15 GAP-003 推进：F1.2 行号 gutter（关软换行精确对齐）+ F1.3 字号 A-/A+ 三档落地（EditorPrefsAPI + localStorage 持久化 + anti-poisoning）；19 新单测全绿 + typecheck + build + Playwright 视觉验证；GAP-003 → resolved。#15 残余 BHV-003（perf bench）/ BHV-004（mobile-safari）仍 backlog |
| 2026-06-02 | #15 BHV-004 推进：原 page.goto 超时随 Playwright 1.60 消失 → 移除 AC4-003 chromium-only skip（webkit-mobile 覆盖）+ 清理 dead mobile-safari project config；BHV-004 → resolved。**附带捕获 BHV-005**（GAP-003 header 7 按钮 320px 横向溢出回归，根因 = GAP-003 漏跑 e2e）→ `.header-actions{flex-wrap}` 修复，full e2e 29 pass/1 skip（chromium+webkit）。#15 仅剩 BHV-003 |
| 2026-06-02 | #15 BHV-003 推进（scope=跑基线+轻量 bundle 闸，尊重 TBD-T1 不上 Lighthouse CI）：一次性跑通 MANUAL-PERF-001~003 → Lighthouse 92 / input→preview 34ms(chromium) / bundle 64.26KB gz，三项全过；落 docs/perf/baseline-v0.1.0.md；deploy.yml 加 `pnpm size` 闸 + E2E-AC5-002 延迟实测。BHV-003 → resolved。**#15 三 finding（GAP-003/BHV-004/BHV-003）全 resolved → umbrella 可关闭** |
