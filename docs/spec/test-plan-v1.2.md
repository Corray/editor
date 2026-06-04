# 测试计划 v1.2 delta — 分享 / 导入

> v1.0/v1.1 测试计划增量。覆盖 URL 分享 + 导入 .md 的验收 + 家族维度。
> **基线：** 共识 v1.2 AC-v12-1~6 + ADR-006 + api/data-model v1.2。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.2 | 2026-06-04 | 分享/打开/导入 家族矩阵 |

---

## 1. 验收条件矩阵

| AC | 场景 | 测试 ID | 层 |
|----|------|---------|----|
| AC-v12-1 | 编辑 → 分享 → URL 复制 + 含可解码内容 | UT-SHARE-001 / E2E-v12-001 | unit + e2e |
| AC-v12-2 | 打开 `#doc=`（本机空）→ 内容加载 | UT-LOAD-002 / E2E-v12-002 | unit + e2e |
| AC-v12-3 | 打开分享（本机非空）→ confirm；确认覆盖 / 取消保留 | E2E-v12-003 | e2e |
| AC-v12-4 | 超大文档分享 → toast 拒绝，不产坏链接 | UT-SHARE-004 | unit |
| AC-v12-5 | 导入 .md（本机非空先 confirm）→ 内容进编辑器 | UT-IMPORT-005 / E2E-v12-005 | unit + e2e |
| AC-v12-6 | 分享生成 → 隐私 toast 提示明文 | UT-SHARE-006 | unit |

## 2. 家族维度枚举（设计期定）

**核心家族：`分享(大小) × 打开(本机状态) × 导入(内容)`**

| 维度 | 取值 |
|------|------|
| 分享大小 | 空 / 小（可塞）/ 超限（>SHARE_URL_MAX）|
| 编码往返 | compress → decompress 还原一致（含中文/特殊字符/换行）|
| 打开链接本机状态 | IDB 空 / IDB 非空且内容不同（confirm）/ IDB 非空且内容相同（不 confirm）/ 解码失败 / 未知 version |
| 导入内容 | 空文件 / 正常 .md / 当前非空（confirm）/ 大文件 |

**必测组合（不漏网）：**
- 编码往返 × {ascii / 中文多字节 / 含 `#`/`&`/换行 等特殊字符} → 还原一致
- 打开链接 × {本机空→直接加载 / 本机非空确认→覆盖 / 本机非空取消→保留 + 清 hash / 解码失败→toast 按空处理}
- 分享 × 超限 → 不产 URL + toast
- 导入 × {非空 confirm 确认 / 取消保留}
- 加载分享后 hash 被 `replaceState` 清除（reload 不重触发）

## 3. 用例清单（关键）

| ID | 场景 | 预期 |
|----|------|------|
| UT-SHARE-001 | share() 编码往返 | `readSharedDocument` 解码 == 原文（设置 hash 后）|
| UT-SHARE-004 | 超限 | share() 返回 false + `share.tooLarge` toast；hash 不变 |
| UT-SHARE-006 | 隐私提示 | share() 成功 → `share.ok` toast |
| UT-LOAD-002 | 解码 | `readSharedDocument()` 对 `#doc=1.<lz>` 返回原文 |
| UT-LOAD-INVALID | 坏链接 | `#doc=9.xxx`（未知版本）/ 乱码 → `readSharedDocument()` 返回 null |
| UT-IMPORT-005 | readFile | File('# x') → readFile 返回 '# x' |
| E2E-v12-001 | 分享端到端 | 输入 → 点分享 → 剪贴板含 `#doc=` URL（读 clipboard 或 mock）|
| E2E-v12-002 | 打开空 | goto `/#doc=1.<lz>`（本机空）→ 编辑器显示内容 + hash 清除 |
| E2E-v12-003 | 打开覆盖 | 本机有文档 → goto 分享 URL → confirm dialog；accept→覆盖 / dismiss→保留 |
| E2E-v12-005 | 导入 | 点导入 → setInputFiles(.md) → 编辑器显示（本机非空先 confirm）|

## 4. 测试基础设施（PP-003）

- **lz-string 往返**：unit 直接调 compress/decompress 验证还原；中文/特殊字符重点
- **clipboard**（分享复制）：chromium 授 `clipboard-write` 权限或 mock `navigator.clipboard.writeText`（同 AC3-002 复制 HTML 的 chromium-only 模式）
- **confirm dialog**（覆盖）：e2e `page.on('dialog', d => d.accept()/dismiss())`（同 AC2-002 clear 范式）
- **导入文件**：e2e `setInputFiles` + 临时文件 / `DataTransfer`；unit 用 `new File(['# x'], 'a.md')`
- **hash 启动**：e2e `page.goto('/#doc=...')`；resetStorage 先清 IDB（隔离）
- **加载优先级**：unit/e2e 验证 hash 分享 > IDB（本机有文档时分享仍优先 + confirm）

## 5. 回归基线

- 既有 AC-1~6 / AC-v11 不受影响（分享/导入是 additive）
- bundle 复核：+lz-string gz 后 `pnpm size`（150KB 闸）
