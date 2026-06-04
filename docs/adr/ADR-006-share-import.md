# ADR-006 — URL 分享编码 + 导入 .md

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-04 Corray：D1 选 B `lz-string`；D2~D5 提议确认）|
| **Date** | 2026-06-04 |
| **Decider** | FE (Corray) |
| **Context** | 共识 v1.2（accepted）/ module-list M4 delta / 架构 §4.1 启动序列 |
| **Supersedes** | — |

## Context

共识 v1.2 决定 URL 分享（base64 内容到 URL hash）+ 导入 .md。TBD-v12-1~5 accept：压缩+超限拒绝 / hash fragment / 打开链接非空 confirm / 导入非空 confirm / 隐私明文 toast。

本 ADR 定 how：① 压缩库 ② hash 编码格式 ③ 打开分享链接的启动序列接入 ④ 导入文件读取 ⑤ API 契约。

约束：bundle 150KB 闸（当前 66.2KB）；arch §6.3 不联网（编码/解码/读文件全本地）；与 v0.2.0 IDB 异步 hydrate 的加载优先级要理清。

---

## D1 — URL 分享压缩库（**需 Decider 拍板**）

目标：把文档文本压成 **URL-safe 字符串**塞进 hash，最大化可分享文档大小。

### A. 纯 base64（不压缩）
- **Pros:** 0 依赖；`btoa(encodeURIComponent(text))` 几行
- **Cons:** base64 膨胀 ~33%，URL 上限（~2–8KB）下只能分享很小文档（~1.5–6KB 源文）；中文等多字节更差

### B. `lz-string`（`compressToEncodedURIComponent`）〔AI 倾向〕
- **Pros:** **专为"压缩到 URL"设计** —— `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` 直接产 URL-safe 串；同步；压缩率高（markdown 文本常压到 ~30-50%）→ 可分享文档大几倍；事实标准、稳定
- **Cons:** +依赖（~3KB gz `[推断: install 实测]`）

### C. 浏览器原生 `CompressionStream`（gzip）+ base64url
- **Pros:** 0 依赖；gzip 压缩率好
- **Cons:** **异步**（流式 API）；需手写 gzip-bytes → base64url → URL 编码；`CompressionStream` 兼容性（Safari 16.4+ / 老浏览器无）→ 需 fallback；复杂度高

### 决策：**B (`lz-string`)**〔Decider accepted 2026-06-04〕
它就是为这个场景造的（`*EncodedURIComponent` 系列），同步 + URL-safe + 高压缩率 + 几行调用。~3KB 依赖在 150KB 闸内（66→~69KB）。**反例**：若硬性"不加依赖"，C（CompressionStream）可行但异步 + 兼容 fallback 复杂；A 最简但分享能力太弱（小文档才行）。

> research-first：选定后 install 核对 lz-string 官方 API + 实测 gz；ADR References 附链接 + 访问日期。

---

## D2 — hash 编码格式（data-model delta）〔提议〕

`#doc=<v>.<payload>`：
- `<v>` = 格式版本（`1`），便于未来换压缩方案不破旧链接
- `<payload>` = `compressToEncodedURIComponent(text)`
- 例：`#doc=1.<lz-url-safe>`
- 解码：split 第一个 `.`，按版本号选解码器；版本未知 → toast「不支持的分享链接」

## D3 — 打开分享链接的启动序列（共识 TBD-v12-3 / 架构 §4.1 接入）〔提议〕

main.tsx 启动（在 v0.2.0 异步 hydrate 基础上）：
```
1. createDocumentState('') + createPersistence + 其余装配（不变）
2. 解析 location.hash：
   - 有 #doc= → 解码 shared（解码失败 → toast，按无 hash 处理）
   - 无 → 正常 IDB hydrate（loadStoredDocument）
3. 有 shared 时：
   a. existing = await loadStoredDocument()           // 看本机 IDB
   b. existing 非空 且 ≠ shared → window.confirm（TBD-v12-3）
      - 取消 → 用 existing（保留本机）；保留 hash？→ 清除 hash 避免反复 confirm
      - 确认 → setTextFromStorage(shared)（→ 持久化覆盖）
   c. existing 空 → 直接 setTextFromStorage(shared)
   d. 加载后 history.replaceState 清除 #doc=（防 reload 重触发 + 防分享内容长留地址栏）
```
**优先级：** 显式分享链接（用户主动打开）优先于本机 IDB，但非空覆盖前 confirm。

## D4 — 导入 .md（共识 TBD-v12-4）〔提议〕

- header「导入」按钮 → 隐藏 `<input type="file" accept=".md,.markdown,.txt">` → change 事件
- `await file.text()` 本地读（不上传）
- 当前文档非空 → confirm（TBD-v12-4）→ `setTextFromStorage(content)`
- 非 .md/.markdown/.txt（按 accept 过滤，但用户仍可选任意）→ 读为纯文本（Markdown 源文本就是纯文本，宽松接受）；超大（如 >5MB）→ 可选 toast，IDB 能存

## D5 — API 契约（api-spec delta）〔提议〕

```ts
// M4 扩
export interface ShareAPI {
  /** 生成分享 URL（含编码内容），复制到剪贴板；超限 → false + toast 拒绝 */
  share(): Promise<boolean>;
}
export interface ImportAPI {
  /** 读 .md 文件文本（本地）；调用方负责 confirm + 写回 M1 */
  readFile(file: File): Promise<string>;
}
// 启动用：解析 hash 分享参数（无 → null）
export function readSharedDocument(): string | null;
```

---

## Consequences（选定后）

- api-spec delta：ShareAPI / ImportAPI / readSharedDocument + 启动序列图
- data-model delta：`#doc=<v>.<payload>` 格式 + 加载优先级（hash 分享 > IDB）
- test-plan delta：家族 `分享(空/小/超限) × 打开(本机空/非空/解码失败) × 导入(空/非空/非文本)`
- 架构 §4.1 启动序列 + §4.x I/O；bundle 复核 `pnpm size`
- i18n：分享成功/超限/隐私/导入失败/不支持链接 等 key

## References

- 共识 v1.2 TBD-v12-1~5
- `lz-string` v1.5.0（github.com/pieroxy/lz-string）—— `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`，往返核实（2026-06-04，含 CJK/特殊字符，输出 URL-safe）
- **实测 bundle**：lz-string 引入后 66.17 → 68.21 KB gz（+~2KB；ADR 估 ~3KB 略高）；<150KB 闸
- **ESM interop 注意**：src/unit（Vite）可用 named import；Playwright e2e（Node ESM）需 `import LZString from 'lz-string'` 默认导入（lz-string 仅暴露 default）
- 实现 commit `7e15d00`
