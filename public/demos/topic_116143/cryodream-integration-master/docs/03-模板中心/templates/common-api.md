# 前后端 API 协作约定

> 所有前后端开发必读的共享约定。

---

## 一、ID 类型约定

| 约定 | 前端 | 后端 |
|------|------|------|
| 类型 | `string` | `Long`（雪花 ID） |
| 原因 | JS Long 精度丢失 | JsonConfig 全局转 String |

```typescript
// 前端 schema
id: z.string()  // 防精度丢失

// 删除时显式转字符串
{ id: String(data.id) }
```

---

## 二、统一响应格式

### 后端响应

```java
@Data
public class BaseResponse<T> {
    private int code;      // 0 = 成功
    private T data;
    private String message;
}
```

### 前端类型

```typescript
export interface ApiResponse<T = unknown> {
  code: number       // 0 = 成功
  data: T
  message: string
}
```

---

## 三、分页结构

### 后端（MyBatis-Plus）

```java
Page<T> page = new Page<>(current, pageSize);
// 返回结构：{ records, total, current, size, pages }
```

### 前端类型

```typescript
export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}
```

---

## 四、认证头

```typescript
// 请求拦截自动注入
headers: { Authorization: `Bearer ${token}` }
```

后端双轨：
- Session：`request.getSession().getAttribute(USER_LOGIN_STATE)`
- JWT：解析 `Authorization` header 获取 userId 查库

---

## 五、请求方式

**查询也用 POST**（带 RequestBody）

```typescript
// 前端
api.post<any, ApiResponse<PageResult<User>>>('/user/list/page/vo', params)

// 后端
@PostMapping("/list/page/vo")
public BaseResponse<Page<UserVO>> listUserVOByPage(@RequestBody UserQueryRequest req)
```

---

## 六、错误码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 40000 | 参数错误 |
| 40100 | 未登录 |
| 40101 | 无权限 |
| 40300 | 禁止访问 |
| 40400 | 数据不存在 |
| 50000 | 系统错误 |

---

## 七、端口与代理

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 | 8111 | context-path `/api` |
| 前端 | 5180 | Vite proxy `/api` → 8111 |

```ts
// vite.config.ts
proxy: {
  '/api': { target: 'http://localhost:8111', changeOrigin: true }
}
```