# FB Index — 启动前扫描索引

**定位：** 团队级 / 个人级 feedback（FB）的结构化元数据索引，支持 `/fb-scan` skill 按 skill / module / phase / category 筛选。

- **数据源：** `feedback/*.md`（按日期或主题分组的源文件）
- **维护规则：** 新 FB 录入时必须同步在此索引追加条目
- **字段定义：** 见本文件末尾 schema

---

## 编号规范

`FB-NNN` 连续递增，不按批次重置。

## 状态枚举

| 状态 | 含义 |
|------|------|
| `candidate` | 候选，未达 ≥ 2 例阈值 |
| `observing` | 观察期，已达阈值待累积更多实证 |
| `applied` | 已 applied 到规则文件 / SOP |
| `verified` | applied 后实际生效（产出 ≥ 1 次拦截真实问题）|
| `dismissed` | 排除（噪声 / 重复 / 已被 别 FB 覆盖）|

---

## FB 条目

## FB-001 — business .gitignore 模板漏 `.install-state.done`
- **date**: 2026-05-18
- **file**: ../feedback/2026-05-18-business-gitignore-install-state-done.md
- **category**: meta
- **skills**: install
- **modules**: (all)
- **phases**: —
- **severity**: low
- **status**: candidate
- **occurrences**: 1
- **guidance**: standard install 的 business / hub .gitignore 模板需同步忽略 `/.install-state.done`（与 `.install-state.json` 同源）
- **scan_when**: 新项目首次 `/install` 完成后；standard install 模板修改 PR 时
- **related**: —
- **upstream_issue**: https://github.com/chatlabs-ai/agent-dev-standard/issues/7 (filed 2026-05-22)

## FB-002 — Issue closing comment commit hash 应用 `$(git rev-parse)` 动态注入
- **date**: 2026-05-20
- **file**: ../feedback/2026-05-20-issue-closing-comment-hash.md
- **category**: process
- **skills**: issue
- **modules**: (all)
- **phases**: —
- **severity**: low
- **status**: applied (2026-06-02 本地机械闸 `pnpm check:hashes`)
- **occurrences**: 2
- **guidance**: commit hash 引用纯纪律（动态注入）防不住 amend 改号 → 根治 = 机械闸 `pnpm check:hashes`（scripts/check-doc-hashes.mjs）扫 docs+CLAUDE.md 的 `commit \`<hash>\`` 逐个 git rev-parse 验证，已接入 CI；铁律：work commit 先落地 → 文档独立后续 commit 回填 hash，不引用会被 amend 改号的自身 commit
- **scan_when**: 写 Issue closing comment 时；文档引用 commit hash 时；standard issue skill 更新 PR 时
- **related**: PP-002 / IPR-T-001
- **upstream_issue**: https://github.com/chatlabs-ai/agent-dev-standard/issues/8 (filed 2026-05-22) — 本地已加机械闸根治；upstream 待 standard issue skill 增补 comment 模板 + CI gate

## FB-003 — vitest config coverage.exclude 不应泛 `**/api.ts`
- **date**: 2026-05-20
- **file**: (audit 报告 §3 / PP-003)
- **category**: meta
- **skills**: install (vitest template)
- **modules**: (all)
- **phases**: —
- **severity**: low
- **status**: candidate
- **occurrences**: 1
- **guidance**: standard testing 模板 default exclude 不要 glob `**/api.ts`；模块 api.ts 可能含 runtime 工厂（如 createXxxAPI），泛 exclude 会让覆盖率被静默吃掉；推荐列具体 type-only 模块路径
- **scan_when**: 新项目 vitest config 初始化时；新增模块 api.ts 含 runtime 时
- **related**: PP-003
- **upstream_issue**: https://github.com/chatlabs-ai/agent-dev-standard/issues/9 (filed 2026-05-22, preventive)

## FB-004 — 一人多角色项目合规判据家族（issue-process / problem-registry / handoff 三通道豁免）
- **date**: 2026-05-20（首例 SP-A）；2026-05-22（扩 SP-B/SP-C）
- **file**: ../feedback/2026-05-22-single-person-multi-role-exemption.md
- **category**: process
- **skills**: issue / audit
- **modules**: (all)
- **phases**: —
- **severity**: low
- **status**: candidate
- **occurrences**: 1 项目（editor）三 sub-pattern
- **guidance**: 一人多角色项目（PM=EL=QA 同体）下，standard 三通道默认假设多人协作 → 一律给豁免路径：(SP-A) issue-process 跳过 fe-reviewed 中间态；(SP-B) problem-registry 通道由 findings-registry + fb-index 承担；(SP-C) handoff 通道由 GitHub Issue 承担。豁免条件 = CLAUDE.md §项目特定 rules 显式声明 + 等价载体实际有内容 + project-patterns 落档
- **scan_when**: 一人/小团队 + spec-first 项目 audit 任一 phase 判"通道空但工作正常"时；standard 三 rule 文件（problem-handling-pattern / artifact-based-handoff / task-lifecycle）更新 PR 时
- **related**: PP-001 (SP-A) / PP-004 (SP-B + SP-C) / IPR-001 / CLAUDE.md §项目特定 rules
- **upstream_issue**: https://github.com/chatlabs-ai/agent-dev-standard/issues/10 (filed 2026-05-22)

## FB-005 — Playwright mobile device emulation + Vite dev server 不稳定
- **date**: 2026-05-20
- **file**: ../feedback/2026-05-20-playwright-mobile-safari-vite-dev-server.md
- **category**: meta
- **skills**: install (playwright template)
- **modules**: (all)
- **phases**: —
- **severity**: low
- **status**: candidate
- **occurrences**: 1
- **guidance**: standard playwright.config.ts 模板 default 注释掉 mobile-safari (`devices['iPhone 14 Pro']`) project + TODO 推荐用 `vite preview` 替代 `vite dev` 作为 webServer（更接近生产 + 避免 dev HMR client 触发的 mobile UA navigation 卡顿）
- **scan_when**: 新项目 playwright 配置初始化时
- **related**: PP-003
- **upstream_issue**: declined-await-2nd-occurrence (评估 2026-05-22；项目强相关 + root cause 未清 — Playwright/Vite/webkit 三方互动 bug 未排查；workaround 已落定 chromium + iPhone SE context；触发条件 = 第 2 个 Vite + Playwright 项目复现 或 root cause 定性为 standard 可修)

---

## 统计

| 维度 | 数量 |
|------|------|
| 总计 | 5 |
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 5 |
| candidate 状态 | 4 |
| applied 状态 | 1 |
| observing 状态 | 0 |

---

## Schema（字段定义）

| 字段 | 必填 | 类型 | 说明 |
|------|----|----|----|
| date | yes | date YYYY-MM-DD | 首次发现日期 |
| file | yes | path | feedback 详细内容文件 |
| category | yes | enum | audit / process / design / implement / meta |
| skills | yes | list | 关联 skills |
| modules | yes | list | 关联模块（"(all)" 表示通用）|
| phases | yes | list | 关联 phase（"—" 表示无）|
| severity | yes | enum | low / medium / high / critical |
| status | yes | enum | candidate / observing / applied / verified / dismissed |
| occurrences | no | int | 实证累计次数 |
| guidance | yes | string | 一句话指引（scan_when 触发时呈现）|
| scan_when | yes | string | 启动前扫描时机 |
| related | no | list | 相关 FB IDs |
| upstream_issue | no | URL or string | standard repo 上报状态：URL = 已发 issue；`declined-<reason>` = 评估后决定暂不发；空 = 未评估 |
