# 接口设计 v3.6 delta — 文本高亮/标记

> **基线：** 共识 v3.6（accepted）+ ADR-032。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.6 | 2026-06-22 | ensureExtensions +mark/ins；hasExtension `==`/`++` |

---

## 1. M2 pipeline 扩展（ADR-032）

```ts
// applyExtensions 链 +2：md.use(mark.default).use(ins.default)
// hasExtension 正则 += /==[^=]|\+\+[^+]/
```

## 2. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| ensureExtensions +mark/ins | ⏳ | — |
| hasExtension `==`/`++` 检测 | ⏳ | — |
| 依赖 mark/ins + 类型声明 | ⏳ | — |
