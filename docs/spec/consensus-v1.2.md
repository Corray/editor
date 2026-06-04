# 共识文档 v1.2 — 分享 / 导入（URL 分享 + 导入 .md）

> v1.0 共识的增量 delta（路线图 PRD §153 / architecture §249 的 v1.2 里程碑）。仅描述本次行为变化，v1.0/v1.1 其余条款不变。
>
> **状态：** `draft`（待 PM 评审 TBD-v12-1~5）
> **spec-to-code-flow 位置：** v1.2 入口节点（共识）→ 评审通过后 module-list delta → 架构 + ADR-006 → api+data-model delta → test-plan delta → 实现
> **命名：** 路线图称 "v1.2"；按 semver 将作为 tag **v0.3.0** 发布（同 v1.1→v0.2.0 先例）。

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.2-draft | 2026-06-04 | URL 分享 + 导入 .md；5 条 TBD 待 accept |

---

## 1. 动机与范围

PRD §153 / architecture §249 的 v1.2 = **URL 分享（base64 内容到 URL）+ 导入 .md 文件**。一对 I/O 闭环：内容出（分享链接）/ 入（导入文件），纯 FE 无后端。

**本次范围（仅）：** ① 生成可分享 URL（内容编码进 URL）② 打开分享 URL 时加载内容 ③ 导入本地 .md 文件到编辑器。
**明确不在本次：** 多文档、Service Worker、Mermaid/KaTeX、云同步（各按 roadmap 推迟）。

---

## 2. 已定 delta（不留 TBD）

| 维度 | 定义 |
|------|------|
| 分享触发 | header 加「分享」按钮 → 生成 URL → 复制到剪贴板 + toast |
| 导入触发 | header 加「导入」按钮 → 文件选择器（`accept=".md,.markdown,.txt"`）→ 读入编辑器 |
| 模块归属 | M4 从「导出」扩为「导入/导出 I/O」（§职责边界扩，接口 additive）|
| 编码非加密 | base64（含压缩）**不是加密** —— 分享 URL 含明文内容，见 TBD-v12-5 |
| 离网不变 | app 自身仍不 fetch / 不打点（共识 §6.3）；分享是用户主动复制 URL，不违反"不联网" |
| 导入读取 | 用 `File.text()` 本地读，不上传 |

---

## 3. 待确认项（TBD-v12-x，PM 拍板；"做什么"层，"怎么做"在 ADR-006）

### TBD-v12-1 — URL 分享内容超限处理（关键）
base64 编码后塞进 URL；浏览器 URL 实际上限 ~2–8KB（因浏览器/平台而异）。大文档会超。
- **(a) 压缩后编码 + 超限 toast 拒绝**〔AI 倾向〕— 压缩（lz-string 或浏览器原生 CompressionStream，库选型在 ADR-006）提高可塞上限；仍超 → toast「文档过大，无法生成分享链接，请改用下载 .md」，不生成坏链接。
- (b) 不压缩，超限截断 — 截断 = 分享内容残缺，隐患。
- (c) 不压缩，超限仍生成 — 生成的超长 URL 在部分平台被截断 / 打不开。

**AI 倾向 (a)**：压缩最大化可分享文档大小，超限明确拒绝（不产坏数据）。反例：+压缩依赖 / CompressionStream 异步 + 老浏览器兼容；权衡在 ADR-006。

### TBD-v12-2 — URL 位置：query string vs hash fragment
- **(a) hash fragment `#doc=<encoded>`**〔AI 倾向〕— 纯客户端，**不进任何服务器访问日志**（隐私更好）；GH Pages SPA 友好。
- (b) query `?doc=<encoded>` — 会进 server / CDN 访问日志（GH Pages 日志含内容）。

**AI 倾向 (a) hash**：内容不离开"被请求 URL 的明文日志"层面，隐私优于 query。反例：hash 不被某些 Sw/分析工具捕获（本项目不打点，无所谓）。

### TBD-v12-3 — 打开分享链接 vs 已有保存文档的冲突（数据安全关键）
用户打开含 `#doc=...` 的链接，但本机 IDB 已有保存的文档：
- **(a) 已有非空文档 → confirm 再加载**〔AI 倾向〕— 「打开分享内容将替换当前文档，是否继续？」；确认才覆盖，取消则忽略分享参数保留本机文档。
- (b) 直接覆盖 — 丢用户本机文档（数据丢失）。
- (c) 分享内容只读预览不入持久化 — 最安全但需"预览态"UI（复杂，类似多文档）。

**AI 倾向 (a)**：复用 clear 的 confirm 范式，挡住静默覆盖丢数据；本机为空则直接加载无需 confirm。反例：confirm 打断"点链接即看"的顺畅；但数据安全优先。

### TBD-v12-4 — 导入 .md 与当前内容冲突
- **(a) 当前非空 → confirm 再替换**〔AI 倾向〕— 同 TBD-v12-3 / clear 范式。
- (b) 直接替换 — 丢当前内容。

**AI 倾向 (a)**：一致的 confirm-on-overwrite 规则（分享/导入/清空同范式）。

### TBD-v12-5 — 隐私提示（base64 非加密）
分享 URL 含明文内容（base64 可逆）。
- **(a) 生成分享链接时 toast 注明**〔AI 倾向〕— 「链接已复制（含明文内容，勿分享敏感信息）」。
- (b) 不提示 — 用户可能误以为分享是私密的。

**AI 倾向 (a)**：一次性 toast 告知，符合共识"让用户感知风险"的既有调性（如配额提示）。

---

## 4. 下游影响（评审通过后产出）

| 节点 | 产物 | 触点 |
|------|------|------|
| module-list | M4 「导出」→「导入/导出 I/O」职责扩 + 新增分享/导入边界 | §M4 |
| 架构 + **ADR-006** | 编码方案（压缩库 / base64 / hash）+ 导入文件读取 + 打开分享链接的启动序列接入 | L2-L3 |
| api-spec delta | ExportAPI 扩 `shareUrl()` / 新增 `ImportAPI.importFile(file)`；启动读 hash 参数 | 契约 |
| data-model delta | URL 编码格式（前缀/版本/压缩标记）；与 IDB 文档的加载优先级（hash 参数 vs IDB） | 数据流 |
| test-plan delta | 家族维度：`分享(空/小/超限) × 打开链接(本机空/非空) × 导入(空/非空/非.md)` | 覆盖 |

---

## 5. 验收条件（v1.2 新增 AC，待 test-plan 细化）

- AC-v12-1：编辑内容 → 点分享 → URL 复制到剪贴板 + 含可解码内容
- AC-v12-2：打开含 `#doc=...` 的链接（本机空）→ 内容加载进编辑器
- AC-v12-3：打开分享链接（本机有非空文档）→ confirm；确认覆盖 / 取消保留（TBD-v12-3）
- AC-v12-4：超大文档分享 → toast 拒绝，不产坏链接（TBD-v12-1）
- AC-v12-5：导入 .md 文件 → 内容进编辑器（本机非空先 confirm）
- AC-v12-6：分享链接生成 → 隐私 toast 提示明文（TBD-v12-5）

> 待 TBD-v12-1~5 accept 后细化进 test-plan delta。
