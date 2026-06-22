# 共识文档 v3.6 — 文本高亮/标记（==mark== / ++ins++）

> v1.0 共识增量 delta（2026-06-22 第四批 scope 第二项）。
>
> **状态：** `accepted`（2026-06-22；TBD-v36-1~2 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → module-list M2 delta → ADR-032（轻）→ api/test-plan delta → 实现
> **命名：** semver tag **v1.16.0-rc.1**。L1~L2（扩 M2 扩展链，2 个极小 markdown-it 插件）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v3.6-draft | 2026-06-22 | `==mark==` → `<mark>` / `++ins++` → `<ins>`（并入懒加载链）；2 TBD |
| v3.6 | 2026-06-22 | TBD-v36-1~2 全部拍板（全 a）→ accepted；mark/ins 4.0.0 |

---

## 1. 动机与范围

速记常需高亮重点（`==文字==`）+ 标插入（`++文字++`）。markdown-it-mark/ins 极小插件，并入 v3.4 扩展链。

**范围（仅）：** mark + ins 渲染 + 懒加载。
**不在本次：** 删除线 `~~`（markdown-it 核心已支持，无需插件）/ 自定义高亮色。

---

## 2. 张力

### 张力 A — 并入扩展链 + hasExtension
并入 v3.4 `ensureExtensions`（applyExtensions 加 mark/ins）+ `hasExtension` 加 `==`/`++` 检测。安全：`<mark>/<ins>` DOMPurify 默认放行（标准标签），不放宽。

---

## 3. 待确认项（TBD-v36-x）

### TBD-v36-1 — 范围
- **(a) mark + ins 都做**（高亮 + 插入标记）〔AI 倾向：一次叠齐〕
- (b) 仅 mark（高亮更常用）

### TBD-v36-2 — 加载
- **(a) 并入 v3.4 ensureExtensions 懒加载链**（hasExtension 加 `==`/`++`；首屏不含）〔AI 倾向：一致〕
- (b) eager（极小，但破范式）

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M2 delta（+mark/ins）| §M2 |
| **ADR-032** | markdown-it-mark/ins 并入 ensureExtensions + hasExtension 加 `==`/`++` + 不放宽 sanitize（默认放行 mark/ins）| L2 |
| api-spec delta | pipeline ensureExtensions 扩展（+mark/ins）；hasExtension `==`/`++` | 契约 |
| data-model | 无 | — |
| test-plan delta | 家族：`==x==→<mark> × ++x++→<ins> × 未载降级 × XSS × 首屏不含` | 覆盖 |

---

## 5. 验收条件（AC-v36-x）

- AC-v36-1：`==text==` → `<mark>text</mark>`
- AC-v36-2：`++text++` → `<ins>text</ins>`
- AC-v36-3：lazy chunk 首屏不增（并入扩展链，size 闸守）
- AC-v36-4：未载降级 raw，加载后重渲染
- AC-v36-5：**XSS 门槛**：`==<script>==` 等经 sanitize 剥离（双引擎）
- AC-v36-6：既有零回归（v3.4/v3.5 扩展、删除线 `~~` 不受影响）

> 安全面：mark/ins 标准标签 DOMPurify 默认放行，经 render() sanitize，不放宽（ADR-002）。
