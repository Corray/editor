# 接口设计 v3.5 delta — callout 容器块

> **基线：** 共识 v3.5（accepted）+ ADR-031。无 data-model 变更。

| 版本 | 日期 | 变更 |
|------|------|------|
| v3.5 | 2026-06-22 | ensureExtensions +container（note/tip/warning/danger）；hasExtension `:::`；i18n callout.* |

---

## 1. M2 pipeline 扩展（ADR-031）

```ts
// ensureExtensions 的插件链 +4 container（applyExtensions 内）：
//   md.use(container, 'note', { render: calloutRender('note') }) … × tip/warning/danger
// calloutRender(type)：开 → <div class="callout callout--{type}"><div class="callout__title">{label}</div>
//                       闭 → </div></div>；label = 自定义标题 || t('callout.{type}')（escapeHtml）
// hasExtension 正则 += /:::[a-z]/
```

## 2. 装配 / i18n

- i18n：`callout.note`='注意'/`callout.tip`='提示'/`callout.warning`='警告'/`callout.danger`='危险'（zh）+ Note/Tip/Warning/Danger（en）
- CSS：`.callout` + `.callout--{type}` 4 色 + `.callout__title`

## 3. 实现追溯（实现后回填）

| 入口 | 状态 | commit |
|------|------|--------|
| ensureExtensions +container 4 类 + calloutRender | ⏳ | — |
| hasExtension `:::` 检测 | ⏳ | — |
| i18n callout.*（zh+en，+EXPECTED_KEYS）| ⏳ | — |
| .callout CSS + container 类型声明 | ⏳ | — |
