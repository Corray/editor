# 共识文档 v3.2 — 文档统计面板

> v1.0 共识增量 delta（2026-06-17 第三批 scope 第二项）。
>
> **状态：** `accepted`（2026-06-18；TBD-v32-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M1 delta → ADR-028（轻）→ api/test-plan delta → 实现
> **命名：** semver tag **v1.12.0-rc.1**。L1~L2（扩 M1 wordcount + status bar，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.2-draft | 2026-06-17 | 点击 status bar 展开详细统计（字符/词/CJK/标题/段落/阅读时长）；3 TBD |
| v3.2 | 2026-06-18 | TBD-v32-1~3 全部拍板（全 a）→ accepted |

---

## 1. 动机与范围

v2.1 status bar 只显「N 字 · ~M 分钟」。本版点击 status bar 展开详细统计面板——复用 wordcount 的 CJK/词逻辑扩展。

**范围（仅）：** 统计计算扩展 + 点击 status bar 弹层。
**不在本次：** 实时图表 / 选中区间统计 / 导出统计。

---

## 2. 张力

### 张力 A — 性能（大文档统计成本）
统计扫全文。复用 v2.1 wordcount 的 `createDeferred`（出输入路径）范式：统计也走 deferred，点击弹层时取已算值，不阻塞输入。

---

## 3. 待确认项（TBD-v32-x）

### TBD-v32-1 — 入口
- **(a) 点击编辑区底部 status bar → 统计弹层**（status bar 已显摘要，点击展开详情，零新 header 按钮）〔AI 倾向：自然 + header 不再加〕
- (b) header 加统计按钮（header 已 15 按钮，不建议）

### TBD-v32-2 — 统计字段
- **(a) 7 项**：字符数（含空格）/ 字符数（不含空格）/ 词数 / CJK 字数 / 标题数 / 段落数 / 阅读时长〔AI 倾向：常见且单遍可算〕
- (b) 精简 4 项（字符/词/CJK/时长）

### TBD-v32-3 — 计算
- **(a) 新 computeStats 纯函数**（复用 countWords 的 CJK/词扫描逻辑扩展，单遍）+ deferred 出输入路径〔AI 倾向：复用不重写〕
- (b) 复用 countWords 多次调用（重复扫描，浪费）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M1 delta（+统计面板）| §M1 |
| **ADR-028** | computeStats 纯函数（扩 wordcount）+ StatsPanel 弹层 + status bar 点击 + deferred | L2 |
| api-spec delta | wordcount +computeStats(text): DocStats；EditorArea status bar 点击 + StatsPanel | 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`字符(含/不含空格) × 词/CJK（复用 countWords 一致）× 标题数（# 行）× 段落数（空行分隔）× 空文档全零 × 弹层开关` | 覆盖 |

---

## 5. 验收条件（AC-v32-x）

- AC-v32-1：点击编辑区 status bar → 统计弹层展开；再点/Esc/点外部 → 关闭
- AC-v32-2：字符数（含空格 / 不含空格）正确
- AC-v32-3：词数 / CJK 字数与 status bar（countWords）一致
- AC-v32-4：标题数（`#`~`######` 行）/ 段落数（空行分隔的非空块）正确
- AC-v32-5：阅读时长与 status bar 一致
- AC-v32-6：空文档 → 全零
- AC-v32-7：既有零回归（status bar 摘要不变 / 输入不阻塞）

> 无安全面：统计纯数字，弹层 textContent 渲染。
