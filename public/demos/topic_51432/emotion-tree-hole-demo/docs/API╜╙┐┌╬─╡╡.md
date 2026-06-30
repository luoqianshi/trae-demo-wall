# 情感树洞 AI - API 接口文档

> 版本：v1.0.0
> 更新日期：2026-06-26
> 基础路径：`http://localhost:3000/api`
> 后端框架：Node.js + Express + MySQL

---

## 一、通用说明

### 1.1 请求规范
- 请求方法：GET / POST
- Content-Type：`application/json`
- 字符编码：UTF-8

### 1.2 统一响应格式

所有接口返回 JSON 格式，结构如下：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 1.3 异常码说明

| code | 含义 | 说明 |
|------|------|------|
| 0 | 成功 | 请求处理成功 |
| 400 | 参数错误 | 请求参数缺失或格式错误 |
| 404 | 资源不存在 | 请求的资源未找到 |
| 500 | 服务器错误 | 服务器内部异常 |

### 1.4 Demo 用户说明
- Demo 阶段支持免密登录，默认使用 `user_id=1` 的测试用户
- 所有需要 `user_id` 参数的接口，若不传则默认使用 `1`

---

## 二、用户相关接口

### 2.1 用户登录

- **接口路径**：`POST /api/user/login`
- **功能说明**：Demo阶段免密登录，根据用户名返回或创建用户

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 否 | 用户名，默认 demo |

**请求示例**：
```json
{
  "username": "demo"
}
```

**响应示例**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "demo",
    "nickname": "Demo用户",
    "avatar": "&#127795;"
  }
}
```

### 2.2 获取用户信息

- **接口路径**：`GET /api/user/info`
- **功能说明**：获取指定用户的基本信息

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "demo",
    "nickname": "Demo用户",
    "avatar": "&#127795;"
  }
}
```

---

## 三、AI 对话接口

### 3.1 获取 AI 回复

- **接口路径**：`POST /api/chat/reply`
- **功能说明**：根据用户输入文本，匹配情绪场景并返回AI回复，同时保存对话记录

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |
| session_id | string | 否 | 会话ID，不传则自动生成 |
| text | string | 是 | 用户消息内容（最多500字） |

**请求示例**：
```json
{
  "user_id": 1,
  "session_id": "session_1719400000000",
  "text": "最近考试压力好大，每天都睡不好"
}
```

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "reply": "学习压力大是很多同学都会遇到的困扰...&#128170;<br><br>试试这样做：...",
    "scene": "study_pressure",
    "scene_name": "学习压力大",
    "session_id": "session_1719400000000"
  }
}
```

**匹配规则说明**：
1. 系统按场景优先级（priority）从高到低匹配
2. 安全场景（情绪低落/depression）优先级100，优先匹配
3. 支持排除关键词机制（如人际关系场景排除家庭关键词）
4. 同一场景避免连续3次重复回复
5. 对话达4轮后，50%概率追加追问话术

### 3.2 获取对话历史

- **接口路径**：`GET /api/chat/history`
- **功能说明**：获取用户的对话历史记录

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |
| session_id | string | 否 | 会话ID，不传则返回所有会话 |
| limit | number | 否 | 返回条数，默认50 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "sender": "user",
      "content": "最近考试压力好大",
      "matched_scene": null,
      "created_at": "2026-06-26T10:00:00.000Z"
    },
    {
      "id": 2,
      "sender": "ai",
      "content": "学习压力大是很多同学都会遇到的困扰...",
      "matched_scene": "study_pressure",
      "created_at": "2026-06-26T10:00:02.000Z"
    }
  ]
}
```

### 3.3 获取对话统计

- **接口路径**：`GET /api/chat/stats`
- **功能说明**：获取用户对话总数统计

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 10,
    "user_count": 5
  }
}
```

---

## 四、情绪记录接口

### 4.1 记录情绪

- **接口路径**：`POST /api/mood/record`
- **功能说明**：记录用户当日情绪，同一天重复记录会更新

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |
| mood_type | string | 是 | 情绪类型：happy/calm/anxious/sad/angry/tired |
| note | string | 否 | 情绪备注（最多500字） |

**情绪类型说明**：

| mood_type | 名称 | 默认分数 |
|-----------|------|----------|
| happy | 开心 | 90 |
| calm | 平静 | 70 |
| anxious | 焦虑 | 40 |
| sad | 难过 | 25 |
| angry | 愤怒 | 20 |
| tired | 疲惫 | 35 |

**请求示例**：
```json
{
  "user_id": 1,
  "mood_type": "anxious",
  "note": "今天考试没考好"
}
```

**响应示例**：
```json
{
  "code": 0,
  "message": "情绪记录成功",
  "data": {
    "mood_type": "anxious",
    "mood_score": 40,
    "mood_name": "焦虑"
  }
}
```

### 4.2 获取情绪趋势

- **接口路径**：`GET /api/mood/trend`
- **功能说明**：获取最近N天的情绪记录，缺失日期用null填充

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |
| days | number | 否 | 天数，默认7 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "date": "2026-06-20",
      "mood_type": "happy",
      "mood_score": 90,
      "mood_name": "开心",
      "note": "今天很开心"
    },
    {
      "date": "2026-06-21",
      "mood_type": null,
      "mood_score": null,
      "mood_name": null,
      "note": null
    }
  ]
}
```

### 4.3 获取情绪统计

- **接口路径**：`GET /api/mood/stats`
- **功能说明**：获取用户情绪类型分布统计

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "mood_type": "happy",
      "mood_name": "开心",
      "count": 3,
      "avg_score": 90
    },
    {
      "mood_type": "anxious",
      "mood_name": "焦虑",
      "count": 2,
      "avg_score": 40
    }
  ]
}
```

---

## 五、AI 绘画接口

### 5.1 生成画作

- **接口路径**：`POST /api/art/generate`
- **功能说明**：根据用户输入的情绪描述，匹配画作模板并返回，同时保存用户画作

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |
| prompt | string | 是 | 情绪描述（最多200字） |

**请求示例**：
```json
{
  "user_id": 1,
  "prompt": "今天阳光明媚，心情很好"
}
```

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "image_url": "assets/art_example2_512x512.jpg",
    "title": "《希望的曙光》",
    "description": "画面中温暖的阳光穿透云层，洒向一片盛开的花海...",
    "category": "positive"
  }
}
```

**匹配规则说明**：
1. 系统6种情绪类别：positive / lonely / calm / anxious / sad / default
2. 统计用户输入中各类别关键词命中数
3. 选择命中数最多的类别，从该类别的画作模板中随机选择
4. 无匹配时使用 default 类别

### 5.2 获取画作历史

- **接口路径**：`GET /api/art/history`
- **功能说明**：获取用户生成的画作历史

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |
| limit | number | 否 | 返回条数，默认20 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "prompt": "今天阳光明媚",
      "image_url": "assets/art_example2_512x512.jpg",
      "title": "《希望的曙光》",
      "description": "画面中温暖的阳光穿透云层...",
      "category": "positive",
      "created_at": "2026-06-26T10:00:00.000Z"
    }
  ]
}
```

---

## 六、成就接口

### 6.1 获取用户成就

- **接口路径**：`GET /api/achievements`
- **功能说明**：获取所有成就及当前用户的解锁进度（实时计算）

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "code": "talker",
      "name": "倾诉达人",
      "description": "完成 5 次 AI 对话",
      "icon": "&#128172;",
      "condition_type": "chat_count",
      "condition_value": 5,
      "current_progress": 3,
      "status": "in_progress",
      "unlocked_at": null,
      "progress_percent": 60
    },
    {
      "id": 2,
      "code": "artist",
      "name": "艺术疗愈师",
      "description": "生成 3 幅情绪画作",
      "icon": "&#127912;",
      "condition_type": "art_count",
      "condition_value": 3,
      "current_progress": 3,
      "status": "unlocked",
      "unlocked_at": "2026-06-26T10:00:00.000Z",
      "progress_percent": 100
    }
  ]
}
```

**成就说明**：

| code | name | condition_type | condition_value |
|------|------|----------------|-----------------|
| talker | 倾诉达人 | chat_count | 5 |
| artist | 艺术疗愈师 | art_count | 3 |
| recorder | 情绪记录者 | mood_streak | 7 |

---

## 七、用户见证接口

### 7.1 获取用户见证

- **接口路径**：`GET /api/testimonials`
- **功能说明**：获取产品介绍页展示的用户见证列表

**请求参数**：无

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "user_name": "小雨",
      "user_role": "高一学生",
      "avatar_emoji": "&#128103;",
      "content": "以前遇到烦心事只能憋在心里...",
      "rating": 5,
      "usage_duration": "使用2周"
    }
  ]
}
```

---

## 八、统计接口

### 8.1 获取统计指标

- **接口路径**：`GET /api/statistics`
- **功能说明**：获取产品级统计指标（用于介绍页展示）

**请求参数**：无

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "metric_key": "satisfaction",
      "metric_name": "用户满意度",
      "metric_value": "98%"
    },
    {
      "metric_key": "users",
      "metric_name": "内测用户",
      "metric_value": "5,200+"
    }
  ]
}
```

### 8.2 获取用户仪表盘

- **接口路径**：`GET /api/dashboard`
- **功能说明**：获取用户个人中心的仪表盘统计数据

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 否 | 用户ID，默认1 |

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "chat_count": 10,
    "art_count": 3,
    "mood_days": 5,
    "unlocked_achievements": 1,
    "latest_mood": {
      "mood_type": "happy",
      "mood_score": 90,
      "record_date": "2026-06-26"
    }
  }
}
```

### 8.3 获取平台汇总统计

- **接口路径**：`GET /api/stats/summary`
- **功能说明**：获取平台整体统计数据（用于宣传页 emotion-tree-hole.html 的数据汇总展示，含满意度、用户数、对话数、画作数）

**请求参数**：无

**响应示例**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "satisfaction_rate": "98%",
    "total_users": "5,200+",
    "total_chats": "12,000+",
    "total_arts": "3,500+"
  }
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| satisfaction_rate | string | 用户满意度，优先取 statistics 表 metric_key='satisfaction_rate'，默认 98% |
| total_users | string | 内测用户数，优先取 statistics 表配置，否则实时聚合 users 表 + 基础值 5200 |
| total_chats | string | 倾诉对话数，优先取 statistics 表配置，否则实时聚合 chat_messages 表 + 基础值 12000 |
| total_arts | string | 治愈画作数，优先取 statistics 表配置，否则实时聚合 artworks 表 + 基础值 3500 |

---

## 九、其他接口

### 9.1 健康检查

- **接口路径**：`GET /health`
- **功能说明**：检查服务是否正常运行

**响应示例**：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "running",
    "time": "2026-06-26T10:00:00.000Z"
  }
}
```

---

## 十、启动说明

1. **执行数据库脚本**：在 MySQL 中执行 `db/emotree.sql`
2. **配置数据库连接**：复制 `server/.env.example` 为 `server/.env`，修改数据库密码
3. **安装依赖**：在 `server` 目录执行 `npm install`
4. **启动服务**：在 `server` 目录执行 `npm start`
5. **验证服务**：访问 `http://localhost:3000/health`
