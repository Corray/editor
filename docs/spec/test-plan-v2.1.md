# 测试计划 v2.1 delta — 编辑增强包

> **基线：** 共识 v2.1 AC-v21-1~8 + ADR-017。家族维度设计期枚举（spec-to-code-flow §5）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.1 | 2026-06-11 | 查找/替换 × 快捷键 × 列表延续 × 字数 4 家族 + undo e2e 门槛 |

---

## 1. AC ↔ 场景矩阵

| AC | 场景 | 载体 |
|----|------|------|
| AC-v21-1 | Cmd+F 唤起/聚焦、n/m 计数、Enter/Shift+Enter 跳转、Esc 关闭回焦 | unit（matches/index）+ e2e ac14 |
| AC-v21-2 | 替换当前→跳下一个；替换全部→toast 计数 | unit + e2e |
| AC-v21-3 | B/I 包裹/解包/无选区空包裹 | unit（jsdom fallback 路径）+ e2e（真 execCommand）|
| AC-v21-4 | K 链接 + url 占位选中 | unit + e2e |
| AC-v21-5 | 列表续行/递增/checkbox 重置/空项退出 | unit（continueList 纯逻辑）+ e2e |
| AC-v21-6 | 字数纯中/纯英/混排/空 | unit（countWords 纯函数）|
| AC-v21-7 | **程序化编辑 Cmd+Z 可撤销** | **e2e only**（jsdom 无真 undo 栈）双引擎 |
| AC-v21-8 | 既有行为零回归（gutter/滚动同步/防抖/移动端）| 既有 e2e 套件全量 |

## 2. 家族维度（设计期枚举）

- **查找族**：`命中(1/多/跨行) × 无果 × 清空 query × 大小写混合命中 × 输入后文本变更(matches 重算/activeIndex 钳位) × 环回(尾→头)`
- **替换族**：`当前(命中处/跳下一个) × 全部(计数/从后往前偏移正确) × 替换词含查找词(不死循环) × 空替换词(删除语义)`
- **快捷键族**：`B/I/K × 有选区(包裹) × 已包裹(选区带 marker 解包 / marker 紧邻外侧解包) × 无选区(B/I 空包裹置中、K no-op) × I 不误吞 B 的 **`
- **列表族**：`- / * / 1. / - [ ] 四前缀 × 行内容非空(续行；数字递增；[x]→[ ] 重置；缩进保留) × 裸前缀(退出删前缀) × 非列表行(不拦截) × isComposing(不拦截，IME)`
- **字数族**：`空(0 字) × 纯 CJK × 纯英文 × 混排 × 仅空白/标点 × <1 分钟显示`
- **回归族**：行号 gutter 开 × 查找跳转滚动；查找栏开 × 移动端单栏；程序化编辑 → M3 防抖持久化照常

## 3. 测试入口

- unit：`tests/unit/m1-find.test.ts` / `m1-commands.test.ts` / `m1-wordcount.test.ts`（纯逻辑 + jsdom fallback 路径）
- e2e：`tests/e2e/ac14-editor-enhance.spec.ts`（chromium + webkit 双引擎；undo 门槛 AC-v21-7 在此）
- 既有全量：unit 184 + e2e 93 不退

> 注：jsdom 不实现 `document.execCommand` → unit 里 replaceRange 走 fallback 分支（顺带覆盖降级路径）；真 undo 链路只在 e2e 验。
