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

---

## 统计

| 维度 | 数量 |
|------|------|
| 总计 | 1 |
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 1 |
| candidate 状态 | 1 |
| applied 状态 | 0 |
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
