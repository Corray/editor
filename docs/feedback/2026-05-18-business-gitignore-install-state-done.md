# FB-001 — business .gitignore 模板漏 `.install-state.done`

| 字段 | 值 |
|------|----|
| **date** | 2026-05-18 |
| **status** | candidate |
| **severity** | low |
| **occurrences** | 1 |
| **category** | meta |
| **skills** | install |
| **modules** | (all) |

---

## 现象

agent-dev-standard `install/modules/06-templates.sh` 渲染的 **business** `.gitignore` 模板（标注 `agent-dev-standard business-project .gitignore template`），「install 状态文件（resume 用）」段只忽略 `/.install-state.json`，**漏了 `/.install-state.done`**。

两个文件由同一 install 流程产出（标识不同阶段），按用途同源——但 `.done` 会被 git tracking，首次 commit 时若不手动剔除会一同入库；后续重跑 install 修改 `.done` 会让 working tree dirty，干扰执行层判断（如 audit / wrap-up 类 skill 检查 working tree 干净时被误报）。

## 实证

- **项目：** `/Users/chat/Desktop/test/editor` (github / business / FE / node-ts)
- **复现：** install 7 模块跑完后，`git status` 的 Untracked Files 列含 `.install-state.done`，而 `.install-state.json` 已被 ignore
- **本地兜底：** 在项目 `.gitignore` 「install 状态文件」段补加 `/.install-state.done`
- **首次 commit：** `c649566`（同时提交模板修复 + 项目骨架）

## 根因（推断）

- 模板源：`agent-dev-standard/install/modules/06-templates.sh` 或 `templates/*.gitignore.template`
- 假设：`.install-state.done` 是 install 流程后期才引入的「完结标记」，模板未同步补
- 两个状态文件应在同一段落统一管理

## Remediation 建议

在 standard 仓库的 **business** 和 **hub** 两份 `.gitignore` 模板中，把：

```
/.install-state.json
```

改为：

```
/.install-state.json
/.install-state.done
```

并考虑在 install Step 1 / Step 2 末段加 grep 自检（确保模板渲染后两行都在），属于 install skill 自身的 self-test。

## scan_when

- 新项目首次 `/install` 完成时（手动复查 `.gitignore` 末段 install 状态文件清单）
- standard 仓库自身 install 模板修改 PR 时（建议加 CI gate）

## related

—

## 升级路径

- 若再有第 2 个项目复现 → `occurrences = 2` → 状态可升 `observing`
- 上游 standard 修补后本 FB 标 `applied`
- 后续触发本规则拦截真实问题 → 标 `verified`
