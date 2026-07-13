# 模板中心

> 开发新模块必读。模板为模块化设计，按需引用，避免一次性加载全部内容。

---

## 模板索引

| 模板 | 内容 | 适用场景 |
|------|------|----------|
| [common-api](./templates/common-api.md) | 前后端协作约定（ID类型/统一响应/认证头/错误码） | 所有开发 |
| [frontend-base](./templates/frontend-base.md) | 前端目录结构/技术栈/命名规范 | 前端开发 |
| [frontend-table](./templates/frontend-table.md) | 数据表组件/分页/筛选/工具栏 | 前端列表页 |
| [frontend-form](./templates/frontend-form.md) | 表单弹窗/Provider/Dialogs | 前端表单 |
| [backend-base](./templates/backend-base.md) | 后端包结构/分层架构/配置 | 后端开发 |
| [backend-crud](./templates/backend-crud.md) | Entity/Mapper/Service/Controller 模板 | 后端 CRUD |
| [db-schema](./templates/db-schema.md) | 建表规范/字段约定/索引 | 数据库设计 |

---

## 按需组合

### 前端列表页
```
需要：common-api + frontend-base + frontend-table
跳过：backend-*、frontend-form
```

### 前端表单弹窗
```
需要：common-api + frontend-base + frontend-form
跳过：backend-*、frontend-table
```

### 后端 CRUD
```
需要：common-api + backend-base + backend-crud + db-schema
跳过：frontend-*
```

### 全栈新模块
```
需要：全部模板
顺序：db-schema → backend-base → backend-crud → frontend-base → frontend-table → frontend-form
```

---

## 关键约定速查

| 约定 | 前端 | 后端 |
|------|------|------|
| ID 类型 | `string` | `Long`（JsonConfig 转 String） |
| 统一响应 | `ApiResponse<T>` | `BaseResponse<T>` |
| 认证头 | `Authorization: Bearer {token}` | Session + JWT 双轨 |
| 请求方式 | 查询也用 POST | `@PostMapping` |
| 分页结构 | `{ records, total, current, size, pages }` | `Page<T>` |

---

**详细使用方式见项目根目录 [CLAUDE.md](../../CLAUDE.md)**