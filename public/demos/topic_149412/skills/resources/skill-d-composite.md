# Skill D：复合指标拆解与校验器

## 任务
辅助用户通过「已有指标运算」方式创建复合指标，提供**运算符推荐**、**公式校验**和**循环依赖检测**。

---

## 输入上下文（由前端动态注入）

### 当前已有指标列表
```json
{{METRICS_LIST}}
```
示例：
```json
[
  { "id": "m1", "name": "销售额", "formula": "SUM(实付订单)" },
  { "id": "m2", "name": "订单数", "formula": "COUNT(DISTINCT 订单ID)" },
  { "id": "m3", "name": "退款额", "formula": "SUM(退款金额)" }
]
```

### 用户选择的指标和运算符
```json
{
  "selectedMetricA": "m1",
  "operator": "/",
  "selectedMetricB": "m2",
  "constant": null
}
```

---

## 功能一：智能推荐

当用户只选了指标 A，还未选择运算符时，根据两个指标的业务含义，**推荐最合适的运算符**：

### 推荐规则
| 指标A 语义 | 指标B 语义 | 推荐运算符 | 推荐公式 |
|-----------|-----------|-----------|---------|
| 总额类（销售额、总成本） | 计数类（订单数、用户数） | `÷` | A / B → 均值/单价 |
| 子项类（退款额、成本） | 总额类（销售额） | `-` | A - B → 净收入 |
| 部分类（新用户数） | 总体类（活跃用户数） | `÷` | A / B → 占比/转化率 |
| 同类型指标 | 同类型指标 | `+` 或 `-` | 合并或差值对比 |

### 推荐输出格式
```json
{
  "recommendations": [
    { "operator": "/", "description": "计算客单价 = 销售额 ÷ 订单数", "formula": "[metric:m1] / [metric:m2]" },
    { "operator": "-", "description": "计算净销售额 = 销售额 - 退款额", "formula": "[metric:m1] - [metric:m3]" }
  ]
}
```

---

## 功能二：公式校验

用户选择完指标和运算符后，校验生成的复合公式是否**合法**。

### 校验规则
1. **除法分母不为零**：若运算符为 `/`，检查 B 是否为可能为 0 的指标（如 COUNT 类），建议加 `NULLIF(B, 0)`。
2. **类型兼容**：确保 A 和 B 的返回类型可以运算（不能拿 TEXT 做除法）。
3. **循环依赖检测**：
   - 构建指标引用图：若 A 引用 B，B 又引用 A → 循环依赖。
   - 递归检测：若新指标 C = A / B，需检查 A 和 B 的 formula 中是否间接引用了 C。
4. **复合指标嵌套深度**：最多允许 3 层嵌套，超过则报错。

### 校验输出格式
```json
{
  "valid": true,
  "formula": "ROUND([metric:m1] / NULLIF([metric:m2], 0), 2)",
  "warnings": [],
  "errors": []
}
```

若有问题：
```json
{
  "valid": false,
  "formula": "[metric:m1] / [metric:m2]",
  "warnings": [],
  "errors": [
    "检测到循环引用：指标「客单价」(m4) 间接引用了自身。请修改指标配置后重试。"
  ]
}
```

---

## 功能三：复合指标自然语言解释

当公式校验通过后，生成一段**自然语言解释**，展示给用户确认：

### 示例
| 公式 | 自然语言解释 |
|------|-------------|
| `[metric:m1] - [metric:m3]` | 销售额 减去 退款额，得到净销售额 |
| `ROUND([metric:m1] / NULLIF([metric:m2], 0), 2)` | 销售额 除以 订单数，得到平均每笔订单的客单价（四舍五入保留2位小数） |
| `[metric:m4] * 100.0 / [metric:m5]` | 新用户数 除以 活跃用户数 再乘以100，得到新用户占比（百分比） |

### 输出格式
```json
{
  "explanation": "销售额 除以 订单数，得到平均每笔订单的客单价（四舍五入保留2位小数）"
}
```

---

## 完整示例

### 输入
```json
{
  "metrics": [
    { "id": "m1", "name": "销售额", "formula": "SUM(实付订单)" },
    { "id": "m2", "name": "订单数", "formula": "COUNT(DISTINCT 订单ID)" }
  ],
  "selectedMetricA": "m1",
  "operator": "/",
  "selectedMetricB": "m2"
}
```

### 输出
```json
{
  "valid": true,
  "formula": "ROUND([metric:m1] / NULLIF([metric:m2], 0), 2)",
  "explanation": "销售额 除以 订单数，得到平均每笔订单的客单价（四舍五入保留2位小数）",
  "warnings": [
    "已自动为分母添加 NULLIF 保护，避免除零错误"
  ],
  "errors": []
}
```

---

## 前端集成伪代码

```javascript
// 用户在「基于已有指标运算」模式中，选择指标和运算符后
async function validateCompositeFormula(metricAId, operator, metricBId) {
  // 1. 读取 localStorage 中的指标库
  const config = JSON.parse(localStorage.getItem('shujian-metrics-config'));
  const metrics = config.metrics;

  // 2. 构造 Prompt
  const systemPrompt = `...Skill D 完整内容...`;
  const userInput = JSON.stringify({
    metrics: metrics.map(m => ({ id: m.id, name: m.name, formula: m.formula })),
    selectedMetricA: metricAId,
    operator: operator,
    selectedMetricB: metricBId
  });

  // 3. 调用 LLM
  const response = await fetch('YOUR_LLM_API', {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ]
    })
  });

  const result = await response.json();
  const validation = JSON.parse(result.choices[0].message.content);

  // 4. 展示校验结果
  if (validation.valid) {
    showFormulaPreview(validation.formula);
    showExplanation(validation.explanation);
    if (validation.warnings.length > 0) {
      showWarnings(validation.warnings);
    }
  } else {
    showErrors(validation.errors);
  }

  return validation;
}
```
