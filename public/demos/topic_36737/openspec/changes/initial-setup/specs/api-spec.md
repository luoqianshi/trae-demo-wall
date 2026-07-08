# API Specification

## Base URL
`http://localhost:8000`

## Endpoints

### POST /api/recommend
自然语言点餐推荐

**Request:**
```json
{
  "user_input": "2个人吃，预算200元，想吃点清淡的粤菜"
}
```

**Response (200):**
```json
{
  "summary": "为你推荐4道清淡粤菜，适合2人用餐，总价约¥146",
  "recommended_dishes": [
    {
      "id": 7,
      "name": "虾饺皇",
      "price": 38,
      "category": "点心",
      "tags": ["清淡", "招牌", "经典"],
      "description": "水晶虾饺，皮薄馅大，现包现蒸",
      "image_url": "/static/images/07.jpg",
      "features": "现包现蒸",
      "reason": "清淡经典点心，必点之选"
    }
  ],
  "total_price": 146,
  "parsed_intent": {
    "people_count": 2,
    "budget_max": 200.0,
    "taste_preferences": ["清淡"],
    "dish_categories": []
  }
}
```

**Error (422):**
```json
{"detail": [{"loc": ["body", "user_input"], "msg": "field required"}]}
```

---

### GET /api/dishes
获取全部菜品列表

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "白切鸡",
    "price": 68,
    "category": "烧味",
    "tags": ["清淡", "招牌", "经典"],
    "description": "广东传统名菜，皮爽肉滑，蘸姜葱酱食用",
    "image_url": "/static/images/01.jpg",
    "features": "选用清远走地鸡",
    "price_source": "美团/大众点评参考价"
  }
]
```

---

### GET /api/history
获取点餐历史记录

**Response (200):**
```json
[
  {
    "id": 1,
    "user_input": "2个人吃，预算200元",
    "recommended_dishes": "[{\"name\":\"白切鸡\",\"price\":68}]",
    "total_price": 68.0,
    "created_at": "2026-06-09T01:00:00"
  }
]
```

---

### POST /api/history
保存点餐记录

**Request:**
```json
{
  "user_input": "2个人吃，预算200元",
  "recommended_dishes": [{"name": "白切鸡", "price": 68}],
  "total_price": 68
}
```

**Response (200):**
```json
{"id": 1, "message": "保存成功"}
```

---

### GET /api/health
健康检查

**Response (200):**
```json
{"status": "ok"}
```

---

## 数据来源说明
- 菜品价格：参考美团/大众点评广州中档粤菜馆真实价位
- 菜品图片：自生成占位图（渐变底色 + 菜名 + 分类色标签）
- LLM 推荐：基于 DeepSeek/Qwen API 意图解析 + 菜品匹配
