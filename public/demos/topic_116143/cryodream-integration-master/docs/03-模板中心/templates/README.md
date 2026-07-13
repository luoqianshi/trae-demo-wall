# 模板使用说明

本目录存放模块化的开发模板，按需引用，避免一次性加载全部内容。

## 模板索引

| 模板文件 | 适用场景 | 内容 |
|----------|----------|------|
| `common-api.md` | 前后端协作 | API 协作约定（ID类型、统一响应、认证头、错误码） |
| `frontend-base.md` | 前端开发 | 目录结构、技术栈、命名规范、导入顺序 |
| `frontend-table.md` | 前端列表页 | 数据表组件、分页、筛选、工具栏 |
| `frontend-form.md` | 前端表单 | 表单弹窗、Provider、Dialogs 注册 |
| `backend-base.md` | 后端开发 | 包结构、分层架构、配置要点 |
| `backend-crud.md` | 后端 CRUD | Entity/Mapper/Service/Controller 模板 |
| `db-schema.md` | 数据库 | 建表规范、字段约定、索引 |

## 按需组合示例

### 开发前端列表模块

```
需要：frontend-base + frontend-table + common-api
跳过：backend-*、frontend-form（如果无表单）
```

### 开发后端 CRUD 模块

```
需要：backend-base + backend-crud + db-schema + common-api
跳过：frontend-*
```

### 全栈新模块

```
需要：common-api + frontend-base + frontend-table + backend-base + backend-crud + db-schema
```

## 引用方式

在 SKILL.md 或对话中用相对路径引用：

```
参照 .claude/skills/ai-dev-assistant/templates/frontend-table.md
```