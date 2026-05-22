# FB-004 — 一人多角色项目合规判据家族（issue-process / problem-registry / handoff 三通道豁免）

| 字段 | 值 |
|------|----|
| **date** | 2026-05-20（首例 SP-A）；2026-05-22（扩 SP-B/SP-C）|
| **status** | candidate |
| **severity** | low |
| **occurrences** | 1 项目（editor）三 sub-pattern 共 N 实例 |
| **category** | process |
| **skills** | issue / audit |
| **modules** | (all) |

---

## 现象

standard 工作流的多个通道默认假设 **PM ≠ EL ≠ QA** 多人协作场景：

| 通道 | 默认假设 | standard 文件 |
|------|---------|--------------|
| issue-process 状态机 | `raised → fe-reviewed → pm-reviewed` | issue.skill / audit issue-process phase 维度 1.2 |
| problem-registry | 独立账本，发现 → 记录 → 定性 → 分发 → 解决 | `problem-handling-pattern.md` §六环节 |
| handoff | PM → EL 推送具体动作（HIGH findings 强制 handoff）| `artifact-based-handoff.md` §"Handoff vs Registry 分工" |

在**一人扮演 PM + EL + QA** 的项目中，三通道都出现 standard 形式合规判定与场景实际合理性的冲突：

- **SP-A（已知 / 已在 PP-001）**：每个新 Issue 直接打 `pm-reviewed` label 跳过 `raised → fe-reviewed` 中间态。audit 维度 1.2 判违规，但单人不需要 self-review ceremony
- **SP-B（本 audit 新增）**：`docs/problems/problem-registry.md` 仅模板骨架 0 实条目；所有问题散在 `findings-registry.md` + `fb-index.md` + `project-patterns.md` 三 registry。standard 无"小项目省略"豁免条款 → 严格判违反 problem-handling-pattern §"记录优先于处理"
- **SP-C（本 audit 新增）**：`docs/handoff/{pending,in-progress,completed}/` 三目录全空；HIGH 级别发现 BHV-001 应独立 handoff，实际通过 GitHub Issue #10 直接承担。standard `artifact-based-handoff.md` HIGH 例外条款未给单人豁免

## 实证

- **项目**: `/Users/chat/Desktop/test/editor` (github / business / FE / node-ts)
- **角色叠合**: Corray 一人同时承担 PM / FE / QA（CLAUDE.md `role: FE` 是会话默认，不是组织事实）
- **SP-A 实证**:
  - Issue #1-#11 全部 11 个 Issue body 含「状态机说明」段显式跳过 fe-reviewed 理由
  - audit 报告 §4 IPR-001（`docs/audit/2026-05-20-mvp-multiphase.md`）确认合规
  - PP-001（`docs/problems/project-patterns.md`）已记录
- **SP-B 实证**:
  - `wc -l docs/problems/problem-registry.md` = 46 行（全为 schema 文档 + 模板占位 P-001 YYYY-MM-DD，0 条实数据）
  - 同期 `findings-registry.md` 含 22 条有效 findings，`fb-index.md` 含 FB-001~005，`project-patterns.md` 含 PP-001~003 —— 问题层全部由其他 registry 承担
- **SP-C 实证**:
  - `find docs/handoff/{pending,in-progress,completed} -type f` 三目录全空
  - BHV-001 HIGH（E2E 全集未跑）resolution path = audit 报告 → GitHub Issue #10 → commit `f03e170`，无 handoff 文件
  - `docs/handoff/README.md` 存在但仅说明协议，无实际使用记录

## 根因（推断）

- standard 三条相关 rules（problem-handling-pattern / artifact-based-handoff / task-lifecycle）grep `豁免 / 单人 / 一人 / 小项目 / exempt / solo / single.person` 全部 0 命中（验证日期 2026-05-22，standard HEAD `d38b215`）
- standard 默认协作模型是"多角色 + 文件载体跨角色传递"——单人场景下文件载体退化为"自己写给自己看"，ceremony 大于价值
- 但 standard 又依赖三通道作为合规判据的固定 anchor，没有给"通道职责合并到等价载体"的合法路径

## Remediation 建议

### 1. standard 增补"单人多角色场景"豁免段（推荐）

在 standard `problem-handling-pattern.md` / `artifact-based-handoff.md` 各加一段：

```markdown
## 单人多角色场景豁免

满足以下全部条件时，本通道可由等价载体承担，audit 不判违规：

1. 项目在 CLAUDE.md §项目特定 rules 显式声明 PM = EL = QA 同体
2. 声明等价载体（如 problem-registry → findings-registry + fb-index）
3. 等价载体实际承担本通道职责（有内容、有维护节奏，不是另一处空壳）
4. project-patterns.md 落档对应 PP 条目，audit 时作豁免依据
```

### 2. audit skill 增补豁免识别逻辑

audit 各 phase 检查通道时，先 grep CLAUDE.md §项目特定 rules 是否含豁免段 + 验证等价载体实际有内容；满足则改判"豁免合规"而非"违规"。

### 3. install skill 默认问"PM/EL/QA 是否同体"

新项目 install 时显式问，若同体则 default 在 CLAUDE.md §项目特定 rules 写入豁免模板，避免每个单人项目重新踩。

## scan_when

- 新项目首次跑 audit phase（issue-process / spec / behavior 任一）发现"通道空但工作正常"时
- standard 三 rule 文件（problem-handling-pattern / artifact-based-handoff / task-lifecycle）更新 PR 时
- audit 报告产出"角色相关合规违反"时

## related

- **PP-001** (`docs/problems/project-patterns.md`) — SP-A 项目内 tendency 视角
- **PP-004** (同上) — SP-B + SP-C 项目内 tendency 视角（本 FB 配套新建）
- **IPR-001** (audit 报告 §4) — SP-A audit phase 产出条目
- **CLAUDE.md §项目特定 rules** — 项目层豁免落地段

## 升级路径

- **当前**: candidate；occurrences = 1 项目，但三 sub-pattern 跨多通道实证
- **observing 阈值**: 第 2 个单人多角色项目复现任一 sub-pattern → `occurrences = 2` → 升 `observing`
- **applied**: standard 三 rule 文件中至少一处补豁免段 → 标 `applied`
- **verified**: applied 后新项目第一次 install 默认生成豁免段，且首次 audit 不再判违规 → 标 `verified`

## 历史与扩展

- **2026-05-20** 首版：FB-004 仅 cover SP-A（issue-process 状态机），首次落 fb-index.md
- **2026-05-22** 扩 scope + 外置实体文件：纳入 SP-B（problem-registry）+ SP-C（handoff）；本文件 = FB-004 实体载体（原 file 字段指向 `(audit §4 / PP-001)` 违反 fb-index schema，本次修正）
