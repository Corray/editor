# 共识文档 v2.4 — 编辑细节打磨包（Tab 缩进 + 快捷键帮助 + TOC 当前位置高亮）

> v1.0 共识增量 delta（2026-06-12 四项拍板 scope 第二项）。
>
> **状态：** `accepted`（2026-06-12；TBD-v24-1~3 全盘接受倾向 (a)，Corray 拍板）
> **flow 位置：** 共识 draft → ADR-020（轻）→ api/test-plan delta → 实现
> **命名：** semver tag **v1.4.0-rc.1**。L1~L2（三件小事一版，M1/M12 delta，无新模块）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v2.4-draft | 2026-06-12 | Tab/Shift+Tab 缩进 + 快捷键帮助面板 + TOC 当前位置高亮（解 TBD-v22-4 defer）；3 TBD |

---

## 1. 范围

- **Tab/Shift+Tab 缩进**：单光标 Tab 插缩进；有选区 → 选中行整体加/减缩进；经 replaceRange（undo 保持，AC-v21-7 同约束）
- **快捷键帮助面板**：集中展示 v2.1 以来积累的快捷键（B/I/K、F、Tab、列表行为），解可发现性
- **TOC 当前位置高亮**：大纲面板随编辑器滚动高亮当前 section（解 TBD-v22-4 的 defer）

**不在本次：** Tab 智能对齐（对齐上一行缩进列）/ 帮助面板内自定义快捷键 / TOC 点击高亮联动预览侧独立指示。

---

## 2. 待确认项（TBD-v24-x）

### TBD-v24-1 — Tab 缩进单位与 a11y
- **(a) 2 空格**（Markdown 嵌套列表惯例）；textarea 拦截 Tab 是编辑器惯例，键盘焦点逃逸靠 Esc 后下一个 Tab 放行（标准 a11y 缓解：Esc 临时解除 Tab 捕获一次）〔AI 倾向〕
- (b) 4 空格 / (c) \t 字符

### TBD-v24-2 — 帮助面板入口
- **(a) header「⌨」按钮 + Cmd/Ctrl+/ 快捷键唤起浮层**（`?` 键不可行——textarea 里是正常输入字符）；Esc 关闭〔AI 倾向〕
- (b) 仅 header 按钮（无快捷键）

### TBD-v24-3 — TOC 高亮依据
- **(a) 编辑器视口顶部所在 section**（scrollTop → 首可见行 → ≤ 该行的最后一个标题；scroll 监听 rAF 节流，与 M10 同范式）〔AI 倾向：阅读位置直觉〕
- (b) 光标所在 section（编辑位置直觉，但滚动浏览时不动）

---

## 3. 验收条件（AC-v24-x）

- AC-v24-1：单光标 Tab → 插入缩进；Shift+Tab → 删除行首缩进（不足时尽量删）
- AC-v24-2：多行选区 Tab/Shift+Tab → 选中行整体加/减缩进，选区保持覆盖
- AC-v24-3：缩进操作 Cmd+Z 可撤销（undo 链路同 AC-v21-7）
- AC-v24-4：Esc 后下一个 Tab 放行原生焦点移动（a11y 逃逸）
- AC-v24-5：Cmd+/ 或 header 按钮 → 帮助面板；Esc/点击外部关闭；列出全部快捷键
- AC-v24-6：编辑器滚动 → 大纲当前 section 高亮跟随；无标题文档无高亮
- AC-v24-7：既有零回归（查找/列表延续/IME/大纲跳转）

> 无安全面：纯编辑态 + 静态帮助内容（i18n 文案，textContent 渲染）。
