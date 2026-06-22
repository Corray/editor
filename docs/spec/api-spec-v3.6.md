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
| ensureExtensions +mark/ins | ✓ | `6a3a889` |
| hasExtension `==`/`++` 检测 | ✓ | `6a3a889` |
| 依赖 mark@4.0.0/ins@4.0.0 + ambient 类型声明 | ✓ | `6a3a889` |

> 测试：unit +5（CT-MARK：hasExtension/mark/ins/XSS/删除线回归）→ 342；e2e +2 用例双引擎（ac29）→ 197+4skip。首屏 96.40KB。ac5-perf 负载 flake（隔离过，历轮一致）。
