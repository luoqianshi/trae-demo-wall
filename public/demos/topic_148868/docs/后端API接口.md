# 成长漂流瓶 — 后端 API 接口文档

## 项目说明

- **服务端口**：4736（默认，可通过环境变量 PORT 覆盖）
- **本地地址**：http://localhost:4736
- **测试账号**：demo / 123456
- **数据库**：SQLite（better-sqlite3 驱动）
- **前端页面托管**：自动托管 `dist` 目录静态资源，非 API 的 GET 请求统一返回 `index.html`

## 统一响应格式

所有 API 接口均返回如下统一 JSON 格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| code | number | 状态码。`0` 表示成功，`1` 表示失败 |
| message | string | 提示消息 |
| data | any | 业务数据（失败时为 `null`） |

- 成功响应 HTTP 状态码为 200
- 失败响应 HTTP 状态码通常为 400（参数错误）、404（资源不存在）、500（服务器错误）

## 通用参数说明

- 凡涉及用户操作的接口，均需在 query 或 body 中携带 `userId`
- 日期格式统一为 `YYYY-MM-DD`（如 `2026-07-07`）
- 月份参数 `month` 在 URL 中为 1-12，后端会自动转换为 0-11 内部处理

---

## 一、用户认证模块

### 1.1 健康检查

- **方法**：GET
- **路径**：`/api/health`
- **说明**：检查服务是否在线
- **请求参数**：无
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "status": "ok",
    "timestamp": "2026-07-07T08:00:00.000Z"
  }
}
```

### 1.2 用户注册

- **方法**：POST
- **路径**：`/api/register`
- **说明**：注册新用户
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名（2-20 位字母、数字、下划线或中文） |
| password | string | 是 | 密码（至少 6 位） |
| email | string | 否 | 邮箱 |
| nickname | string | 否 | 昵称 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "new@example.com",
    "nickname": "新用户",
    "avatar": "./assets/image_1_r4t3u4.jpg",
    "level": 1,
    "xp": 0,
    "bio": "",
    "created_at": "2026-07-07 08:00:00",
    "updated_at": "2026-07-07 08:00:00"
  }
}
```

### 1.3 用户登录

- **方法**：POST
- **路径**：`/api/login`
- **说明**：用户登录
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "demo",
    "email": "demo@example.com",
    "nickname": "演示账号",
    "avatar": "./assets/image_1_r4t3u4.jpg",
    "level": 1,
    "xp": 0,
    "bio": ""
  }
}
```

### 1.4 忘记密码（重置密码）

- **方法**：POST
- **路径**：`/api/forgot-password`
- **说明**：通过用户名或邮箱重置密码
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| identifier | string | 是 | 用户名或邮箱 |
| newPassword | string | 是 | 新密码（至少 6 位） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "密码重置成功",
  "data": null
}
```

### 1.5 获取用户信息

- **方法**：GET
- **路径**：`/api/user/profile`
- **说明**：获取指定用户的基本信息
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": 1,
    "username": "demo",
    "nickname": "演示账号",
    "avatar": "./assets/image_1_r4t3u4.jpg",
    "level": 1,
    "xp": 0,
    "bio": ""
  }
}
```

### 1.6 更新用户信息

- **方法**：PUT
- **路径**：`/api/user/profile`
- **说明**：更新用户昵称、邮箱、简介、头像
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 用户 ID |
| nickname | string | 否 | 昵称 |
| email | string | 否 | 邮箱 |
| bio | string | 否 | 个人简介 |
| avatar | string | 否 | 头像路径 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": 1, "username": "demo", "nickname": "新昵称" }
}
```

### 1.7 修改密码

- **方法**：POST
- **路径**：`/api/user/change-password`
- **说明**：通过原密码修改为新密码
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | number | 是 | 用户 ID |
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码（至少 6 位） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "密码修改成功",
  "data": null
}
```

---

## 二、文件上传模块

### 上传图片

- **方法**：POST
- **路径**：`/api/upload`
- **说明**：上传 base64 编码的图片到服务器，返回相对路径用于数据库存储和前端渲染
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| image | string | 是 | base64 编码的图片数据 |
| folder | string | 否 | 子目录名（如 avatar、checkin） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "path": "/uploads/xxx.jpg"
  }
}
```

### 删除图片

- **方法**：DELETE
- **路径**：`/api/upload`
- **说明**：删除已上传的图片
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| path | string | 是 | 图片相对路径 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

---

## 三、搭子模块

### 获取搭子列表（找搭子页用）

- **方法**：GET
- **路径**：`/api/users/partners`
- **说明**：获取搭子匹配列表（真实用户数据），排除当前用户自己
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 当前用户 ID（用于排除自己） |

- **响应示例**：返回搭子用户列表（含 id、username、nickname、avatar、bio 等）

### 发送搭子申请

- **方法**：POST
- **路径**：`/api/partners/request`
- **说明**：向对方发送搭子申请消息（type='partner'），对方在消息中心接受/拒绝。不能和自己结伴，不能重复申请
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 当前用户 ID |
| partnerId | number | 是 | 对方用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "申请已发送，等待对方同意",
  "data": null
}
```

### 接受搭子申请

- **方法**：POST
- **路径**：`/api/partners/accept-request`
- **说明**：由接收方点击，从消息中解析申请方 ID，创建双向搭子关系，标记消息已读，并通知申请方
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| messageId | number | 是 | 搭子申请消息 ID |
| userId | number | 是 | 当前用户 ID（接收方） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "结伴成功",
  "data": {
    "partnerId": 2,
    "partnerName": "新用户"
  }
}
```

### 直接接受结伴（无需申请）

- **方法**：POST
- **路径**：`/api/partners/accept`
- **说明**：直接创建双向搭子关系（用于老版本兼容）
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 当前用户 ID |
| partnerId | number | 是 | 搭子用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "结伴成功",
  "data": {
    "partnerId": 2,
    "partnerName": "新用户"
  }
}
```

### 获取我的搭子列表

- **方法**：GET
- **路径**：`/api/partners/my`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：返回搭子列表（含 id、username、nickname、avatar、bio 等）

### 移除搭子关系

- **方法**：DELETE
- **路径**：`/api/partners/remove`
- **说明**：双向删除搭子关系
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 当前用户 ID |
| partnerId | number | 是 | 搭子用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "已移除搭子",
  "data": null
}
```

### 发送私信给搭子

- **方法**：POST
- **路径**：`/api/messages/dm`
- **说明**：只能给搭子发私信，会创建一条 type='partner' 的消息
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 当前用户 ID |
| partnerId | number | 是 | 搭子用户 ID |
| content | string | 是 | 消息内容 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "已发送",
  "data": null
}
```

---

## 四、任务模块

### 2.1 获取用户任务列表

- **方法**：GET
- **路径**：`/api/tasks`
- **说明**：获取用户所有任务（排除已软删除）
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "阅读 30 分钟",
      "category": "学习",
      "frequency": "每日",
      "status": 0,
      "task_date": "2026-07-07",
      "is_cancelled": 0,
      "is_deleted": 0
    }
  ]
}
```

### 2.2 获取今日任务

- **方法**：GET
- **路径**：`/api/tasks/today`
- **说明**：获取今日（按 task_date 过滤）未取消、未删除的任务
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：同 2.1

### 2.3 创建任务

- **方法**：POST
- **路径**：`/api/tasks`
- **说明**：创建新任务，自动更新当日每日统计
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| title | string | 是 | 任务标题 |
| description | string | 否 | 任务描述 |
| category | string | 否 | 分类（默认"其他"） |
| frequency | string | 否 | 频率（默认"每日"） |
| reminderTime | string | 否 | 提醒时间 |
| showInOcean | boolean | 否 | 是否在漂流海洋展示 |
| taskDate | string | 否 | 任务日期 YYYY-MM-DD（默认今天） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "任务创建成功",
  "data": {
    "id": 10,
    "user_id": 1,
    "title": "阅读 30 分钟",
    "task_date": "2026-07-07",
    "status": 0
  }
}
```

### 2.4 更新任务

- **方法**：PUT
- **路径**：`/api/tasks/:id`
- **说明**：更新任务字段，自动同步每日统计
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 否 | 任务标题 |
| description | string | 否 | 任务描述 |
| category | string | 否 | 分类 |
| frequency | string | 否 | 频率 |
| reminderTime | string | 否 | 提醒时间 |
| status | number | 否 | 状态 |
| showInOcean | boolean | 否 | 是否在漂流海洋展示 |
| taskDate | string | 否 | 任务日期 |
| completionNote | string | 否 | 完成感受 |
| completionImages | string[] \| string | 否 | 完成图片（数组或 JSON 字符串） |
| isCancelled | boolean | 否 | 是否取消 |
| isDeleted | boolean | 否 | 是否软删除 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": { "id": 1, "title": "更新后的标题" }
}
```

### 2.5 删除任务

- **方法**：DELETE
- **路径**：`/api/tasks/:id`
- **说明**：物理删除任务
- **响应示例**：

```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

### 2.6 切换任务完成状态

- **方法**：POST
- **路径**：`/api/tasks/:id/toggle`
- **说明**：将任务标记为已完成（仅支持 待完成 → 已完成，不可撤回）。同时支持写入完成感受和完成图片，并通过成长任务系统发放经验（condition_type: `daily_task_complete`），含每日经验上限校验
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| completionNote | string | 否 | 完成感受 |
| completionImages | string[] | 否 | 完成图片链接数组（多张） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "任务已完成",
  "data": {
    "id": 1,
    "title": "阅读 30 分钟",
    "status": 1,
    "completed_at": "2026-07-07 08:00:00",
    "completion_note": "今天读了 35 分钟",
    "xpGained": 10,
    "newxp": 50,
    "newLevel": 1,
    "levelUp": false,
    "awarded": true
  }
}
```

> 字段说明：`xpGained` 本次实际获得经验；`newxp` 新总经验；`newLevel` 新等级；`levelUp` 是否升级；`awarded` 是否成功发放（达每日上限时为 false）

### 2.7 按日期获取任务

- **方法**：GET
- **路径**：`/api/tasks/date`
- **说明**：获取指定日期的任务列表（排除已取消、已删除）
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| date | string | 是 | 日期 YYYY-MM-DD |

- **响应示例**：同 2.1

### 2.8 获取某月有任务的日期

- **方法**：GET
- **路径**：`/api/tasks/month-dates`
- **说明**：返回某月每日有任务的日期及数量，用于日历打卡点渲染
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| year | number | 是 | 年（如 2026） |
| month | number | 是 | 月（1-12） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    { "date": "2026-07-01", "count": 3 },
    { "date": "2026-07-02", "count": 5 }
  ]
}
```

### 2.9 获取漂流海洋任务

- **方法**：GET
- **路径**：`/api/tasks/ocean`
- **说明**：获取所有用户设置为"在漂流海洋展示"的任务（show_in_ocean=1），用于海洋页卡片展示和捞瓶功能
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "title": "晨间冥想",
        "category": "生活",
        "show_in_ocean": 1,
        "nickname": "演示账号",
        "avatar": "./assets/image_1_r4t3u4.jpg"
      }
    ],
    "total": 1
  }
}
```

### 2.10 任务点赞

- **方法**：POST
- **路径**：`/api/tasks/:id/like`
- **说明**：切换点赞（已赞则取消）
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "点赞成功",
  "data": {
    "liked": true,
    "likes_count": 6
  }
}
```

### 2.11 获取任务评论列表

- **方法**：GET
- **路径**：`/api/tasks/:id/comments`
- **响应示例**：返回评论列表（含 user_name、user_avatar、content、created_at）

### 2.12 创建任务评论

- **方法**：POST
- **路径**：`/api/tasks/:id/comments`
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| content | string | 是 | 评论内容 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "评论成功",
  "data": {
    "id": 1,
    "user_name": "demo",
    "content": "很棒！",
    "created_at": "2026-07-07 08:00:00"
  }
}
```

---

## 五、每日统计模块

### 3.1 获取某日任务统计

- **方法**：GET
- **路径**：`/api/stats/daily`
- **说明**：返回某日的任务总数、完成数、发布漂流瓶数。接口会先刷新该日统计再返回
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| date | string | 是 | 日期 YYYY-MM-DD |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "user_id": 1,
    "task_date": "2026-07-07",
    "total_tasks": 5,
    "completed_tasks": 3,
    "published_bottles": 1
  }
}
```

### 3.2 获取某月每日统计

- **方法**：GET
- **路径**：`/api/stats/monthly-daily`
- **说明**：返回某月每日统计列表，用于月度日历和统计图表
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| year | number | 是 | 年 |
| month | number | 是 | 月（1-12） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    { "task_date": "2026-07-01", "total_tasks": 5, "completed_tasks": 5, "published_bottles": 0 },
    { "task_date": "2026-07-02", "total_tasks": 4, "completed_tasks": 2, "published_bottles": 1 }
  ]
}
```

### 3.3 获取本周每日统计

- **方法**：GET
- **路径**：`/api/stats/weekly-daily`
- **说明**：返回本周（周一到周日）每日统计列表
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：同 3.2（仅返回本周数据）

---

## 六、打卡模块

### 4.1 创建打卡

- **方法**：POST
- **路径**：`/api/checkins`
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| taskId | number | 否 | 关联任务 ID |
| date | string | 是 | 打卡日期 YYYY-MM-DD |
| note | string | 否 | 备注 |
| image | string | 否 | 图片链接 |
| mood | string | 否 | 心情 |
| published | number | 否 | 是否公开 |
| bottleId | number | 否 | 关联漂流瓶 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "打卡成功",
  "data": { "id": 1, "user_id": 1, "date": "2026-07-07", "note": "今天很棒" }
}
```

### 4.2 获取用户打卡记录

- **方法**：GET
- **路径**：`/api/checkins`
- **请求参数（query）**：`userId`
- **响应示例**：返回打卡记录列表

### 4.3 获取指定日期打卡

- **方法**：GET
- **路径**：`/api/checkins/date`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| date | string | 是 | 日期 YYYY-MM-DD |

### 4.4 获取打卡历史

- **方法**：GET
- **路径**：`/api/checkins/history`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| limit | number | 否 | 最近天数，默认 30 |

### 4.5 获取连续打卡天数

- **方法**：GET
- **路径**：`/api/checkins/streak`
- **请求参数（query）**：`userId`
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { "streak": 7 }
}
```

---

## 七、漂流瓶模块

### 5.1 获取漂流瓶列表（分页）

- **方法**：GET
- **路径**：`/api/bottles`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [
      { "id": 1, "content": "今天完成了阅读", "likes_count": 5, "comments_count": 2 }
    ],
    "total": 100
  }
}
```

### 5.2 获取漂流瓶详情

- **方法**：GET
- **路径**：`/api/bottles/:id`
- **响应示例**：返回单个漂流瓶完整信息

### 5.3 创建漂流瓶

- **方法**：POST
- **路径**：`/api/bottles`
- **说明**：发布漂流瓶，自动更新当日每日统计（published_bottles +1），并通过成长任务系统发放经验（condition_type: `daily_publish_bottle`）
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| content | string | 是 | 漂流瓶内容 |
| image | string | 否 | 图片链接 |
| mood | string | 否 | 心情 |
| tag | string | 否 | 标签 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "发布成功",
  "data": {
    "id": 10,
    "content": "今天完成了阅读",
    "xpGained": 20,
    "awarded": true
  }
}
```

### 5.4 删除漂流瓶

- **方法**：DELETE
- **路径**：`/api/bottles/:id`
- **说明**：软删除（状态置为 `removed`）

### 5.5 切换点赞

- **方法**：POST
- **路径**：`/api/bottles/:id/like`
- **说明**：已赞则取消，未赞则点赞。仅在点赞成功时通过成长任务系统发放经验（condition_type: `daily_like`）
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "点赞成功",
  "data": {
    "liked": true,
    "likes_count": 6,
    "xpGained": 5,
    "awarded": true
  }
}
```

### 5.6 获取评论列表

- **方法**：GET
- **路径**：`/api/bottles/:id/comments`
- **响应示例**：返回该漂流瓶的所有评论

### 5.7 创建评论

- **方法**：POST
- **路径**：`/api/bottles/:id/comments`
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| content | string | 是 | 评论内容 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "评论成功",
  "data": { "id": 1, "content": "很棒！", "user_name": "demo" }
}
```

### 5.8 获取用户发布的漂流瓶

- **方法**：GET
- **路径**：`/api/bottles/my/:userId`
- **说明**：获取指定用户发布的漂流瓶列表，按时间倒序
- **路径参数**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：返回该用户发布的漂流瓶列表

### 5.9 获取用户收藏的漂流瓶

- **方法**：GET
- **路径**：`/api/bottles/favorites/:userId`
- **说明**：获取指定用户收藏的漂流瓶列表。若原漂流瓶被作者删除（status=removed），返回的记录中会标记为已下架，前端以灰色样式展示
- **路径参数**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：返回该用户收藏的漂流瓶列表

### 5.10 切换漂流瓶收藏

- **方法**：POST
- **路径**：`/api/bottles/:id/favorite`
- **说明**：已收藏则取消，未收藏则收藏
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "收藏成功",
  "data": { "favorited": true }
}
```

### 5.11 检查是否已收藏

- **方法**：GET
- **路径**：`/api/bottles/:id/favorite`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { "favorited": false }
}
```

---

## 八、挑战模块

### 6.1 获取所有挑战

- **方法**：GET
- **路径**：`/api/challenges`
- **响应示例**：返回所有挑战列表

### 6.2 获取用户参加的挑战

- **方法**：GET
- **路径**：`/api/challenges/user/:userId`
- **响应示例**：返回该用户参与的挑战列表（含挑战详情和参与进度）

### 6.3 获取挑战详情

- **方法**：GET
- **路径**：`/api/challenges/:id`

### 6.4 加入挑战

- **方法**：POST
- **路径**：`/api/challenges/:id/join`
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "加入成功",
  "data": { "challenge_id": 1, "user_id": 1, "progress": 0, "current_day": 1 }
}
```

### 6.5 获取排行榜

- **方法**：GET
- **路径**：`/api/challenges/:id/ranking`
- **响应示例**：返回该挑战的参与者排行榜（按进度降序）

### 6.6 获取参与状态

- **方法**：GET
- **路径**：`/api/challenges/:id/participant`
- **请求参数（query）**：`userId`
- **响应示例**：返回参与记录（未参与则为 `null`）

### 6.7 挑战打卡

- **方法**：POST
- **路径**：`/api/challenges/:id/checkin`
- **说明**：每日仅可打卡一次，自动更新进度和当前天数
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "挑战打卡成功",
  "data": {
    "progress": 14,
    "current_day": 3,
    "completed": false,
    "participant": { "id": 1, "progress": 14, "current_day": 3 }
  }
}
```

### 6.8 获取用户所有挑战打卡记录

- **方法**：GET
- **路径**：`/api/challenges/checkins/all`
- **说明**：获取用户参与的所有挑战的打卡记录，用于记忆时间线
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：返回打卡记录列表，含挑战标题、打卡时间、第几天

### 6.9 获取用户往期挑战

- **方法**：GET
- **路径**：`/api/challenges/my/past`
- **说明**：获取用户已完成的挑战（成功和失败），含统计信息
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "list": [],
    "success_count": 2,
    "failed_count": 1
  }
}
```

### 6.10 获取挑战动态

- **方法**：GET
- **路径**：`/api/challenges/:id/moments`
- **说明**：获取指定挑战的营友动态列表
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 否 | 当前用户 ID（用于判断是否已点赞） |
| limit | number | 否 | 限制条数，默认 20，最大 100 |
| offset | number | 否 | 偏移量，默认 0 |

- **响应示例**：返回动态列表，含发布者信息、内容、点赞数、是否已点赞

### 6.11 切换挑战动态点赞

- **方法**：POST
- **路径**：`/api/challenges/moments/:momentId/like`
- **说明**：已赞则取消，未赞则点赞
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "点赞成功",
  "data": { "liked": true, "likes_count": 5 }
}
```

### 6.12 获取所有挑战动态

- **方法**：GET
- **路径**：`/api/challenges/moments`
- **说明**：获取所有挑战的营友动态流（不限挑战）
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 否 | 当前用户 ID（用于判断是否已点赞） |
| limit | number | 否 | 限制条数，默认 20，最大 100 |
| offset | number | 否 | 偏移量，默认 0 |

- **响应示例**：返回动态列表

---

## 九、时间胶囊模块

### 7.1 获取可开启的胶囊

- **方法**：GET
- **路径**：`/api/capsules/openable`
- **说明**：返回开启日期已到且未开启的胶囊
- **请求参数（query）**：`userId`

### 7.2 获取用户胶囊列表

- **方法**：GET
- **路径**：`/api/capsules`
- **请求参数（query）**：`userId`

### 7.3 获取胶囊详情

- **方法**：GET
- **路径**：`/api/capsules/:id`

### 7.4 创建胶囊

- **方法**：POST
- **路径**：`/api/capsules`
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| title | string | 是 | 胶囊标题 |
| content | string | 否 | 胶囊内容 |
| voiceNote | string | 否 | 语音备注 |
| openDate | string | 是 | 开启日期 YYYY-MM-DD |

- **响应示例**：

```json
{
  "code": 0,
  "message": "胶囊创建成功",
  "data": { "id": 1, "title": "给一年后的自己", "status": "sealed" }
}
```

### 7.5 开启胶囊

- **方法**：POST
- **路径**：`/api/capsules/:id/open`
- **说明**：仅当开启日期已到且未开启时可调用
- **响应示例**：

```json
{
  "code": 0,
  "message": "开启成功",
  "data": { "id": 1, "status": "opened", "opened_at": "2026-07-07 08:00:00" }
}
```

### 7.6 删除胶囊

- **方法**：DELETE
- **路径**：`/api/capsules/:id`
- **说明**：删除胶囊，含归属权校验（只能删除自己的胶囊）
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "删除成功",
  "data": {
    "deleted": true
  }
}
```

---

## 十、消息模块

### 8.1 获取未读数量

- **方法**：GET
- **路径**：`/api/messages/unread`
- **请求参数（query）**：`userId`
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { "count": 5 }
}
```

### 8.2 按类型获取消息

- **方法**：GET
- **路径**：`/api/messages/type`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| type | string | 是 | 消息类型 |

### 8.3 获取用户消息

- **方法**：GET
- **路径**：`/api/messages`
- **请求参数（query）**：`userId`

### 8.4 全部已读

- **方法**：PUT
- **路径**：`/api/messages/read-all`
- **请求参数（query）**：`userId`
- **响应示例**：

```json
{
  "code": 0,
  "message": "全部已读",
  "data": null
}
```

### 8.5 标记消息已读

- **方法**：PUT
- **路径**：`/api/messages/:id/read`
- **响应示例**：

```json
{
  "code": 0,
  "message": "已标记已读",
  "data": null
}
```

---

## 十一、徽章模块

### 9.1 获取所有徽章

- **方法**：GET
- **路径**：`/api/badges`
- **响应示例**：返回系统所有徽章定义

### 9.2 获取用户徽章

- **方法**：GET
- **路径**：`/api/badges/user/:userId`
- **响应示例**：返回该用户已获得的徽章列表

### 9.3 授予徽章

- **方法**：POST
- **路径**：`/api/badges/award`
- **说明**：向用户授予指定徽章。若用户已拥有该徽章，返回成功但不重复授予
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| badgeId | number | 是 | 徽章 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "徽章授予成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "badge_id": 3,
    "earned_at": "2026-07-08 08:00:00"
  }
}
```

---

## 十二、专注记录模块

### 10.1 创建专注记录

- **方法**：POST
- **路径**：`/api/focus`
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| durationMinutes | number | 是 | 专注时长（分钟） |
| taskName | string | 否 | 任务名称 |
| completed | boolean | 否 | 是否完成 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "专注记录已保存",
  "data": { "id": 1, "duration_minutes": 25, "completed": 1 }
}
```

### 10.2 获取专注统计

- **方法**：GET
- **路径**：`/api/focus/stats`
- **请求参数（query）**：`userId`
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "total_sessions": 10,
    "total_minutes": 250,
    "completed_sessions": 8
  }
}
```

### 10.3 获取专注记录

- **方法**：GET
- **路径**：`/api/focus`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| limit | number | 否 | 限制条数，默认 100 |

---

## 十三、统计模块

### 11.1 获取用户主页统计

- **方法**：GET
- **路径**：`/api/stats/profile`
- **说明**：返回累计打卡数、漂流瓶数、点赞数、打卡热力图、本月打卡数
- **请求参数（query）**：`userId`
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "totalCheckins": 50,
    "totalBottles": 12,
    "totalLikes": 35,
    "heatmap": [
      { "date": "2026-07-01", "count": 1 },
      { "date": "2026-07-02", "count": 2 }
    ],
    "monthCheckins": 10
  }
}
```

### 11.2 获取今日页统计

- **方法**：GET
- **路径**：`/api/stats/today`
- **请求参数（query）**：`userId`
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "tasks": { "total": 5, "completed": 3, "pending": 2 },
    "streak": 7,
    "level": { "level": 1, "xp": 50 }
  }
}
```

### 11.3 获取周报数据

- **方法**：GET
- **路径**：`/api/stats/weekly`
- **请求参数（query）**：`userId`
- **响应示例**：返回最近 8 周的周统计数据列表

---

## 十四、等级系统模块

### 12.1 获取用户等级信息

- **方法**：GET
- **路径**：`/api/level/info`
- **说明**：返回用户等级、经验、当前等级配置及下一等级配置。老用户首次访问会自动创建等级记录
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "total_xp": 500,
    "current_level": 2,
    "daily_xp_cap": 200,
    "today_xp_gained": 50,
    "today_date": "2026-07-07",
    "current_title": "蓝海螺",
    "current_icon": "snail",
    "current_color": "#4ACD8B",
    "current_desc": "听到海洋声音的蓝海螺",
    "next_level": 3,
    "next_title": "海马骑士",
    "next_icon": "fish",
    "next_required_xp": 1500
  }
}
```

### 12.2 获取所有等级配置

- **方法**：GET
- **路径**：`/api/level/configs`
- **说明**：返回系统全部等级配置（按 level 升序）
- **请求参数**：无
- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    { "level": 1, "title": "小贝壳", "icon": "shell", "color": "#4ACD8B", "required_xp": 0, "description": "初入海洋的小贝壳，开始成长之旅" },
    { "level": 2, "title": "蓝海螺", "icon": "snail", "color": "#4ACD8B", "required_xp": 500, "description": "听到海洋声音的蓝海螺" }
  ]
}
```

### 12.3 获取成长任务列表

- **方法**：GET
- **路径**：`/api/level/growth-tasks`
- **说明**：返回所有启用的成长任务，可按分类过滤
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| category | string | 否 | 分类：`daily`（每日任务）或 `cumulative`（累计任务） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "title": "今日完成一项任务",
      "description": "完成今日任意一项任务",
      "category": "daily",
      "condition_type": "daily_task_complete",
      "condition_value": "1",
      "xp_reward": 10,
      "is_active": 1
    },
    {
      "id": 5,
      "title": "连续签到1天",
      "description": "连续打卡1天",
      "category": "cumulative",
      "condition_type": "checkin_streak",
      "condition_value": "1",
      "xp_reward": 10,
      "is_active": 1
    }
  ]
}
```

### 12.4 获取用户经验日志

- **方法**：GET
- **路径**：`/api/level/growth-logs`
- **说明**：返回用户经验获取日志（按时间倒序，分页）
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| limit | number | 否 | 限制条数，默认 50 |
| offset | number | 否 | 偏移量，默认 0 |

- **响应示例**：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "growth_task_id": 1,
      "xp_gained": 10,
      "source_type": "task",
      "source_id": 5,
      "note": "完成任务: 阅读 30 分钟",
      "created_at": "2026-07-07 08:00:00",
      "task_title": "今日完成一项任务",
      "task_category": "daily",
      "task_icon": null
    }
  ]
}
```

---

## 十五、意见反馈模块

### 13.1 提交意见反馈

- **方法**：POST
- **路径**：`/api/feedback`
- **说明**：用户提交意见反馈，内容必填，联系方式可选
- **请求体（body）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |
| content | string | 是 | 反馈内容 |
| contact | string | 否 | 联系方式（邮箱或手机号） |

- **响应示例**：

```json
{
  "code": 0,
  "message": "提交成功，感谢您的反馈",
  "data": {
    "id": 1,
    "user_id": 1,
    "content": "希望增加深色模式",
    "contact": "demo@example.com"
  }
}
```

### 13.2 获取用户反馈列表

- **方法**：GET
- **路径**：`/api/feedback`
- **请求参数（query）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 用户 ID |

- **响应示例**：返回该用户的反馈列表

---

## 等级系统经验发放机制说明

### 经验发放触发点

| 行为 | condition_type | source_type | 经验奖励 |
| --- | --- | --- | --- |
| 完成任务（toggle） | daily_task_complete | task | 10 |
| 发布漂流瓶 | daily_publish_bottle | bottle | 20 |
| 点赞漂流瓶（仅点赞成功） | daily_like | bottle | 5 |

### 每日经验上限机制

- **每日上限**：默认 200 XP（`user_levels.daily_xp_cap`）
- **跨天重置**：每日首次发放经验时，若 `today_date` 不是今天，自动将 `today_xp_gained` 重置为 0
- **达上限处理**：当日累计经验达到上限后，仍会记录日志（`xp_gained = 0`），但不再发放实际经验，接口返回 `awarded: false`
- **等级计算**：每次发放经验后，根据 `total_xp` 在 `level_config` 中查找 `required_xp <= total_xp` 的最高等级，自动更新 `current_level`
- **数据同步**：等级和经验会同时同步到 `users` 表的 `level` 和 `xp` 字段，保持一致性

### 响应中的经验字段说明

完成任务、发布漂流瓶、点赞漂流瓶接口的响应中包含以下经验字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| xpGained | number | 本次实际获得经验（达上限时为 0） |
| awarded | boolean | 是否成功发放经验（达上限时为 false） |
| newxp | number | 新的累计总经验（仅 toggle 接口返回） |
| newLevel | number | 新等级（仅 toggle 接口返回） |
| levelUp | boolean | 是否升级（仅 toggle 接口返回） |

---

## 附：API 端点速查表

| 模块 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 认证 | GET | /api/health | 健康检查 |
| 认证 | POST | /api/register | 用户注册 |
| 认证 | POST | /api/login | 用户登录 |
| 认证 | POST | /api/forgot-password | 忘记密码 |
| 认证 | GET | /api/user/profile | 获取用户信息 |
| 认证 | PUT | /api/user/profile | 更新用户信息 |
| 认证 | POST | /api/user/change-password | 修改密码 |
| 文件上传 | POST | /api/upload | 上传图片 |
| 文件上传 | DELETE | /api/upload | 删除图片 |
| 搭子 | GET | /api/users/partners | 获取搭子列表（找搭子页用） |
| 搭子 | POST | /api/partners/request | 发送搭子申请 |
| 搭子 | POST | /api/partners/accept-request | 接受搭子申请 |
| 搭子 | POST | /api/partners/accept | 直接接受结伴（无需申请） |
| 搭子 | GET | /api/partners/my | 获取我的搭子列表 |
| 搭子 | DELETE | /api/partners/remove | 移除搭子关系 |
| 搭子 | POST | /api/messages/dm | 发送私信给搭子 |
| 任务 | GET | /api/tasks | 获取用户任务列表 |
| 任务 | GET | /api/tasks/today | 获取今日任务 |
| 任务 | POST | /api/tasks | 创建任务 |
| 任务 | PUT | /api/tasks/:id | 更新任务 |
| 任务 | DELETE | /api/tasks/:id | 删除任务 |
| 任务 | POST | /api/tasks/:id/toggle | 切换任务完成状态 |
| 任务 | GET | /api/tasks/date | 按日期获取任务 |
| 任务 | GET | /api/tasks/month-dates | 获取某月有任务的日期 |
| 任务 | GET | /api/tasks/ocean | 获取漂流海洋任务 |
| 任务 | POST | /api/tasks/:id/like | 任务点赞 |
| 任务 | GET | /api/tasks/:id/comments | 获取任务评论列表 |
| 任务 | POST | /api/tasks/:id/comments | 创建任务评论 |
| 每日统计 | GET | /api/stats/daily | 获取某日任务统计 |
| 每日统计 | GET | /api/stats/monthly-daily | 获取某月每日统计 |
| 每日统计 | GET | /api/stats/weekly-daily | 获取本周每日统计 |
| 打卡 | POST | /api/checkins | 创建打卡 |
| 打卡 | GET | /api/checkins | 获取用户打卡记录 |
| 打卡 | GET | /api/checkins/date | 获取指定日期打卡 |
| 打卡 | GET | /api/checkins/history | 获取打卡历史 |
| 打卡 | GET | /api/checkins/streak | 获取连续打卡天数 |
| 漂流瓶 | GET | /api/bottles | 获取漂流瓶列表（分页） |
| 漂流瓶 | GET | /api/bottles/:id | 获取漂流瓶详情 |
| 漂流瓶 | POST | /api/bottles | 创建漂流瓶 |
| 漂流瓶 | DELETE | /api/bottles/:id | 删除漂流瓶 |
| 漂流瓶 | POST | /api/bottles/:id/like | 切换点赞 |
| 漂流瓶 | GET | /api/bottles/:id/comments | 获取评论列表 |
| 漂流瓶 | POST | /api/bottles/:id/comments | 创建评论 |
| 漂流瓶 | GET | /api/bottles/my/:userId | 获取用户发布的漂流瓶 |
| 漂流瓶 | GET | /api/bottles/favorites/:userId | 获取用户收藏的漂流瓶 |
| 漂流瓶 | POST | /api/bottles/:id/favorite | 切换漂流瓶收藏 |
| 漂流瓶 | GET | /api/bottles/:id/favorite | 检查是否已收藏 |
| 挑战 | GET | /api/challenges | 获取所有挑战 |
| 挑战 | GET | /api/challenges/user/:userId | 获取用户参加的挑战 |
| 挑战 | GET | /api/challenges/:id | 获取挑战详情 |
| 挑战 | POST | /api/challenges/:id/join | 加入挑战 |
| 挑战 | GET | /api/challenges/:id/ranking | 获取排行榜 |
| 挑战 | GET | /api/challenges/:id/participant | 获取参与状态 |
| 挑战 | POST | /api/challenges/:id/checkin | 挑战打卡 |
| 挑战 | GET | /api/challenges/checkins/all | 获取用户所有挑战打卡记录 |
| 挑战 | GET | /api/challenges/my/past | 获取用户往期挑战 |
| 挑战 | GET | /api/challenges/:id/moments | 获取挑战动态 |
| 挑战 | POST | /api/challenges/moments/:momentId/like | 切换挑战动态点赞 |
| 挑战 | GET | /api/challenges/moments | 获取所有挑战动态 |
| 胶囊 | GET | /api/capsules/openable | 获取可开启的胶囊 |
| 胶囊 | GET | /api/capsules | 获取用户胶囊列表 |
| 胶囊 | GET | /api/capsules/:id | 获取胶囊详情 |
| 胶囊 | POST | /api/capsules | 创建胶囊 |
| 胶囊 | POST | /api/capsules/:id/open | 开启胶囊 |
| 胶囊 | DELETE | /api/capsules/:id | 删除胶囊 |
| 消息 | GET | /api/messages/unread | 获取未读数量 |
| 消息 | GET | /api/messages/type | 按类型获取消息 |
| 消息 | GET | /api/messages | 获取用户消息 |
| 消息 | PUT | /api/messages/read-all | 全部已读 |
| 消息 | PUT | /api/messages/:id/read | 标记消息已读 |
| 徽章 | GET | /api/badges | 获取所有徽章 |
| 徽章 | GET | /api/badges/user/:userId | 获取用户徽章 |
| 徽章 | POST | /api/badges/award | 授予徽章 |
| 专注 | POST | /api/focus | 创建专注记录 |
| 专注 | GET | /api/focus/stats | 获取专注统计 |
| 专注 | GET | /api/focus | 获取专注记录 |
| 反馈 | POST | /api/feedback | 提交意见反馈 |
| 反馈 | GET | /api/feedback | 获取用户反馈列表 |
| 统计 | GET | /api/stats/profile | 获取用户主页统计 |
| 统计 | GET | /api/stats/today | 获取今日页统计 |
| 统计 | GET | /api/stats/weekly | 获取周报数据 |
| 等级 | GET | /api/level/info | 获取用户等级信息 |
| 等级 | GET | /api/level/configs | 获取所有等级配置 |
| 等级 | GET | /api/level/growth-tasks | 获取成长任务列表 |
| 等级 | GET | /api/level/growth-logs | 获取用户经验日志 |
