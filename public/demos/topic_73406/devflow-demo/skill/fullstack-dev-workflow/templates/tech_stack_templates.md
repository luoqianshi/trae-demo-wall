# 技术栈模板片段

根据不同技术栈，预设以下关键 Prompt 片段模板，供动态生成时引用：

## 前端框架模板片段

### Vue 3
```markdown
- 使用 Vue 3 + Composition API
- 使用 Pinia 进行状态管理
- 使用 Vue Router 进行路由管理
- 使用 Element Plus 作为 UI 组件库
- 使用 Axios 进行 HTTP 请求
- 组件命名规范：PascalCase，目录按功能模块组织
- 样式使用 SCSS，遵循 BEM 命名规范
- 表单验证使用 VeeValidate
- 代码规范遵循 Vue 官方风格指南
```

### React
```markdown
- 使用 React 18 + Hooks
- 使用 Redux Toolkit 或 Zustand 进行状态管理
- 使用 React Router DOM 进行路由管理
- 使用 Ant Design 或 MUI 作为 UI 组件库
- 使用 Axios 或 Fetch 进行 HTTP 请求
- 组件命名规范：PascalCase，目录按功能模块组织
- 样式使用 CSS Modules 或 Tailwind CSS
- 表单验证使用 React Hook Form
- 代码规范遵循 Airbnb React 风格指南
```

### Angular
```markdown
- 使用 Angular 18 + TypeScript
- 使用 Angular Services 进行状态管理
- 使用 Angular Router 进行路由管理
- 使用 Angular Material 作为 UI 组件库
- 使用 HttpClient 进行 HTTP 请求
- 组件命名规范：kebab-case，目录按功能模块组织
- 样式使用 SCSS
- 表单验证使用 Angular Forms
- 代码规范遵循 Angular 官方风格指南
```

## 后端语言模板片段

### Python（FastAPI）
```markdown
- 使用 FastAPI + Uvicorn
- 使用 Pydantic 进行数据验证
- 使用 SQLAlchemy 或 Tortoise ORM 进行数据库操作
- 使用 JWT 进行认证鉴权
- 使用 Alembic 进行数据库迁移
- 目录结构：app/（核心代码）、models/、schemas/、crud/、routers/、dependencies/
- 使用 Pytest 进行单元测试
- API 响应统一格式：{ "code": 0, "message": "", "data": {} }
```

### Python（Flask）
```markdown
- 使用 Flask + Gunicorn
- 使用 Flask-SQLAlchemy 进行数据库操作
- 使用 Flask-JWT-Extended 进行认证鉴权
- 使用 Flask-Migrate 进行数据库迁移
- 目录结构：app/（核心代码）、models/、routes/、services/、utils/
- 使用 Pytest 进行单元测试
- API 响应统一格式：{ "code": 0, "message": "", "data": {} }
```

### Node.js（Express）
```markdown
- 使用 Express + TypeScript
- 使用 Prisma 或 TypeORM 进行数据库操作
- 使用 JWT 进行认证鉴权
- 使用 Zod 进行数据验证
- 目录结构：src/、controllers/、services/、routes/、models/、middleware/
- 使用 Jest 进行单元测试
- API 响应统一格式：{ "code": 0, "message": "", "data": {} }
```

### Node.js（NestJS）
```markdown
- 使用 NestJS + TypeScript
- 使用 Prisma 或 TypeORM 进行数据库操作
- 使用 Passport + JWT 进行认证鉴权
- 使用 class-validator 进行数据验证
- 目录结构：src/、modules/、controllers/、services/、entities/、dto/
- 使用 Jest 进行单元测试
- API 响应统一格式：{ "code": 0, "message": "", "data": {} }
```

### Java（Spring Boot）
```markdown
- 使用 Spring Boot 3.x + Java 21
- 使用 Spring Data JPA 进行数据库操作
- 使用 Spring Security + JWT 进行认证鉴权
- 使用 Jakarta Validation 进行数据验证
- 使用 Flyway 进行数据库迁移
- 目录结构：controller/、service/、repository/、entity/、dto/、config/
- 使用 JUnit 5 + Mockito 进行单元测试
- API 响应统一格式：{ "code": 0, "message": "", "data": {} }
```

### Go（Gin）
```markdown
- 使用 Gin 框架
- 使用 GORM 进行数据库操作
- 使用 JWT 进行认证鉴权
- 使用 go-playground/validator 进行数据验证
- 目录结构：cmd/、internal/、handler/、service/、repository/、model/、middleware/
- 使用 Go 内置测试框架进行单元测试
- API 响应统一格式：{ "code": 0, "message": "", "data": {} }
```

## 数据库模板片段

### MySQL/PostgreSQL
```markdown
- 使用关系型数据库设计范式
- 表名使用 snake_case，字段名使用 snake_case
- 主键使用自增 ID 或 UUID
- 外键约束严格定义
- 索引设计遵循查询优化原则
- 使用事务保证数据一致性
```

### MongoDB
```markdown
- 使用文档型数据库设计范式
- 集合名使用 snake_case，字段名使用 camelCase
- 使用 ObjectId 作为主键
- 合理设计嵌入式文档和引用关系
- 索引设计遵循查询优化原则
- 使用事务保证数据一致性（支持事务的版本）
```

### SQLite
```markdown
- 使用关系型数据库设计范式
- 表名使用 snake_case，字段名使用 snake_case
- 主键使用自增 ID
- 适合小型应用和开发测试环境
- 注意并发写入限制
```