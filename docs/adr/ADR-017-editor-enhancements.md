# ADR-017 — 编辑增强：程序化编辑 undo 保持 + 查找/替换 + 格式快捷键 + 列表延续 + 字数统计

| 字段 | 值 |
|------|----|
| **Status** | **accepted**（2026-06-11：D1=execCommand 优先 / D2=FindController 选区跳转 / D3=toggle 包裹 / D4=keydown 列表延续（IME 守卫）/ D5=CJK+词复合计数）|
| **Date** | 2026-06-11 |
| **Decider** | FE (Corray，共识 v2.1 TBD 全拍) |
| **Context** | 共识 v2.1（accepted）/ M1 现状（薄 textarea + signal SoT）|
| **Supersedes** | — |

## Context

v2.1 四件套（查找/替换、Cmd+B/I/K、列表自动延续、字数统计）全部落 M1。核心技术张力 = **程序化改 textarea 必须可 Cmd+Z 撤销**（AC-v21-7，共识张力 B）。

---

## D1 — 程序化编辑统一走 `insertText` helper（undo 保持）

所有程序化编辑（替换 / 包裹解包 / 列表延续）收口到单一 helper：选区定位（`setSelectionRange`）→ `document.execCommand('insertText', false, text)`。

- **为什么 execCommand**：唯一能进浏览器原生 undo 栈的程序化写入（`setRangeText` / 直改 `value` 均不进栈 → Cmd+Z 撤不掉，数据安全级 UX 缺陷）。deprecated 但无移除时间表，Chromium/WebKit/Gecko 实测全支持（e2e 双引擎守）。
- **降级**：`execCommand` 返回 false / 抛错 → fallback `setRangeText` + 手动派发 input 事件（undo 丢失但功能不坏）。
- **signal 同步**：execCommand 触发原生 `input` 事件 → 既有 `onInput` 写回 state，**不**绕过 SoT 单写路径。

## D2 — FindController（查找/替换，TBD-v21-1a/2a）

`m1-editor/find.ts`：signals `open/query/activeIndex` + memo `matches`（对 `state.text()` 小写化 indexOf 扫描，字面量大小写不敏感，无开关）。

- next/prev：`setSelectionRange(match)` + 行号估算 scrollTop 居中（`text 前缀 \n 计数 × lineHeight`；软换行下视觉行≠逻辑行的偏差与 F-V17-3 同限，接受）
- replaceCurrent：选中当前命中 → D1 insertText(替换词) → 跳下一个；replaceAll：从后往前逐个替换（避免偏移失效），单次 undo 不保证合并（浏览器栈语义），toast 报计数
- Cmd/Ctrl+F 在**编辑面板容器内**拦截唤起（焦点在预览/列表时不拦，浏览器原生查找仍可用）；Esc 关闭回焦 textarea

## D3 — 格式快捷键 toggle（TBD-v21-3a）

`m1-editor/commands.ts`：B=`**` / I=`*`（先查 bold 防 `**` 误判 italic）/ K=`[sel](url)`。

- toggle 判定两形态：①选区自带 marker（选了 `**x**`）→ 解包；②marker 紧贴选区外侧 → 扩选解包；否则包裹
- 无选区：B/I 插入空包裹光标置中；K no-op（共识）
- K 包裹后选中 `url` 占位（直接输入替换）

## D4 — 列表自动延续（TBD-v21-4a / keydown Enter）

textarea keydown Enter 拦截：当前行匹配 `/^(\s*)([-*] (\[[ x]\] )?|\d+\. )/` →

- 行内容非空：preventDefault + D1 插入 `\n + 前缀`（数字 +1；`- [x]` 新行重置 `- [ ]`；缩进保留）
- 行内容为空（裸前缀）：preventDefault + 选中前缀范围 → D1 替换为空（退出列表，不换行）
- **IME 守卫**：`e.isComposing` 为 true 时不拦截（中文输入法 Enter 确认候选词，误拦 = 中文输入坏掉）

## D5 — 字数统计（TBD-v21-5a）

`m1-editor/wordcount.ts` 纯函数 + memo：CJK 字符数（`一-鿿぀-ヿ가-힯` 等区段逐字）+ 非 CJK 按空白分词数；阅读 = `cjk/400 + words/200` 分钟（0<x<1 显 `<1`，0 显 `0 字`）。编辑面板底部细 status bar（仅编辑 pane）：`N 字 · ~M 分钟`。单次 O(n) 正则扫描，百 KB 级毫秒档（perf 压测先例规模），不防抖；audit 时复核。

---

## Consequences

- **api-spec delta**：M1 新增 `FindControllerAPI` + `applyFormat(kind)` + `wordCount(text)` 纯函数 + EditorArea props 扩展（findController / statusBar 由容器装配）
- **data-model**：无（纯编辑态，查找栏状态不持久化）
- i18n：查找/替换占位符、按钮、toast、字数模板（M7 dict）
- test-plan delta：家族 `查找 × 替换 × 快捷键 × 列表 × 字数`（见 test-plan v2.1）；**undo 可撤销为独立 AC（AC-v21-7）e2e 验**（unit 环境 jsdom execCommand 不可靠，undo 链路只在真浏览器验）
- 无安全面：查找词/插入文本只进 textarea value（纯文本），渲染仍走既有 DOMPurify 管线；不动 sanitize
- 风险登记：execCommand deprecated 是**显式技术债**（TODO(deprecated-api) 标注 + e2e 双引擎守行为；若未来浏览器移除 → fallback 已就位，仅损 undo 集成）
