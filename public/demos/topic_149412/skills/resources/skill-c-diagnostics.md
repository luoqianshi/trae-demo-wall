# Skill C：数据质量诊断建议生成器

## 任务
根据数据质量诊断结果，生成**可执行的 SQLite 修复建议**和**自然语言解释**。

---

## 输入上下文（由前端动态注入）

### 诊断结果数据
```json
{
  "tableName": "orders",
  "totalRows": 15230,
  "totalColumns": 11,
  "completeness": [
    { "field": "phone", "nullCount": 320, "nullRate": 0.021 },
    { "field": "email", "nullCount": 8520, "nullRate": 0.559, "level": "high" }
  ],
  "uniqueness": [
    { "field": "order_id", "duplicateCount": 0, "uniqueRate": 1.0 },
    { "field": "user_id", "duplicateCount": 3200, "uniqueRate": 0.79 }
  ],
  "consistency": [
    { "field": "status", "invalidValues": ["pendingg", "paid", "shippped"], "description": "存在拼写错误的枚举值" },
    { "field": "amount", "outliers": [999999, -500], "description": "存在异常大值和负值" }
  ],
  "format": [
    { "field": "phone", "invalidCount": 45, "description": "手机号非11位" },
    { "field": "email", "invalidCount": 120, "description": "邮箱格式不正确" }
  ]
}
```

---

## 规则

1. **按严重程度排序**：high > medium > low，优先处理高风险问题。
2. **修复建议具体化**：每条建议必须包含：
   - 问题定位（哪张表、哪个字段、多少行）
   - 根因分析（为什么会出现这个问题）
   - SQLite 修复 SQL（UPDATE / DELETE / INSERT）
   - 预防措施（如何避免下次再出现）
3. **SQL 安全**：仅生成 `UPDATE` 或 `DELETE` 语句，**禁止** `DROP` / `ALTER TABLE`。
4. **输出结构**：返回 JSON 数组，每条建议一个对象。

---

## 输出格式

```json
[
  {
    "severity": "high | medium | low",
    "category": "completeness | uniqueness | consistency | format",
    "field": "字段名",
    "issue": "问题简述（自然语言）",
    "affectedRows": 8520,
    "rootCause": "根因分析",
    "fixSQL": "UPDATE orders SET email = NULL WHERE email NOT LIKE '%@%';",
    "prevention": "建议在数据导入时增加邮箱格式校验",
    "naturalLanguage": "检测到 8520 行（55.9%）的 email 字段为空，建议检查数据采集链路是否遗漏..."
  }
]
```

---

## 示例

### 输入
```json
{
  "completeness": [
    { "field": "email", "nullCount": 8520, "nullRate": 0.559, "level": "high" }
  ],
  "format": [
    { "field": "phone", "invalidCount": 45, "description": "手机号非11位或包含非数字字符" }
  ]
}
```

### 输出
```json
[
  {
    "severity": "high",
    "category": "completeness",
    "field": "email",
    "issue": "email 字段空值率高达 55.9%（8520/15230 行）",
    "affectedRows": 8520,
    "rootCause": "数据采集时 email 为非必填项，或上游系统未同步邮箱信息",
    "fixSQL": "-- 将明显无效的邮箱（不含@符号的）统一设为NULL\nUPDATE orders SET email = NULL WHERE email IS NOT NULL AND email NOT LIKE '%@%';",
    "prevention": "建议在数据录入端增加 email 格式校验，并在 ETL 流程中过滤无效值",
    "naturalLanguage": "email 字段超过一半为空，这可能会严重影响用户触达类分析的准确性。建议排查数据采集链路，确认是否有遗漏。"
  },
  {
    "severity": "medium",
    "category": "format",
    "field": "phone",
    "issue": "45 行手机号格式不正确（非11位或含非数字字符）",
    "affectedRows": 45,
    "rootCause": "用户手动输入错误或数据导入时未做格式清洗",
    "fixSQL": "-- 清除格式错误的手机号\nUPDATE orders SET phone = NULL WHERE phone IS NOT NULL AND (LENGTH(phone) != 11 OR phone NOT GLOB '[0-9]*');",
    "prevention": "建议在输入框增加手机号正则校验 ^1[3-9]\\d{9}$",
    "naturalLanguage": "45 条手机号格式异常，可能是用户输入错误或系统导入问题。建议清理后重新采集。"
  }
]
```

---

## 前端集成伪代码

```javascript
async function generateDiagnosticsAdvice(diagnosticResult) {
  const systemPrompt = `...Skill C 完整内容...`;

  const response = await fetch('YOUR_LLM_API', {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(diagnosticResult) }
      ]
    })
  });

  const result = await response.json();
  const advice = JSON.parse(result.choices[0].message.content);

  // 渲染到四宫格的"详细报告"弹窗中
  renderDiagnosticAdvice(advice);
}
```
