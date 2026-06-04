# editor — Release History

每条 release 一段，含 scope / quality gates / spec-to-code-flow / audit / known limitations / closure。新版本追加到顶部。

---

## v0.3.0 — URL 分享 + 导入 .md（路线图 v1.2 里程碑）（2026-06-04）

**Tag:** `v0.3.0` @ commit `1826561`
**Range:** `aa35ce9..1826561`（v0.2.0 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.3.0
**命名说明:** 路线图（PRD §153）称 "v1.2"；按 semver 发布为 **v0.3.0**（minor，同 v1.1→v0.2.0 先例）。

### Scope — URL 分享 + 导入 .md（I/O 闭环）

| 变更 | Commit | 说明 |
|------|--------|------|
| URL 分享 | `7e15d00` | lz-string 压缩 → `#doc=1.<payload>`（URL-safe）→ 剪贴板 + 隐私 toast；超 8000 字符拒绝 |
| 打开分享链接 | `7e15d00` | hash 解码加载；本机非空 → confirm（取消保留本机）；`replaceState` 清 hash；加载优先级 分享>IDB |
| 导入 .md | `7e15d00` | file picker（`File.text` 本地读，不上传）；当前非空 confirm |
| M4 职责扩 | `7e15d00` | 「导出」→「导入/导出 I/O」 |

### Quality Gates [已验证: 2026-06-04 本机]

- 134 unit tests pass（ShareUrl 13：往返含 CJK/特殊字符 / 超限 / 无效链接 / share() 三结果）
- 43 e2e pass / 1 skip（chromium + webkit；含 ac7 分享/打开/导入 5 场景 ×2；1 skip = AC3-002 clipboard chromium-only）
- Bundle 68.21 KB gzipped（+lz-string ~2KB；预算 150 KB）
- TS strict typecheck 0 error；文档 hash 闸 42 refs resolve

### Spec-to-Code-Flow（完整走通）

共识 v1.2（TBD-v12-1~5 accept）→ module-list M4 delta → 架构 + **ADR-006**（D1=lz-string）→ api-spec v1.2 + data-model v1.2 → test-plan v1.2 → 实现 → 验证。research-first：lz-string@1.5.0 API 往返核实。

### Audit（2026-06-04 增量）

报告 `docs/audit/2026-06-04-v1.2-increment.md`：**无 critical/high/medium**。关键正向结论：分享链接内容是**攻击者可控输入**，与导入文件内容一并经现有 markdown-it(html:false)+DOMPurify sanitize → **无新 XSS 面**；async catch 不静默（F-V11-1 教训已落实）。
- F-V12-1~3 LOW（空 payload 清空 / 导入不校验类型 / clipboard fallback）→ deferred v1.2.x

### Known Limitations（v0.3.0 仍不做）

- 分享 URL 含明文内容（base64 非加密，已 toast 告知）
- 大文档（>~8000 字符 URL）无法分享（toast 拒绝，引导用下载 .md）
- 导入不校验文件类型（二进制读为乱码，DOMPurify 兜底无害）
- 上轮 deferred 的 F-V11-3~6 + BHV-006~010 未纳入
- 多文档 / Service Worker / Mermaid+KaTeX / 滚动同步 / 云同步 各按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- e2e 自捕获并修复 bug：分享覆盖 confirm 取消时未回填本机文档（main.tsx 启动逻辑）
- package.json 0.2.0 → 0.3.0

---

## v0.2.0 — IndexedDB 持久化升级（路线图 v1.1 里程碑）（2026-06-04）

**Tag:** `v0.2.0` @ commit `aa35ce9`
**Range:** `e9555e7..aa35ce9`（v0.1.1 以来）
**部署:** https://corray.github.io/editor/
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.2.0
**命名说明:** 路线图（PRD §152）称此里程碑 "v1.1"；按 semver 与 v0.1.x 连续发布为 **v0.2.0**（minor，新增功能，不跳号到 v1.1.0）。

### Scope — 持久化 localStorage → IndexedDB（解 PRD R2 配额）

| 变更 | Commit | 说明 |
|------|--------|------|
| M3 IDB 后端 | `5252add` | idb@8.0.3；DB `editor`/store `kv`/key `document`；异步契约（移除同步 init → `loadStoredDocument`，clear→Promise）|
| 一次性迁移 | `5252add` | 旧 `editor.document.v1` 首次加载迁入 IDB（先写→确认→删旧幂等；put 失败保旧不丢）|
| 不可用降级 | `5252add` | IDB 不可用（隐私模式/老浏览器）→ localStorage + `storage.degraded` toast |
| 启动异步 hydrate | `5252add` | 空 editor 闪现后填入 + 竞争防护（已输入不覆盖）|
| 1MB 提示取消 | `5252add` | IDB 配额充裕，退役 `doc.large`（共识 TBD-v11-4）|
| F-V11-1/2 修复 | `c26d1db` | IDB 读错 console.error + `storage.loadError` toast（不裸吞）；resetStorage schema-safe |

### Quality Gates [已验证: 2026-06-04 本机]

- 121 unit tests pass（M3 13：迁移/幂等/put失败保旧/读错/fallback/大文档/clear）
- 33 e2e pass / 1 skip（chromium + webkit；含 E2E-v11-001 迁移验收；1 skip = AC3-002 clipboard chromium-only）
- Bundle 66.17 KB gzipped（+idb ~1.5KB；预算 150 KB，`pnpm size` 闸守护）
- TS strict `pnpm typecheck` 0 error
- 文档 commit-hash 完整性闸 39 refs 全 resolve

### Spec-to-Code-Flow（完整走通）

共识 v1.1（TBD-v11-1~5 accept）→ module-list M3 delta → 架构 + **ADR-005**（D1=idb+手写 fallback）→ api-spec v1.1 + data-model v1.1 → test-plan v1.1 → 实现 → 验证。research-first：idb@8.0.3 API 对照 entry.d.ts 核实。

### Audit（2026-06-04 增量）

报告 `docs/audit/2026-06-04-v1.1-increment.md`：迁移核心逻辑正确（幂等+数据安全+竞争防护有测试佐证）。6 findings：
- **F-V11-1 MEDIUM**（IDB 读错静默降级 + 潜在覆盖丢数据）→ **resolved**（`c26d1db`）
- **F-V11-2 LOW**（resetStorage 竞争）→ **resolved**（`c26d1db`）
- F-V11-3~6 LOW（clear 静默 / 冗余 write-back / 死 key / 写重叠）→ deferred v1.1.x

### Known Limitations（v0.2.0 仍不做）

- IDB 读错后仍"显空 + 可编辑覆盖"（已从静默升级为 toast 告知，未硬阻断编辑 — TBD-v11-1 空闪现的延伸，留 UX 决策）
- AC-v11-4（IDB 不可用降级）仅 unit 覆盖，无真机隐私模式 e2e
- 上轮 deferred 的 BHV-006~010（行号/字号 UX/a11y/perf + F1.2/F1.3/toast e2e）**未纳入本版**
- 完整 Lighthouse CI 仍 deferred（TBD-T1）；本版未重跑 Lighthouse（bundle +idb 微小，perf 预期不变）
- 多文档 / Service Worker / 滚动同步 / 云同步 各按 roadmap 推迟

### Closure

- spec-to-code-flow 全节点 accepted + 实现追溯回填 ✓
- findings-registry：F-V11-1/2 resolved，F-V11-3~6 + BHV-006~010 deferred
- package.json 0.1.1 → 0.2.0

---

## v0.1.1 — backlog 清理 + 过程加固（2026-06-03）

**Tag:** `v0.1.1` @ commit `e9555e7`
**Range:** `c80d2e5..e9555e7`（v0.1.0 以来）
**部署:** https://corray.github.io/editor/（GitHub Pages，自动部署）
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.1.1

### Scope — v0.1.0 audit 三 backlog umbrella 全清（#14 / #15 / #16）

| finding | Issue | Commit | 说明 |
|---------|-------|--------|------|
| GAP-003 行号 / 字号 | #15 | `6bc2977` | F1.2 行号 gutter（可 toggle，关软换行精确对齐）+ F1.3 字号 A-/A+ 三档（13/15/17）；`EditorPrefsAPI` + localStorage |
| BHV-004 mobile-safari | #15 | `20ad1c5` | Playwright 1.60 解 page.goto 超时 → AC4-003 webkit-mobile 覆盖 + 清 dead config |
| BHV-005 header 回归 | #15 | `eac71bb` | GAP-003 加 3 按钮致 320px 横向溢出（破 AC-4-001）→ `.header-actions{flex-wrap}` |
| BHV-003 perf 基线 | #15 | `13a7dce` | Lighthouse 92 / input→preview 34ms / bundle 64.26KB gz 落档；`pnpm size` CI 闸 + E2E-AC5-002 |
| IPR-T-001 commit-hash 根治 | #16 | `ab2927c` | 机械闸 `pnpm check:hashes`（扫文档 hash 引用 + git rev-parse 验证）接入 CI |
| IPR-001 fe-reviewed 跳过 | #16 | — | dismissed：一人多角色 deviation 由 PR-001 永久接受 |
| GAP-002 getRootElement | #14 | `b7ef028` | 删无消费方声明（消除契约 drift）|
| API-T-001 toast UI | #14 | `b7ef028` | console stub → 真 DOM toast（自动消失 + 动画 + aria-live，无 lib，接口冻结）|

### Quality Gates [已验证: 2026-06-03 本机]

- 125 unit tests pass，line coverage 95.47%
- 31 e2e pass / 1 skip（chromium + webkit，含 webkit + mobile context；1 skip = AC3-002 clipboard chromium-only）
- Bundle 64.64KB gzipped（预算 150KB，CI `pnpm size` 闸守护）
- TS strict `pnpm typecheck` 0 error
- 新增 CI 闸：bundle-size（gzip<150KB）+ doc commit-hash 引用完整性

### 过程改进（本版沉淀）

- **commit-hash 机械闸**（IPR-T-001 二次复发达形式化阈值）：`scripts/check-doc-hashes.mjs`，FB-002 candidate→applied / PP-002 remediation v2
- **perf 基线**：`docs/perf/baseline-v0.1.0.md`（Lighthouse / input-latency / bundle 三项 + 复测命令）
- **scope 守 TBD-T1**：只加轻量 bundle 闸，完整 Lighthouse CI 仍留 v1.1+

### Known Limitations（v0.1.1 仍不做）

- 完整 Lighthouse CI（LCP/TBT 阈值闸）留 v1.1+（TBD-T1；本版只做一次性基线 + bundle 闸）
- toast 无队列 / 上限（低频消费点，MVP 接受）
- 行号默认开时移动端长行需 textarea 内横滑（document 不溢出）
- 真机 iOS Safari 未测（webkit emulation + mobile context 覆盖）

### Closure

- 三 umbrella #14 / #15 / #16 全部 `gh issue close --completed`，open 队列归零
- findings-registry：11 原始 findings + BHV-005 全部 resolved/dismissed
- package.json version 0.0.0 → 0.1.1（补齐 v0.1.0 遗留）

---

## v0.1.0 — MVP（2026-05-20）

**Tag:** `v0.1.0` @ commit `c80d2e5`
**Range:** `11590ee..c80d2e5`（17 commits / 3 天）
**部署:** https://corray.github.io/editor/（GitHub Pages，repo PUBLIC）
**GitHub Release:** https://github.com/Corray/editor/releases/tag/v0.1.0

### Scope（7 业务模块 + 集成）

| 模块 | Issue | Commit | 说明 |
|------|-------|--------|------|
| M1 EditorArea | #6 | `ed958a7` | textarea + state SoT + EditorAPI 三层 |
| M2 渲染管线 | #1 | `782314b` | markdown-it + DOMPurify pipeline |
| M2 集成 | #8 | `3becbc9` | PreviewArea + 双栏布局 |
| M3 持久化 | #2 | `e04d87d` | localStorage 状态机 + debounce + 1MB toast stub |
| M3 i18n integration | #4 | `6fa576a` | toast 文案 → t(key)（tech-debt 收编）|
| M4 导出 | #9 | `c38d408` | .md 下载 + 复制 HTML + clipboard fallback |
| M5 Layout | #12 | `a9fc822` | LayoutAPI reactive + 移动端 tabs（解 GAP-001/API-M5-001/BHV-002）|
| M6 主题 | #5 | `a01c3fb` | light/dark + 3 级 fallback + DOM/localStorage sync |
| M7 i18n | #3 | `8932faf` | singleton + zh-CN dict + 15-key whitelist |
| 整合 | #7 | `2d7650d` | main.tsx 整合 M1/M3/M6 + 反哺 M3.readStoredDocument |
| 清空交互 | #11 | `fec015b` | 清空按钮 + confirm 流程（解 GAP-004，unskip E2E-AC2-002）|
| E2E 全集 | #10 | `f03e170` | Playwright AC-1~6 6 套 + chromium + webkit（解 BHV-001）|
| 部署 | #13 | `863827c / 74fe0f9 / c80d2e5` | ADR-004 重启 + GH Pages workflow + arch §7 同步 |

### Quality Gates [已验证: v0.1.0 tag annotation]

- 108 unit tests pass，line coverage 96%+
- 28 e2e tests pass（chromium + webkit；mobile-safari emulation 单独走 iPhone SE context）
- Bundle 134KB / 62KB gzipped
- TS strict `pnpm typecheck` 0 error

### Spec-to-Code-Flow

- **上游全部 accepted**（2026-05-18 ~ 2026-05-19）：PRD v1.0 / consensus v1.0 / module-list v1.0 / architecture v1.0（TBD-A4 部署初次 deferred 后于 release 期重启）/ api-spec v1.0 / data-model v1.0 / test-plan v1.0
- **反哺 1 次**：#7 实现期发现 M3 `init()` chicken-and-egg → 加 `readStoredDocument()` 静态导出 → api-spec §3.3 同步增补
- **ADR**：001 markdown-it / 002 DOMPurify / 003 Solid（全 accepted 于 2026-05-19）；004 部署（初次 deferred 于 2026-05-19 → release 期重启 accepted 于 2026-05-20）

### Audit（2026-05-20 multiphase）

报告：`docs/audit/2026-05-20-*.md`（spec / api / behavior / issue-process 四 phase）
findings：`docs/audit/findings-registry.md` 11 条

| 状态 | 数量 | 编号 |
|------|------|------|
| resolved | 5 | GAP-001 / GAP-004 / API-M5-001 / BHV-001 / BHV-002 |
| deferred | 1 | BHV-004（mobile-safari emulation）|
| proposed | 5 | GAP-002 / GAP-003 / API-T-001 / BHV-003 / IPR-001 / IPR-T-001 |

### Known Limitations（v0.1.0 显式不做）

- `shared/toast` 仅 imperative stub，完整 UI follow-up 待 v0.1.x（API-T-001）
- M2 `PreviewAPI.getRootElement` 未实现，M4 暂绕过 pipeline.render（GAP-002）
- F1.2 行号 / F1.3 字号控件 PRD 列了未实现，无 Issue 跟踪（GAP-003）
- AC-5 Lighthouse / 真实 perf bench 未跑（BHV-003，按 TBD-T1 留 release 前 — 此处推迟）
- mobile-safari emulation 本地 `page.goto` 30s 超时，config 暂注释（BHV-004，iPhone SE context 单列覆盖 AC-4-001）
- Issue 流程 9 issues 跳过 `raised → fe-reviewed` 中间态（IPR-001，项目级 deviation 已 body 记录）

### Closure

- **2026-05-21**：Issue #1–#12 批量 `fe-in-progress → fe-confirmed` + release comment + close（#13 已于 2026-05-20 release 期 close）
- **findings-registry 变更记录**追加 2026-05-21 行（commit `7fca71a`）
- v0.1.0 issue tracker open 队列归零

