# 后端基础模板

> Spring Boot 后端的包结构、分层架构与配置要点。

---

## 一、技术栈

| 维度 | 选型 | 版本 |
|------|------|------|
| 框架 | Spring Boot | 2.7.2 (Java 17) |
| ORM | MyBatis-Plus | 3.5.2 |
| 数据库 | MySQL | 8 |
| 缓存 | Redis | 可选 |
| 工具库 | Hutool | 5.8.8 |
| 接口文档 | Knife4j | 4.4.0 |
| 认证 | JWT | 4.4.0 |
| 对象存储 | 腾讯云 COS | 5.6.89 |

---

## 二、包结构

```
com.ice.template
├── MainApplication.java          # 启动类
├── annotation/                   # @AuthCheck 权限注解
├── aop/                          # AuthInterceptor + LogInterceptor
├── common/                       # BaseResponse / ErrorCode / ResultUtils / PageRequest
├── config/                       # MyBatisPlusConfig / Knife4jConfig / JsonConfig / CorsConfig
├── constant/                     # CommonConstant / UserConstant
├── controller/                   # 控制层
├── esdao/                        # ES Repository（可选）
├── exception/                    # BusinessException + GlobalExceptionHandler + ThrowUtils
├── job/                          # 定时任务
├── manager/                      # 第三方服务封装（CosManager）
├── mapper/                       # MyBatis Mapper
├── model/
│   ├── entity/                   # 数据库实体
│   ├── dto/                      # 请求对象（按模块分子包）
│   ├── vo/                       # 响应视图（脱敏）
│   └── enums/                    # 枚举
├── service/
│   ├── *.java                    # Service 接口
│   └── impl/*.java               # Service 实现
└── utils/                        # JwtUtils / NetUtils / SqlUtils
```

---

## 三、分层架构

```
Controller（@AuthCheck 权限 + 参数校验）
   ↓ ResultUtils.success(data)
Service 接口（extends IService<T>）
   ↓
ServiceImpl（业务编排 + 校验 + 事务）
   ↓ Entity↔VO 转换
Mapper（BaseMapper + XML）
   ↓
MySQL
```

### Manager 层

仅封装第三方服务（如 COS），**不参与核心业务编排**。

### 事务约定

- Service 间可相互注入（注意循环依赖）
- 自身事务方法必须通过代理调用：
  ```java
  XxxService proxy = (XxxService) AopContext.currentProxy();
  proxy.transactionalMethod();
  ```
- 锁 + 事务分离：锁包裹事务方法

---

## 四、统一响应与异常

### 响应

```java
return ResultUtils.success(data);        // 成功
return ResultUtils.error(ErrorCode.PARAMS_ERROR);  // 失败
```

### 异常

```java
throw new BusinessException(ErrorCode.PARAMS_ERROR, "参数不能为空");
ThrowUtils.throwIf(obj == null, ErrorCode.NOT_FOUND_ERROR);
```

---

## 五、权限控制

### @AuthCheck 注解

```java
@AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
@PostMapping("/add")
public BaseResponse<Long> addPost(@RequestBody PostAddRequest req) { ... }
```

### 方法内判断

```java
boolean isAdmin = userService.isAdmin(loginUser);
if (!isAdmin) throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
```

---

## 六、配置要点

```yaml
# application.yml
server:
  port: 8111
  servlet:
    context-path: /api

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: false  # 显式 @TableField
  global-config:
    db-config:
      logic-delete-field: isDelete
      logic-delete-value: 1
      logic-not-delete-value: 0

jwt:
  secret: xxx
  expiration: 2592000  # 30 天
```

**启动类约定**：
```java
@EnableAspectJAutoProxy(proxyTargetClass = true, exposeProxy = true)
```