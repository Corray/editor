# Perf 压测 — 大数据集（4 条未压测 finding 验证）

> **定位：** BHV-008 / F-V14-1 / F-V16-5 / F-V18-1 四条 finding 此前均标「未压测」（静态推断）。
> 本轮**测量优先**（先造数据集 → 实测 → 定性 → 真问题才优化），逐条要么「数据证明没事 → 带数据 dismiss」，
> 要么「确认真问题 → 优化 + 再测」。
>
> **测量日期：** 2026-06-09
> **测量机器：** 本地 macOS（Darwin 24.5.0）/ **dev server**（`vite` / 未压缩）
> **方法：** Playwright 真实浏览器 + `performance.now()` / `PerformanceObserver('longtask')` / 直接调 `pipeline.render()`
>
> **诚实口径（重要）：** 本轮在 **dev（未压缩）** 下测，render 绝对耗时高于生产（生产 markdown-it/DOMPurify 经 minify + 优化）。
> 结论用的是**相对量级 + 架构判断**（谁是瓶颈 / 是否同步阻塞），不是把 dev 绝对值当生产 SLA。
> 生产输入延迟基线另见 `baseline-v0.1.0.md` MANUAL-PERF-002（1000 行 34ms）。

---

## 总览：四条 verdict

| Finding | 原假设 | 实测 | Verdict |
|---------|--------|------|---------|
| **BHV-008** | 行号 gutter 大文档放大渲染/内存 | gutter ON 378ms vs OFF 374ms（5000 行/374KB）；on/off 几乎相等 | **假设推翻** → dismiss。gutter 非瓶颈。**但测量暴露真问题**（见下）|
| **BHV-008'**（新）| —（测量中浮现）| 大文档 preview **每键同步全量重渲染**阻塞输入 | **真问题 → 已优化**（防抖）+ 再测确认 |
| **F-V14-1** | mermaid 每键重渲染拖慢 | 有图 9ms vs 无图 6ms（同步 +3ms）；但每键重发占位 → **闪烁 + 异步重渲 CPU 浪费** | **延迟假设推翻**（+3ms 无感）；**闪烁/CPU 属实 → 防抖顺带消除** |
| **F-V16-5** | 多文档 startup getAll 慢 | 200 docs=21ms / 1000 docs=102ms | **推翻** → dismiss（1000 文档仍 OK）|
| **F-V18-1** | 多文档搜索线性扫慢 | 200 docs=1–3ms/query / 1000 docs=5–20ms/query | **推翻** → dismiss（真实规模无感；1000 边界但可接受）|

**净结果：** 4 条原假设 3 条被数据推翻；BHV-008 的 gutter 假设也推翻，但测量过程**浮现一条真问题**（大文档 preview 未防抖），已修 + 测试锁定。

---

## 1. BHV-008 — gutter 大文档成本（假设推翻）

**数据集：** 5000 行 / ~374KB markdown（`Line N: **markdown** ... [link]`）。

**方法：** 同一文档，gutter ON vs OFF，各测单字符输入延迟 + 数 gutter DOM 节点。

| 场景 | 单字符输入延迟 | gutter DOM 节点 |
|------|--------------|----------------|
| gutter ON | 378ms | 5000 |
| gutter OFF | 374ms | 0 |

**结论：** on/off 仅差 4ms（噪声内）→ **gutter 不是瓶颈**，5000 个 `__line` div 的渲染/内存成本可忽略。原「gutter 放大大文档成本」假设**被数据推翻** → `dismissed`。

**但**：on/off 都 ~374ms 这件事本身说明瓶颈在**别处**（见下）。

---

## 2. BHV-008'（新真问题）— 大文档 preview 每键同步全量重渲染

**测量浮现：** gutter off 仍 374ms，逐层拆解同步成本：

| 拆解项 | 耗时 | 说明 |
|--------|------|------|
| `render()`（markdown-it + DOMPurify）直接调 | 5KB=22ms / 30KB=58ms / 100KB=297ms / 250KB=327ms（dev）| 随体量增长，**~10KB 处即破一帧 16ms** |
| 原生 `<textarea>.value=` 全量替换 374KB | 176–236ms | 浏览器原生成本（**合成测试用全量替换**触发，真实增量打字不走此路）|
| 信号传播（`setText` → 所有 `text()` 订阅者，**防抖后**）| 8ms | 我方 JS，廉价 |

**根因：** `PreviewArea` 的 `html` memo 直接订阅 `state.text()` → 每键 `setText` 在 input dispatch 内**同步**重跑 `render()`（全量 markdown-it + DOMPurify + innerHTML）。大文档下每键阻塞数百 ms。

### 修复（commit `9ba4b1d`）：大文档 / 含 mermaid → render 防抖

`src/modules/m2-preview/PreviewArea.tsx`：引入 `renderText` 防抖信号。

- 小文档（< 10_000 字符，且不含 mermaid）→ **立即渲染**（无感，保持「实时预览」）
- 大文档 / 含 mermaid → **trailing-debounce 120ms**：连续输入期间不渲染，停顿后渲染一次
- 阈值依据：上表 render 耗时在 ~10KB 处破一帧

### 修复后再测（真实增量打字）

374KB 文档，`execCommand('insertText')` 增量插入（贴近真实打字），12 键、30ms 间隔：

| 指标 | 修复后 | 修复前（架构推断 *）|
|------|--------|--------------------|
| 每键同步阻塞 | avg **17ms** / max 31ms | ~1341ms（render 全量在 input 路径同步跑）|
| 昂贵 render | **打字停顿后触发一次**（longtask 1341ms，off 关键路径）| 每键一次 |

> \* 修复前数字 = `html` memo 直接订阅 `text()` 的架构事实 + 直接测得的 `render(374KB)` 耗时（dev longtask 1341ms）推断；
> 防抖把这次 render 从「每键 × N」挪到「停顿后 × 1」，输入路径只剩原生增量编辑 + 8ms 信号 = 17ms。

**净效果：** 374KB 文档打字从「每键卡死」→「每键 17ms 流畅」；预览滞后 ~120ms + 一次 render（极端大文档下的合理取舍）。

**已知残留（tech-debt，非本轮 scope）：** 单次 deferred render 在 374KB 下仍 ~1.3s（dev）。彻底解需增量/虚拟化渲染（大架构改动）；对一个 markdown 速记草稿器，374KB 属极端，防抖已是 80/20 的务实解。

**测试锁定：** `tests/unit/m2-preview/PreviewArea.test.tsx` CT-M2-DEBOUNCE-1/2/3（大文档防抖 / 小文档即时 / mermaid 防抖）。

---

## 3. F-V14-1 — mermaid 每键重渲染（延迟假设推翻 / 闪烁属实）

**数据集：** 含 1 个 mermaid 图的文档 vs 无图文档，测单字符输入**同步**延迟。

| 场景 | 同步输入延迟 |
|------|------------|
| 含 mermaid 图 | 9ms（样本 [13,9,8,8,12,9,8,7,8,7]）|
| 无图 | 6ms |

**结论：**
- **同步延迟仅 +3ms** → mermaid 异步渲染（`queueMicrotask` + 代次令牌）不阻塞打字，**延迟假设推翻**。
- **但**：`render()` 每键重发 `mermaid-pending` 占位 → 图**闪烁**（SVG → 占位 → SVG）+ 异步 `mermaid.render` 每键实际执行（代次令牌只丢弃过期*替换*，CPU 已花）→ **属实的 CPU 浪费 + 视觉闪烁**。

**处置：** §2 的防抖条件**含 mermaid 即防抖**（不论体量）→ 连续打字期间不重发占位 → **顺带消除闪烁 + 重复异步渲染**。比单独按源文 hash 缓存更简单，且复用同一防抖路径。`dismissed`（延迟）+ `resolved`（闪烁，随 BHV-008' 防抖修复）。

---

## 4. F-V16-5 — 多文档 startup getAll（推翻）

**数据集：** 向 IndexedDB `documents` store 种入 N 个 doc（每个 ~4.7KB）。

| N | getAll 耗时 | build Map | 总文本 |
|---|------------|-----------|--------|
| 200 | 21ms | 1ms | 0.9 MB |
| 1000 | 102ms | — | 4.8 MB |

**结论：** 即使 1000 文档（远超个人 markdown 草稿器现实用量），startup getAll 102ms 一次性成本可接受 → **假设推翻** → `dismissed`。真要优化需「列表只读 meta，text 懒加载」，但当前规模**不值得**这复杂度。

---

## 5. F-V18-1 — 多文档搜索线性扫（推翻）

**数据集：** 同 §4 的 N 个 doc，`docs()` 搜索（title|text `includes`）。

| N | per-query（命中少）| per-query（命中多）| per-query（无命中）|
|---|------------------|------------------|------------------|
| 200 | 3.3ms | 1.1ms | 2.7ms |
| 1000 | 18.7ms | 5.5ms | 20.0ms |

**结论：** 真实规模（数十文档）每 query 1–3ms 无感；1000 文档边界（~20ms，仍 < 1 帧多一点）可接受 → **假设推翻** → `dismissed`。同 F-V16-5 家族，倒排索引等优化在当前规模**不值得**。

---

## 复测方法

```bash
# dev server
pnpm dev --port 5188 &
# 用 Playwright 在 http://localhost:5188/editor/ 执行：
#  - render 耗时：await import('/editor/src/modules/m2-preview/pipeline.ts') → 计时 render(md) 各体量
#  - 输入延迟：execCommand('insertText') 增量插入 + performance.now() / PerformanceObserver('longtask')
#  - getAll/search：indexedDB 种 N 个 doc → 计时 getAll + filter
```

**回归断言（已自动化）：** `PreviewArea.test.tsx` CT-M2-DEBOUNCE-* 锁防抖行为；`ac5-perf.spec.ts` E2E-AC5-002 锁 1000 行输入延迟。

---

## 与 findings-registry 的对应

| Finding | 本轮 verdict | registry 状态流转 |
|---------|------------|------------------|
| BHV-008 | gutter 非瓶颈 | deferred → **dismissed**（数据：on/off 等价）|
| BHV-008'（新）| 大文档 preview 未防抖 | **新增 → resolved**（防抖修复 + 测试）|
| F-V14-1 | 延迟无感 / 闪烁属实 | deferred → **resolved**（防抖顺带消除闪烁）|
| F-V16-5 | 1000 文档仍 OK | proposed → **dismissed**（数据）|
| F-V18-1 | 真实规模无感 | proposed → **dismissed**（数据）|
