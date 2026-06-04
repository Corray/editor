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
| GAP-002 | 2026-05-20 | **resolved** (#14) | LOW | `getRootElement` 零消费方（M4 #9 已绕过）→ 删声明（PreviewAPI + api-spec §3.2 + 5.5 流程图）消除契约/实现 drift；未来按需连消费方补回 | #14 commit `b7ef028` |
| GAP-003 | 2026-05-20 | **resolved** (#15) | LOW | F1.2 行号 gutter + F1.3 字号 A-/A+ 三档实现（EditorPrefsAPI + localStorage 持久化）| #15 commit `6bc2977` |
| GAP-004 | 2026-05-20 | **resolved** (#11) | MEDIUM | 清空按钮 + confirm 实现 + E2E-AC2-002 unskip 通过 | #11 commit `fec015b` |

### API 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| API-M5-001 | 2026-05-20 | **resolved** (#12) | MEDIUM | M5 api.ts / LayoutAPI 完整实现 | #12 commit `a9fc822` |
| API-T-001 | 2026-05-20 | **resolved** (#14) | LOW | shared/toast console stub → 真 DOM UI（lazy-mount container + 自动消失 + enter/leave 动画 + aria-live polite，无 lib，接口冻结不变）；7 单测 | #14 commit `b7ef028` |

### Behavior 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| BHV-001 | 2026-05-20 | **resolved** (#10) | HIGH | E2E 全集未跑 → chromium + webkit 跑通（21 pass / 7 skip / 0 fail）；mobile-safari emulation 不稳定单列 BHV-004 | audit §3；#10 commit `f03e170` |
| BHV-004 | 2026-05-20 | **resolved** (#15) | LOW | mobile-safari page.goto 30s 超时随 Playwright 1.43→1.60 升级消失；移除 AC4-003 chromium-only skip → 在 webkit + isMobile context 跑通（真 webkit-mobile 覆盖）；dead mobile-safari project config 清理 | #15 commit `20ad1c5` |
| BHV-002 | 2026-05-20 | **resolved** (#12) | MEDIUM | AC-4 mobile tab UI 实现 + E2E-AC4-002 / 003 unskip 通过 | #12 commit `a9fc822` |
| BHV-003 | 2026-05-20 | **resolved** (#15) | LOW | perf bench 一次性跑通并记基线（docs/perf/baseline-v0.1.0.md）：Lighthouse 92 / input→preview 34ms / bundle 64.26KB gz，三项全过预算；deploy.yml 加 bundle-size CI 闸（`pnpm size`）+ E2E-AC5-002 延迟实测。Lighthouse CI 仍按 TBD-T1 留 v1.1 | #15 commit `13a7dce` |
| BHV-005 | 2026-06-02 | **resolved** (#15) | MEDIUM | **GAP-003 回归**：header 加 A-/A+/# 3 按钮后 7 按钮在 320px 不换行 → document 横向溢出（破 AC-4-001）；BHV-004 跑 e2e 时捕获（GAP-003 当时只跑 unit+desktop visual 漏 e2e）。修：`.header-actions { flex-wrap: wrap }` | #15 commit `eac71bb` |
| BHV-006 | 2026-06-03 | deferred (v1.1) | LOW | 字号 A−/A+ 在 13/17 边界点击 no-op 但按钮无 disabled/视觉态 → 无反馈（UX 打磨）| 2026-06-03 增量 audit |
| BHV-007 | 2026-06-03 | deferred (v1.1) | LOW | 行号 toggle off→on 时若 textarea 已滚动，gutter 从 scrollTop 0 起，下次 scroll 才同步 → 短暂错位 | 2026-06-03 增量 audit |
| BHV-008 | 2026-06-03 | deferred (v1.1) | LOW | gutter 每逻辑行 1 DOM 节点，近 1MB 大文档放大渲染/内存成本（静态推断，未压测）| 2026-06-03 增量 audit |
| BHV-009 | 2026-06-03 | deferred (v1.1) | LOW | toast 容器统一 aria-live=polite；error/warn 语义宜 assertive（a11y，未真机验）| 2026-06-03 增量 audit |
| BHV-010 | 2026-06-03 | deferred (v1.1) | LOW | F1.2 行号 / F1.3 字号 / toast 仅 unit+手测，无 e2e 验收覆盖（PRD §F1 功能，回归风险）| 2026-06-03 增量 audit |

### v1.1 增量审查（2026-06-04 / 报告 `2026-06-04-v1.1-increment.md`）

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| F-V11-1 | 2026-06-04 | **resolved** | MEDIUM | `loadStoredDocument` IDB 读错静默降级 → 显空 + 潜在覆盖丢数据。修：拆 get/migration catch，读错 console.error + storage.loadError toast，不裸吞；UT-MIG-006 | tag 前修 / commit `c26d1db` |
| F-V11-2 | 2026-06-04 | **resolved** | LOW | `_storage.ts` resetStorage `open('editor')` 无 version 竞争可建无 store DB。修：`open(1)+onupgradeneeded` 建 kv，schema-safe | commit `c26d1db` |
| F-V11-3 | 2026-06-04 | deferred (v1.1.x) | LOW | clear() IDB delete 失败静默吞无 log | 2026-06-04 audit |
| F-V11-4 | 2026-06-04 | deferred (v1.1.x) | LOW | 每次加载 hydrate 触发冗余 write-back（幂等无害，status 抖动）| 2026-06-04 audit |
| F-V11-5 | 2026-06-04 | deferred (v1.1.x) | LOW | `storage.unavailable` i18n 死 key（v1.0 起未用）| 2026-06-04 audit |
| F-V11-6 | 2026-06-04 | deferred (v1.1.x) | LOW | performWrite 异步写理论可重叠（status 短暂错乱，极边缘）| 2026-06-04 audit |

### v1.2 增量审查（2026-06-04 / 报告 `2026-06-04-v1.2-increment.md`）

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| F-V12-1 | 2026-06-04 | deferred (v1.2.x) | LOW | 篡改的空 payload `#doc=1.` 解码为 ''，本机有文档时 confirm→accept 清空（合法分享链不会空 payload，手工篡改边缘）| 2026-06-04 audit |
| F-V12-2 | 2026-06-04 | deferred (v1.2.x) | LOW | 导入不校验文件类型，二进制读为乱码文本入编辑器（DOMPurify 渲染兜底无害）| 2026-06-04 audit |
| F-V12-3 | 2026-06-04 | deferred (v1.2.x) | LOW | clipboard 不可用时 share 仅 toast 失败，无"手动复制 URL"fallback（URL 已构建）| 2026-06-04 audit (UX) |

### Issue-process 审查

| 编号 | 首次发现 | 当前状态 | severity | 说明 | 关联 |
|------|---------|---------|---------|------|------|
| IPR-001 | 2026-05-20 | **dismissed** (#16) | LOW | 跳过 fe-reviewed 中间态 = 一人多角色合理 deviation，已由 CLAUDE.md PR-001 SP-A + PP-001 + FB-004 显式记为永久接受（finding 建议方案 a）；团队加第二人时 PR-001 失效即恢复 | PR-001 / PP-001 / FB-004 |
| IPR-T-001 | 2026-05-20 | **resolved** (#16) | LOW | commit hash 占位/失效 **二次复发**（#8 占位变体 + 2026-06-02 amend 自引用变体 `dc0320b`）→ 形式化阈值达成 → 机械闸根治 `scripts/check-doc-hashes.mjs`（`pnpm check:hashes`，CI 接入）；FB-002 candidate→applied / PP-002 remediation v2 | #16 commit `ab2927c` |

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
| 2026-06-02 | #16 推进 → umbrella 可关闭：IPR-T-001 二次复发（amend 自引用变体）达形式化阈值 → 机械闸根治 `scripts/check-doc-hashes.mjs`（`pnpm check:hashes` + CI fetch-depth:0），FB-002→applied / PP-002 v2 → resolved；IPR-001 一人多角色 deviation 由 PR-001 永久接受 → dismissed。**#16 两 finding 全处置** |
| 2026-06-02 | #14 推进 → umbrella 可关闭：GAP-002 删 `getRootElement` 声明（零消费方，消除 drift）→ resolved；API-T-001 toast console stub → 真 DOM UI（无 lib，接口冻结，7 单测）→ resolved。api-spec §3.2/5.5/§4.1 同步。**v0.1.0 audit 三 umbrella #14/#15/#16 全关闭** |
| 2026-06-03 | v0.1.1 增量 audit（报告 `2026-06-03-v0.1.1-increment.md`）：增量无 critical/high/medium，无安全/契约/架构违规；新增 5 条 LOW（BHV-006~010，UX/a11y/perf/coverage）全 deferred v1.1。最值得做 = BHV-010（F1.2/F1.3/toast 无 e2e）|
| 2026-06-04 | v1.1 增量 audit（报告 `2026-06-04-v1.1-increment.md`）：迁移核心逻辑正确（幂等+数据安全+竞争防护有测试佐证）；新增 6 条（F-V11-1~6）。**F-V11-1 MEDIUM**（IDB 读错静默降级 + 潜在覆盖丢数据）+ F-V11-2 LOW（resetStorage 竞争）建议 tag v1.1.0 前修；F-V11-3~6 deferred v1.1.x |
| 2026-06-04 | v1.2 增量 audit（报告 `2026-06-04-v1.2-increment.md`）：无 critical/high/medium；不受信分享/导入内容经现有 DOMPurify 安全兜底（无新 XSS 面）+ async catch 不静默（F-V11-1 教训已落实）。3 条 LOW（F-V12-1~3：空 payload 清空 / 导入不校验类型 / clipboard fallback）deferred v1.2.x |
