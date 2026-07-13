# Spring Boot 项目模板

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.7.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MyBatis Plus](https://img.shields.io/badge/MyBatis%20Plus-3.5.2-blue.svg)](https://baomidou.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个开箱即用的 Spring Boot 项目模板，整合了常用框架和最佳实践，助你快速构建生产级后端应用。

---

## 功能特性

### 核心框架
- **Spring Boot 2.7.x** - 最新稳定版本
- **Spring MVC** - RESTful API 开发
- **MyBatis Plus 3.5.2** - 增强数据访问层，内置分页
- **Spring AOP** - 面向切面编程
- **Spring Scheduler** - 定时任务支持

### 数据存储
- **MySQL** - 主数据库
- **Redis** - 内存缓存 & 分布式会话
- **Elasticsearch** - 全文搜索引擎
- **腾讯云 COS** - 对象存储服务

### 开发工具
- **Knife4j** - API 接口文档（增强版 Swagger UI）
- **EasyExcel** - Excel 导入导出
- **Hutool** - Java 工具类库
- **Lombok** - 简化样板代码
- **JUnit 5** - 单元测试框架

### 业务功能
- 用户认证（登录、注册、注销）
- 基于角色的权限控制
- 文件上传（云存储支持）
- 帖子管理（增删改查）
- 点赞 & 收藏系统
- 全局异常处理
- 请求日志拦截器
- 跨域配置
- 多环境支持

---

## 快速开始

### 环境要求
- JDK 17+
- Maven 3.6+
- MySQL 5.7+
- Redis（可选）
- Elasticsearch（可选）

### 1. 数据库初始化

执行 SQL 脚本创建数据库和表：

```bash
mysql -u root -p < sql/create_table.sql
```

默认管理员账号：
- **账号：** `admin`
- **密码：** `admin123`

### 2. 配置修改

编辑 `src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/your_database
    username: your_username
    password: your_password
```

### 3. 编译运行

```bash
# 编译项目
mvn clean package -DskipTests

# 运行应用
mvn spring-boot:run
```

### 4. 访问接口文档

打开浏览器访问：

```
http://localhost:8111/api/doc.html
```

---

## 项目结构

```
springboot-init/
├── src/main/java/com/ice/template/
│   ├── annotation/          # 自定义注解
│   ├── aop/                 # 切面实现
│   ├── common/              # 通用类（响应、错误码）
│   ├── config/              # 配置类
│   ├── constant/            # 常量定义
│   ├── controller/          # REST 控制器
│   ├── esdao/               # Elasticsearch 数据访问
│   ├── exception/           # 异常处理
│   ├── job/                 # 定时任务
│   ├── manager/             # 外部服务管理器
│   ├── mapper/              # MyBatis 映射器
│   ├── model/               # 数据模型
│   │   ├── dto/             # 数据传输对象
│   │   ├── entity/          # 数据库实体
│   │   ├── enums/           # 枚举
│   │   └── vo/              # 视图对象
│   ├── service/             # 业务逻辑层
│   │   └── impl/            # 服务实现
│   ├── utils/               # 工具类
│   └── wxmp/                # 微信公众号集成
├── src/main/resources/
│   ├── mapper/              # MyBatis XML 映射文件
│   └── application.yml      # 主配置文件
├── sql/                     # 数据库脚本
└── docs/                    # 文档
```

---

## 配置指南

### Redis 配置

在 `application.yml` 中取消 Redis 配置注释：

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: your_password
  session:
    store-type: redis
```

同时移除 `@SpringBootApplication` 注解中的 `RedisAutoConfiguration.class` 排除配置。

### Elasticsearch 配置

```yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: your_password
```

创建索引映射：

```bash
curl -X PUT "localhost:9200/post_v1" -H 'Content-Type: application/json' -d @sql/post_es_mapping.json
```

### 腾讯云 COS 配置

```yaml
cos:
  accessKey: your_access_key
  secretKey: your_secret_key
  region: ap-guangzhou
  bucket: your-bucket-name
```

---

## API 示例

### 用户注册

```bash
POST /api/user/register
Content-Type: application/json

{
  "userAccount": "newuser",
  "userPassword": "password123",
  "checkPassword": "password123"
}
```

### 用户登录

```bash
POST /api/user/login
Content-Type: application/json

{
  "userAccount": "admin",
  "userPassword": "admin123"
}
```

### 创建帖子

```bash
POST /api/post/add
Content-Type: application/json
Cookie: JSESSIONID=your_session_id

{
  "title": "我的第一篇帖子",
  "content": "Hello World!",
  "tags": ["java", "spring"]
}
```

---

## 开发指南

### 代码生成器

使用 `CodeGenerator` 类自动生成代码：

```java
String packageName = "com.ice.template";
String dataName = "用户评论";
String dataKey = "userComment";
String upperDataKey = "UserComment";
```

### 运行测试

```bash
mvn test
```

### 生产环境部署

```bash
mvn clean package -DskipTests
java -jar target/template-0.0.1-SNAPSHOT.jar
```

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [架构设计文档](docs/architecture.md) | 系统架构、分层设计、核心流程 |
| [功能文档](docs/features.md) | 功能列表、API 说明、使用指南 |
| [模块开发规范](docs/01-模块开发规范.md) | 新模块开发模板和规范 |

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 致谢

- [Spring Boot](https://spring.io/projects/spring-boot)
- [MyBatis Plus](https://baomidou.com/)
- [Knife4j](https://doc.xiaominfo.com/)
- [Hutool](https://hutool.cn/)
