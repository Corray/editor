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
- **upstream_issue**: ⚠ **未实际上报**（原标 `github.com/chatlabs-ai/agent-dev-standard/issues/7` 经 2026-06-04 核验为失真：URL 404 + repo 不存在；真标准库在 bitbucket chatly-biz-tool。`3d6f6c1` 仅写本地未 file。见 IPR-T-002）→ 待真上报 bitbucket standard

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
- **upstream_issue**: ⚠ **未实际上报**（原标 `.../issues/8` 失真，2026-06-04 核验 404；见 IPR-T-002）—— 本地已加机械闸根治（`pnpm check:hashes`）；upstream 待真上报 bitbucket standard（issue skill comment 模板 + CI gate）

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
- **upstream_issue**: ⚠ **未实际上报**（原标 `.../issues/9` 失真，2026-06-04 核验 404；见 IPR-T-002）→ 待真上报 bitbucket standard

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
- **upstream_issue**: ⚠ **未实际上报**（原标 `.../issues/10` 失真，2026-06-04 核验 404；见 IPR-T-002）→ 待真上报 bitbucket standard

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
- **guidance**: ⚠ 根因 2026-06-03 重定性（见 FB 文件）：page.goto 30s 超时主因是**并行 worker CPU 竞争**（非 dev-server / webkit-mobile-UA）；换 vite preview 未解决，限 `workers`（CI?1:N）+ `navigationTimeout:60s` 才解决。教训：导航超时先怀疑并发度，别先归因 server/engine/版本。preview 仍建议（production fidelity）但非 flake fix
- **scan_when**: 新项目 playwright 配置初始化时；e2e 出现 page.goto 超时 flake 时（先查 workers / 机器负载）
- **related**: PP-003
- **upstream_issue**: declined-await-2nd-occurrence (评估 2026-05-22；项目强相关 + root cause 未清 — Playwright/Vite/webkit 三方互动 bug 未排查；workaround 已落定 chromium + iPhone SE context；触发条件 = 第 2 个 Vite + Playwright 项目复现 或 root cause 定性为 standard 可修)

## FB-006 — 线上眼验 / Playwright 验证的认知陷阱（hash 冷加载 + 破缓存 + console 干净）
- **date**: 2026-06-04
- **file**: ../feedback/2026-06-04-playwright-hash-routing-cold-load.md
- **category**: meta
- **skills**: (testing / playwright)
- **modules**: (all)
- **phases**: —
- **severity**: low
- **status**: candidate
- **occurrences**: 7（同项目：hash e2e / hash 线上 / 破缓存 / console 干净 / SW-Cache 三证据链 / 状态变迁跨部署 / PWA 破 SW 层——同元模式"线上眼验认知陷阱→误判/漏验"）
- **guidance**: 同源（看到"不生效/没问题"先质疑验证方式再质疑被测物）：① hash-routing/URL-state 功能只在整页加载跑 startup，从已加载页改 hash = 同文档导航不重跑 → 测 `goto(hashUrl)` 后补 `reload()` / 线上 `about:blank`→hashUrl 冷加载；② 部署修复后线上眼验破缓存（`?cb=` 或 curl 比对）；**②b PWA 项目须额外破 SW 层（unregister SW + caches.delete），`?cb=` 绕不过 SW precache cache-first，否则看到上一版整个 app**；③ 眼验固定查 console 截零（功能渲染 ≠ console 干净）；④ SW/Cache/离线类功能工具切不了 offline 时用三证据链（SW controlling + caches 实测填充 + 同构 e2e）+ 验 cache 分布 + 标"断网 reload 是推断非亲跑"，别假装也别跳过；⑤ 依赖状态变迁触发的功能（SW 更新提示）单次部署验不到 → 跨部署验或显式标 gap
- **scan_when**: 写/测/线上验任何 hash-routing / URL-state-at-startup 功能时；"URL 片段功能不生效"且 URL 含 hash 时；部署修复后线上眼验时（破缓存）；任何线上/e2e 眼验收尾时（查 console）；验 SW/Cache/离线类功能但工具切不了网时（三证据链）；验依赖状态变迁触发的功能时（跨部署或标 gap）
- **related**: PP-003 #5/#6/#7/#8/#9 / F-V12-4 / F-V13-4 / F-V15-3 / FB-005（Playwright 陷阱家族，根因不同）
- **upstream_issue**: local-only（2026-06-04 决定暂不上报 standard）—— 候选已备妥（submit-fb 草拟 submissions/chenrui/2026-06-04-playwright-hash-routing-cold-load.md），但未 push 团队 Bitbucket 库；触发条件 = 第 2 项目复现 或 PM 决定上报。注：standard 实际 remote = bitbucket chatly-biz-tool/agent-dev-standard（早期 FB 标的 github URL 失真）

---

## 统计

| 维度 | 数量 |
|------|------|
| 总计 | 6 |
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 6 |
| candidate 状态 | 5 |
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
