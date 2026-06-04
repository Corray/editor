# 数据模型 v1.2 delta — 分享 URL 编码格式

> v1.0/v1.1 数据模型增量。新增"分享 URL 编码"这一**传输格式**（非持久化存储）。
> **基线：** 共识 v1.2 + ADR-006（D1=lz-string / D2 格式）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.2 | 2026-06-04 | `#doc=<v>.<payload>` 分享编码 + 加载优先级 |

---

## 1. 分享 URL 编码（传输格式，非存储）

```
location.hash = #doc=<version>.<payload>
```
| 段 | 值 |
|----|----|
| `version` | `1`（格式版本，便于未来换压缩方案不破旧链接）|
| `payload` | `LZString.compressToEncodedURIComponent(sourceText)`（URL-safe，无需再 encodeURIComponent）|

**解码：** `hash.match(/^#doc=(\d+)\.(.*)$/)` → 按 version 分派；
- v=1 → `LZString.decompressFromEncodedURIComponent(payload)`
- 未知 version / 解码 null → 视为无效（toast `share.linkInvalid`，按无分享处理）

**非加密声明：** lz + base64-ish 是**编码非加密**，明文可逆。分享 URL 含明文内容（隐私 toast 提示 TBD-v12-5）。

## 2. 大小上限处理（共识 TBD-v12-1）

- 生成时算最终 URL 长度（`location.origin + pathname + '#doc=1.' + payload`）
- 超阈值（保守取 **8000** 字符，覆盖主流浏览器/平台下限）→ 不生成，toast `share.tooLarge` 拒绝
- 阈值是常量 `SHARE_URL_MAX`，集中定义

## 3. 加载优先级（与 v0.2.0 IDB 文档）

```
启动时数据来源优先级：
  1. URL #doc= 分享参数（显式用户动作）—— 最高
       └ 本机 IDB 非空且内容不同 → confirm（TBD-v12-3）
  2. IDB document（v0.2.0 持久化）
  3. 旧 localStorage（迁移 / fallback，v1.1）
  4. 空（新用户）
```
分享内容一旦确认加载 → 经 M1 setText → M3 自动持久化到 IDB（即"打开并接受分享"= 覆盖本机文档，已 confirm）。加载后 `history.replaceState` 清除 hash。

## 4. 不涉及的

- 不新增 IDB store / 不改 `kv` schema —— 分享是**传输编码**，不落持久化层
- 导入 .md 不引入新存储 —— 读文件文本 → 走 M1 → M3 既有 IDB 持久化
- `editor.theme.v1` / `editor.prefs.v1` localStorage 不受影响
