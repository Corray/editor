# FB-002 — Issue closing comment commit hash 应用 `$(git rev-parse)` 动态注入

| 字段 | 值 |
|------|----|
| **date** | 2026-05-20 |
| **status** | applied (2026-06-02, 本地机械闸) |
| **severity** | low |
| **occurrences** | 2 |
| **category** | process |
| **skills** | issue |
| **modules** | (all) |

---

## 现象

写 GitHub Issue closing comment 时，commit hash 是 `git commit` 完成后才确定的（chicken-and-egg：comment 引用 commit / commit message 又可能引用 Issue）。当前 standard `issue` skill 的收尾流程未给 explicit shell pattern 用于动态注入 hash——执行层容易在 commit 前预写 comment 草稿、放占位 hash 或猜的 hash，commit 完成后忘记替换 → comment 含错误 hash 永久落库。

standard issue-process skill 内置的 commit hash grep self-check **仅验证格式**（7 位 hex）而**不验证 hash 真实性**，错误 hash 通过 self-check 后会永久 drift；下游 audit / `/release` 反查"哪个 commit 实现了 #N"时拿到无效 hash。

## 实证

- **项目**: `/Users/chat/Desktop/test/editor` (github / business / FE / node-ts)
- **首例（已自捕获）**: Issue #8 (M2 集成) 2026-05-19
  - 收尾 comment 草稿预写 hash `7d4abd5`
  - 实际 commit hash `3becbc9`
  - 自捕获后删错 comment 重发（audit 报告 §3.1 IPR-T-001 / multiphase audit 2026-05-20）
- **后续合规案例**: Issue #10 / #11 使用 `$(git rev-parse --short HEAD)` 模式 → 无错误
- **hash backfill follow-up commits**: `5d7b82c`（回填 BHV-001 resolution）/ `25a5557`（回填 GAP-004 resolution）—— 选用新 commit 而非 amend，符合 standard"偏好新 commit"原则

## 根因（推断）

- standard `issue` skill 的 "收尾 comment" 段未给 explicit shell pattern 指导动态注入 hash
- skill 内置 commit hash grep self-check 是格式校验（`[0-9a-f]{7}`），不能识别"格式对但 hash 实际不存在"或"hash 实际存在但不是本 Issue 的 commit"
- 执行层（含 AI agent）默认从"先写 comment 草稿"切入，而非"先 commit 拿 hash 再回填 comment"

## Remediation 建议

### 1. standard issue skill 增补 comment 模板段（推荐）

在 standard `issue` skill 的"收尾 comment"段加 explicit shell pattern：

````markdown
**写 closing comment 必须用动态 hash 注入：**

```bash
ACTUAL_HASH=$(git rev-parse --short HEAD)
gh issue comment <N> --body "$(cat <<EOF
...
**commit:** \`${ACTUAL_HASH}\`
...
EOF
)"
```

**禁止预写占位 hash**（如 `commit: \`a1b2c3d\``）—— 占位忘改 = 错误落库。
````

### 2. 升级 self-check（可选，复杂度高）

把 hash grep self-check 从"格式校验"升级为"存在性校验"：

```bash
# 当前：仅 grep [0-9a-f]{7}
# 建议增补：git cat-file -e <hash> 验证 commit 存在
git cat-file -e ${HASH} 2>/dev/null || echo "WARN: hash ${HASH} 不存在于本地 git history"
```

但 cat-file 只能验证存在，不能验证"是本 Issue 对应的 commit"——后者需要 commit message grep `#<N>` 双向核对，复杂度更高，作为 v2 建议。

### 3. amend 兼容说明

如果 commit 已 push 前发现 hash 错，amend 修 commit message 也算一种处理（同一逻辑单元 + 未 push）。但 standard 偏好新 commit（如本项目 `5d7b82c` / `25a5557` 的 backfill follow-up commit），建议 comment 模板段同步注明。

## scan_when

- standard `issue` skill 更新 PR 时（建议加 CI gate / 模板段强制）
- 新项目首次跑完 Issue 闭环时（手动复查最近 close 的 Issue comment 引用的 hash 是否 `git cat-file -e` 通过）
- audit `issue-process` phase 维度 5c（数据漂移检测）已覆盖此点，已发挥拦截作用

## related

- **PP-002** (`docs/problems/project-patterns.md`)—— 项目级 tendency 视角，含跨项目升级路径
- **IPR-T-001** (`docs/audit/2026-05-20-mvp-multiphase.md` §3.1)—— audit phase 产出条目
- **findings-registry**: IPR-T-001 (proposed → backlog)

## 二次复发 + 机械闸根治（2026-06-02 / #15 推进期间）

**第 2 次发生（amend 自引用新变体）：** #15 GAP-003 收尾时，findings-registry 预写
hash `8b87f29`（本以为是 work commit 的 hash），随后 `git commit --amend` 把该 commit
改号成 `6bc2977` → registry 引用失效 → 需 follow-up commit `dc0320b` 修。

**为什么旧 remediation 防不住：** FB-002 v1 的 remediation 是「用 `$(git rev-parse)`
动态注入 + 禁止预写占位」。但本次 hash 不是占位也不是猜的——是 commit 时真实存在的
hash，**被 amend 改号后才失效**。纯纪律（动态注入）无法覆盖 amend / rebase 改号。

**根治（机械闸，不依赖纪律）：** `scripts/check-doc-hashes.mjs`（`pnpm check:hashes`）
扫 `docs/**.md` + `CLAUDE.md` 的 `commit \`<hash>\`` 引用，逐个 `git rev-parse --verify`
验证 commit 真实存在。占位 / 猜错 / amend 失效 / typo 一网打尽。已接入 `deploy.yml`
（CI，checkout `fetch-depth: 0` 拿全 history）。负向测试已验证（注入 `deadbee` +
`<pending9>` → exit 1）。

**新增顺序铁律（写入 PP-002 remediation v2）：** work commit 先落地 → 文档在**独立后续
commit** 回填 hash，绝不让文档引用"含该文档改动的同一 commit"的 hash（必被 amend 改号）。

## 升级路径

- ~~若再有第 2 个项目复现 → `occurrences = 2`~~ → **本项目内二次复发（同项目不同变体）已达形式化阈值**（formalization-timing 类型 A：同模式 ≥2 次 + 旧规则失效）→ 本地机械闸落地，status → `applied`
- 上游 standard `issue` skill comment 模板 + CI gate 增补 → 走 FB-002 upstream issue（#8）
- applied 后实际拦截真实问题（CI 第一次 fail 在 push 含失效 hash 的文档时）→ 标 `verified`
