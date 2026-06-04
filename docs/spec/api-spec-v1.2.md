# 接口设计 v1.2 delta — 分享 / 导入

> v1.0/v1.1 接口的增量。M4 扩 ShareAPI / ImportAPI + 启动读 hash 分享参数。
> **基线：** 共识 v1.2（accepted）+ ADR-006（accepted，D1=lz-string）。

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.2 | 2026-06-04 | M4 +ShareAPI/ImportAPI + `readSharedDocument` + 启动序列接入 |

---

## 1. M4 I/O 契约扩展

```ts
// modules/m4-export/api.ts（additive；ExportAPI 不变）
export interface ShareAPI {
  /** 生成分享 URL（lz 压缩内容到 #doc=），复制剪贴板 + 隐私 toast；
   *  超 URL 上限 → 不生成坏链接，toast 拒绝，返回 false。 */
  share(): Promise<boolean>;
}
export interface ImportAPI {
  /** 本地读 .md 文件文本（File.text，不上传）。调用方负责 confirm + 写回 M1。 */
  readFile(file: File): Promise<string>;
}

/** 启动用：解析 location.hash 的分享参数；无 / 解码失败 → null。 */
export function readSharedDocument(): string | null;
```

**编码格式（data-model v1.2 §1）：** `#doc=1.<lz>`，`<lz>` = `LZString.compressToEncodedURIComponent(text)`。

**消费方：** 仅 chrome（main.tsx header「分享」「导入」按钮 + 启动序列）。M1/M2/M3 不消费。

## 2. 启动序列（接 v0.2.0 异步 hydrate / ADR-006 D3）

```
render 内（v0.2.0 基础上）：
  state=createDocumentState('') + createPersistence + 其余装配
  const shared = readSharedDocument()            // 同步解析 hash
  if (shared !== null):
    loadStoredDocument().then(existing => {
      const apply = () => editor.setTextFromStorage(shared)
      if (existing && existing !== shared) {
        if (window.confirm(t('share.overwrite.confirm'))) apply()  // TBD-v12-3
      } else apply()
      history.replaceState(null, '', location.pathname + location.search)  // 清 #doc
    })
  else:
    loadStoredDocument().then(s => { if (s && state.text()==='') editor.setTextFromStorage(s) })  // v0.2.0 原逻辑
```
**优先级：** 分享链接（显式用户动作）> 本机 IDB；非空覆盖前 confirm；加载后清除 hash（防 reload 重触发 + 不长留地址栏）。

## 3. 导入流程（ADR-006 D4）

```
header「导入」→ <input type=file accept=".md,.markdown,.txt"> change
  → text = await importer.readFile(file)
  → state.text() 非空 → confirm(t('import.overwrite.confirm'))   // TBD-v12-4
  → editor.setTextFromStorage(text)
```

## 4. i18n 新增 key

| key | 用途 |
|-----|------|
| `share.button` / `import.button` | header 按钮 |
| `share.ok` | 「链接已复制（含明文内容，勿分享敏感信息）」隐私提示（TBD-v12-5）|
| `share.tooLarge` | 超限拒绝 |
| `share.overwrite.confirm` / `import.overwrite.confirm` | 覆盖 confirm |
| `share.linkInvalid` | 解码失败 / 不支持版本 |
| `import.readFail` | 文件读失败 |

## 5. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| `ShareAPI.share()` + lz 编码 + 超限拒绝 | ✓ 已实现（2026-06-04）| `7e15d00` — createShareAPI（clipboard+toast）；ShareUrl.ts buildShareUrl |
| `ImportAPI.readFile()` | ✓ 已实现 | `7e15d00` — ImportFile.ts（File.text）|
| `readSharedDocument()` + 启动序列接入 | ✓ 已实现 | `7e15d00` — 分享>IDB+confirm；取消→保留本机；replaceState 清 hash |
| header 分享/导入按钮 + confirm + i18n | ✓ 已实现 | `7e15d00` — 8 i18n key；隐藏 file input；13 单测 + ac7 e2e 5 场景 |
