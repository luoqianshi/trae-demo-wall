# Skill E：归因分析引擎

## 任务
当用户问"为什么下降了/上升了"时，自动拆解指标构成因子，定位**异常驱动因子**。

---

## 输入上下文（由前端动态注入）

### 1. 当前查询的指标信息
```json
{
  "metricName": "销售额",
  "metricFormula": "SUM(实付订单)",
  "currentValue": 850000,
  "previousValue": 1200000,
  "changeRate": -0.29,
  "timeRange": "2025年6月 vs 2025年5月"
}
```

### 2. 可用的子指标列表（用于拆解归因）
```json
[
  { "name": "订单数", "formula": "COUNT(DISTINCT 订单ID)" },
  { "name": "客单价", "formula": "SUM(实付订单) / COUNT(DISTINCT 订单ID)" },
  { "name": "退款率", "formula": "退款订单数 / 订单数" },
  { "name": "活跃用户数", "formula": "COUNT(DISTINCT 用户ID)" }
]
```

### 3. 数据表结构（用于生成验证 SQL）
```json
{{TABLE_SCHEMA}}
```

---

## 归因分析流程

### Step 1：判断分析类型
| 用户问题关键词 | 分析类型 |
|--------------|---------|
| 为什么...下降/上升/变化 | 指标波动归因 |
| 原因/驱动因素/贡献 | 因子拆解 |
| 哪个...影响最大 | 敏感性分析 |

### Step 2：因子拆解
根据指标的数学构成，拆解为可独立查询的**子因子**。

#### 常见拆解模板
| 指标 | 拆解方式 | 子因子 |
|------|---------|--------|
| 销售额 = 订单数 × 客单价 | 乘法拆解 | 订单数变化贡献 + 客单价变化贡献 |
| 转化率 = 下单用户 / 访客数 | 除法拆解 | 分子变化 + 分母变化 |
| 退款率 = 退款订单 / 总订单 | 除法拆解 | 分子变化 + 分母变化 |
| 活跃用户 = 新用户 + 回流用户 + 留存用户 | 加法拆解 | 各用户群贡献 |

### Step 3：生成验证 SQL
对每个子因子，生成 SQLite SQL 查询其当期和前期的值，计算贡献度。

#### 示例：销售额下降归因
指标库 formula = `SUM(实付订单)`，可拆解为：
- 子因子1：订单数 → `COUNT(DISTINCT 订单ID)`
- 子因子2：客单价 → `SUM(实付订单) / COUNT(DISTINCT 订单ID)`

生成 SQL：
```sql
-- 验证：订单数变化
SELECT
  COUNT(DISTINCT CASE WHEN strftime('%Y-%m', 下单时间) = '2025-06' THEN 订单ID END) as 当期订单数,
  COUNT(DISTINCT CASE WHEN strftime('%Y-%m', 下单时间) = '2025-05' THEN 订单ID END) as 前期订单数;

-- 验证：客单价变化
SELECT
  SUM(CASE WHEN strftime('%Y-%m', 下单时间) = '2025-06' THEN 实付订单 ELSE 0 END) * 1.0
    / NULLIF(COUNT(DISTINCT CASE WHEN strftime('%Y-%m', 下单时间) = '2025-06' THEN 订单ID END), 0) as 当期客单价,
  SUM(CASE WHEN strftime('%Y-%m', 下单时间) = '2025-05' THEN 实付订单 ELSE 0 END) * 1.0
    / NULLIF(COUNT(DISTINCT CASE WHEN strftime('%Y-%m', 下单时间) = '2025-05' THEN 订单ID END), 0) as 前期客单价;
```

### Step 4：贡献度计算
使用**差异分解法**计算每个因子的贡献：

```
总变化 = 当期值 - 前期值

对于乘法关系 Y = A × B：
  贡献_A = (A当期 - A前期) × B前期
  贡献_B = A当期 × (B当期 - B前期)
  贡献占比 = 贡献 / |总变化|
```

### Step 5：输出归因报告

```json
{
  "summary": "销售额下降 29%（120万 → 85万），主要由订单数减少驱动（贡献 -18个百分点），客单价小幅下降也有影响（贡献 -11个百分点）。",
  "factors": [
    {
      "name": "订单数",
      "current": 3200,
      "previous": 4500,
      "change": -1300,
      "changeRate": -0.289,
      "contribution": -18.0,
      "contributionPercent": 62.1,
      "impact": "major",
      "diagnosis": "订单数下降是销售额下滑的最大驱动因素，建议排查流量来源是否减少、商品是否缺货。"
    },
    {
      "name": "客单价",
      "current": 265.6,
      "previous": 266.7,
      "change": -1.1,
      "changeRate": -0.004,
      "contribution": -11.0,
      "contributionPercent": 37.9,
      "impact": "minor",
      "diagnosis": "客单价基本持平，略有下降，影响较小。"
    }
  ],
  "recommendations": [
    "优先排查流量渠道变化，确认是否有关键推广活动结束",
    "检查商品库存状态，尤其是热销品的可用库存",
    "分析用户复购率变化，确认是否存在用户流失"
  ],
  "sql": [
    "SELECT ...",
    "SELECT ..."
  ]
}
```

---

## 归因分析完整示例

### 用户提问
"为什么上个月销售额下降了？"

### AI 处理过程

1. **识别意图**：数据解释 → 归因分析
2. **读取指标库**：销售额 formula = `SUM(实付订单)`
3. **拆解因子**：销售额 = 订单数 × 客单价
4. **生成验证 SQL** → 执行查询
5. **计算贡献度**：订单数贡献 62%，客单价贡献 38%
6. **输出归因报告** + 建议

### 最终输出（自然语言 + 表格）

> 📊 **归因分析结果**
>
> 销售额环比下降 **29%**（120万 → 85万），核心原因如下：
>
> | 因子 | 当期值 | 前期值 | 变化率 | 贡献度 |
> |------|--------|--------|--------|--------|
> | 订单数 | 3,200 | 4,500 | **-28.9%** ↓ | **62.1%** |
> | 客单价 | 265.6 | 266.7 | -0.4% | 37.9% |
>
> **结论**：订单数大幅减少是销售额下降的最大驱动因素。
>
> **建议行动**：
> 1. 排查流量渠道变化，确认是否有关键推广活动结束
> 2. 检查商品库存状态
> 3. 分析用户复购率变化

---

## 前端集成伪代码

```javascript
async function performAttribution(metricName, currentTimeRange, previousTimeRange) {
  // 1. 从 localStorage 读取指标库
  const config = JSON.parse(localStorage.getItem('shujian-metrics-config'));
  const targetMetric = config.metrics.find(m => m.name === metricName);

  // 2. 构造 Prompt
  const systemPrompt = `...Skill E 完整内容...`;

  // 3. 注入上下文
  const userInput = JSON.stringify({
    metricName: targetMetric.name,
    metricFormula: targetMetric.formula,
    timeRange: `${previousTimeRange} vs ${currentTimeRange}`,
    // 从指标库中提取可拆解的子指标
    availableMetrics: config.metrics
      .filter(m => m.id !== targetMetric.id)
      .map(m => ({ name: m.name, formula: m.formula }))
  });

  // 4. 调用 LLM
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
  const attribution = JSON.parse(result.choices[0].message.content);

  // 5. 执行归因 SQL 获取实际数据
  const sqlResults = [];
  for (const sql of attribution.sql) {
    const result = db.exec(sql); // sql.js 的 exec 方法
    sqlResults.push(result);
  }

  // 6. 将实际数据回填，重新计算贡献度
  const finalReport = computeContribution(sqlResults, attribution);

  // 7. 渲染归因报告
  renderAttributionReport(finalReport);

  return finalReport;
}

function computeContribution(sqlResults, attribution) {
  // 使用实际查询结果计算各因子贡献度
  // ...数学计算逻辑...
}
```

---

## 注意事项
- 归因分析依赖指标库的**公式可拆解性**。如果 formula 是一个无法拆解的黑盒表达式，归因将失败，此时应提示用户"该指标公式过于复杂，暂不支持自动归因"。
- 归因 SQL 可能涉及多次查询，注意性能。建议合并为一条 SQL（使用 CTE 或子查询）。
- 如果查询结果为空（某个因子无数据），在报告中标注"该因子数据缺失，无法计算贡献度"。
