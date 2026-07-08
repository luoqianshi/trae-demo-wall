# Data Model

## SQLite Schema

### dishes 表
```sql
CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    price REAL NOT NULL,
    category TEXT NOT NULL,        -- 烧味/点心/汤品/小炒/甜品/主食
    tags TEXT NOT NULL DEFAULT '[]', -- JSON array: ["清淡","招牌"]
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    features TEXT DEFAULT ''
);
```

### order_history 表
```sql
CREATE TABLE IF NOT EXISTS order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_input TEXT NOT NULL,
    recommended_dishes TEXT NOT NULL DEFAULT '[]', -- JSON array
    total_price REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 菜品分类体系

| category | 说明 | 示例 |
|----------|------|------|
| 烧味 | 烤制/卤制肉类 | 白切鸡、烧鹅、叉烧 |
| 点心 | 茶楼点心 | 虾饺、烧卖、肠粉 |
| 汤品 | 老火靓汤/例汤 | 花胶鸡汤、西洋菜猪骨汤 |
| 小炒 | 镬气小炒 | 干炒牛河、蚝油生菜 |
| 甜品 | 广式甜品 | 双皮奶、杨枝甘露 |
| 主食 | 饭/粥/面 | 煲仔饭、艇仔粥 |

## 标签体系

| tag | 含义 |
|-----|------|
| 清淡 | 少油少盐，口味清爽 |
| 辣 | 含辣椒 |
| 甜 | 甜味为主 |
| 招牌 | 店内推荐 |
| 经典 | 传统粤菜 |
| 养生 | 滋补健康 |
| 下饭 | 配饭佳品 |
| 快手 | 出餐快 |
