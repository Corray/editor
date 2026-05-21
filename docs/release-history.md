# editor — Release History

每条 release 一段，含 scope / quality gates / spec-to-code-flow / audit / known limitations / closure。新版本追加到顶部。

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

