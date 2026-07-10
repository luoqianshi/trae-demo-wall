# 雪球日记API架构设计

## 1. 架构概述

### 1.1 设计原则
- **RESTful设计**：遵循REST架构风格，使用HTTP方法表示操作
- **资源导向**：以资源为中心，使用名词表示资源
- **一致性**：保持API设计的一致性，包括命名、格式和行为
- **可扩展性**：设计可扩展的API，支持未来功能的添加
- **安全性**：实现适当的认证和授权机制
- **性能**：优化API性能，包括响应时间和资源使用

### 1.2 技术栈
- **后端框架**：FastAPI（Python）
- **数据库**：PostgreSQL（通过Supabase）
- **认证**：JWT
- **API文档**：OpenAPI/Swagger

## 2. 核心资源

### 2.1 用户 (Users)
- **描述**：系统用户，包含用户基本信息和认证数据
- **资源路径**：`/api/v1/users`

### 2.2 目标 (Goals)
- **描述**：用户设定的目标，如学习一项技能、养成一个习惯等
- **资源路径**：`/api/v1/goals`

### 2.3 任务 (Tasks)
- **描述**：目标分解的小任务，是实现目标的具体步骤
- **资源路径**：`/api/v1/tasks`

### 2.4 记录 (Records)
- **描述**：用户记录的小成功和进步
- **资源路径**：`/api/v1/records`

### 2.5 成就 (Achievements)
- **描述**：用户获得的成就和徽章
- **资源路径**：`/api/v1/achievements`

### 2.6 成长数据 (Growth)
- **描述**：用户的成长轨迹和统计数据
- **资源路径**：`/api/v1/growth`

## 3. API端点设计

### 3.1 用户API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| POST | `/api/v1/auth/register` | 注册新用户 | `{"username": "...", "email": "...", "password": "..."}` | `{"user_id": "...", "username": "...", "email": "...", "access_token": "..."}` |
| POST | `/api/v1/auth/login` | 用户登录 | `{"email": "...", "password": "..."}` | `{"user_id": "...", "username": "...", "email": "...", "access_token": "..."}` |
| GET | `/api/v1/users/me` | 获取当前用户信息 | N/A | `{"user_id": "...", "username": "...", "email": "...", "preferences": {...}}` |
| PATCH | `/api/v1/users/me` | 更新用户信息 | `{"username": "...", "preferences": {...}}` | `{"user_id": "...", "username": "...", "email": "...", "preferences": {...}}` |
| PATCH | `/api/v1/users/me/password` | 更新密码 | `{"old_password": "...", "new_password": "..."}` | `{"message": "Password updated successfully"}` |

### 3.2 目标API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| GET | `/api/v1/goals` | 获取用户的目标列表 | N/A | `[{"goal_id": "...", "title": "...", "description": "...", "progress": 0, ...}]` |
| POST | `/api/v1/goals` | 创建新目标 | `{"title": "...", "description": "...", "category": "...", "priority": "...", "end_date": "..."}` | `{"goal_id": "...", "title": "...", "description": "...", ...}` |
| GET | `/api/v1/goals/{goal_id}` | 获取目标详情 | N/A | `{"goal_id": "...", "title": "...", "description": "...", "tasks": [...], ...}` |
| PATCH | `/api/v1/goals/{goal_id}` | 更新目标 | `{"title": "...", "description": "...", "status": "..."}` | `{"goal_id": "...", "title": "...", "description": "...", ...}` |
| DELETE | `/api/v1/goals/{goal_id}` | 删除目标 | N/A | `{"message": "Goal deleted successfully"}` |
| POST | `/api/v1/goals/{goal_id}/breakdown` | 分解目标为任务 | N/A | `{"tasks": [{"task_id": "...", "title": "...", ...}]}` |

### 3.3 任务API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| GET | `/api/v1/tasks` | 获取用户的任务列表 | N/A | `[{"task_id": "...", "title": "...", "status": "...", ...}]` |
| POST | `/api/v1/tasks` | 创建新任务 | `{"goal_id": "...", "title": "...", "description": "...", "difficulty": 1, "order": 1}` | `{"task_id": "...", "title": "...", "description": "...", ...}` |
| GET | `/api/v1/tasks/{task_id}` | 获取任务详情 | N/A | `{"task_id": "...", "title": "...", "description": "...", ...}` |
| PATCH | `/api/v1/tasks/{task_id}` | 更新任务 | `{"title": "...", "description": "...", "status": "completed"}` | `{"task_id": "...", "title": "...", "description": "...", "status": "completed", ...}` |
| DELETE | `/api/v1/tasks/{task_id}` | 删除任务 | N/A | `{"message": "Task deleted successfully"}` |
| PATCH | `/api/v1/tasks/{task_id}/complete` | 标记任务完成 | N/A | `{"task_id": "...", "title": "...", "status": "completed", ...}` |

### 3.4 记录API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| GET | `/api/v1/records` | 获取用户的记录列表 | N/A | `[{"record_id": "...", "content": "...", "created_at": "...", ...}]` |
| POST | `/api/v1/records` | 创建新记录 | `{"content": "...", "type": "success", "tags": ["..."], "related_goal_id": "...", "related_task_id": "..."}` | `{"record_id": "...", "content": "...", "created_at": "...", ...}` |
| GET | `/api/v1/records/{record_id}` | 获取记录详情 | N/A | `{"record_id": "...", "content": "...", "created_at": "...", ...}` |
| PATCH | `/api/v1/records/{record_id}` | 更新记录 | `{"content": "...", "tags": ["..."]}` | `{"record_id": "...", "content": "...", "tags": ["..."], ...}` |
| DELETE | `/api/v1/records/{record_id}` | 删除记录 | N/A | `{"message": "Record deleted successfully"}` |
| GET | `/api/v1/records/filter` | 按条件筛选记录 | N/A (使用查询参数) | `[{"record_id": "...", "content": "...", "created_at": "...", ...}]` |

### 3.5 成就API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| GET | `/api/v1/achievements` | 获取用户的成就列表 | N/A | `[{"achievement_id": "...", "title": "...", "description": "...", "unlocked_at": "...", ...}]` |
| GET | `/api/v1/achievements/{achievement_id}` | 获取成就详情 | N/A | `{"achievement_id": "...", "title": "...", "description": "...", ...}` |

### 3.6 成长API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| GET | `/api/v1/growth` | 获取用户的成长数据 | N/A | `{"snowball_size": 100, "achievements_count": 5, "tasks_completed": 20, ...}` |
| GET | `/api/v1/growth/history` | 获取成长历史 | N/A (使用查询参数) | `[{"date": "...", "snowball_size": 50, "tasks_completed": 2, ...}]` |
| GET | `/api/v1/growth/report` | 获取成长报告 | N/A (使用查询参数) | `{"period": "week", "summary": "...", "achievements": [...], "suggestions": [...]}` |

### 3.7 AI API

| HTTP方法 | 端点 | 描述 | 请求体 (JSON) | 成功响应 (200 OK) |
|---------|------|------|--------------|-------------------|
| POST | `/api/v1/ai/task-breakdown` | 分解任务 | `{"goal": "...", "user_id": "..."}` | `{"tasks": [{"title": "...", "description": "...", "difficulty": 1, ...}]}` |
| POST | `/api/v1/ai/feedback` | 生成反馈 | `{"record": {...}, "user_id": "..."}` | `{"feedback": "..."}` |
| POST | `/api/v1/ai/growth-report` | 生成成长报告 | `{"user_id": "...", "time_range": "week"}` | `{"report": "..."}` |

## 4. 认证与授权

### 4.1 认证机制
- **JWT认证**：使用JSON Web Token进行身份验证
- **Bearer Token**：在请求头中使用`Authorization: Bearer <token>`
- **过期时间**：Token有效期为24小时
- **刷新机制**：提供Token刷新接口

### 4.2 授权策略
- **用户只能访问自己的数据**：通过中间件验证用户ID与资源所属用户ID
- **管理员权限**：保留管理员权限接口，用于系统管理

## 5. 数据验证

### 5.1 请求验证
- **使用Pydantic模型**：定义请求和响应的数据模型
- **字段验证**：对所有输入字段进行类型和格式验证
- **业务规则验证**：验证业务规则，如密码强度、邮箱格式等

### 5.2 响应格式
- **一致的响应格式**：所有API响应使用统一的格式
- **成功响应**：包含数据和元数据
- **错误响应**：包含错误码、消息和详细信息

## 6. 错误处理

### 6.1 错误响应格式

```json
{
  "error": "NotFound",
  "message": "Resource not found",
  "details": {
    "resource": "Goal",
    "id": "123"
  },
  "timestamp": "2023-04-21T10:00:00Z",
  "path": "/api/v1/goals/123"
}
```

### 6.2 常见错误码
- **400 Bad Request**：请求参数错误
- **401 Unauthorized**：未授权，缺少或无效的Token
- **403 Forbidden**：禁止访问，权限不足
- **404 Not Found**：资源不存在
- **409 Conflict**：资源冲突，如邮箱已存在
- **422 Unprocessable Entity**：请求验证失败
- **500 Internal Server Error**：服务器内部错误

## 7. 分页与过滤

### 7.1 分页
- **分页参数**：使用`page`和`page_size`查询参数
- **响应格式**：包含分页信息

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "pages": 5,
  "has_next": true,
  "has_prev": false
}
```

### 7.2 过滤
- **查询参数**：使用查询参数进行过滤
- **支持的过滤**：按日期、状态、标签等
- **排序**：支持按字段排序

## 8. API版本控制

### 8.1 版本策略
- **URL版本控制**：在URL中包含版本号，如`/api/v1/users`
- **向后兼容**：新版本API应保持向后兼容
- **废弃机制**：标记废弃的API端点，并提供迁移指南

## 9. 性能优化

### 9.1 缓存策略
- **响应缓存**：对频繁访问的数据进行缓存
- **ETag**：使用ETag进行缓存验证
- **Cache-Control**：设置适当的缓存控制头

### 9.2 数据库优化
- **索引**：为常用查询字段创建索引
- **批量操作**：支持批量创建和更新
- **分页查询**：使用数据库分页，避免全表扫描

### 9.3 API优化
- **压缩**：启用响应压缩
- **限流**：实现API限流，防止滥用
- **批量请求**：支持批量API请求，减少网络往返

## 10. 文档

### 10.1 API文档
- **OpenAPI/Swagger**：自动生成API文档
- **交互式文档**：提供交互式API测试界面
- **示例**：为每个端点提供请求和响应示例

### 10.2 开发者文档
- **认证指南**：如何获取和使用Token
- **错误处理**：如何处理常见错误
- **最佳实践**：API使用最佳实践
- **变更日志**：API变更历史

## 11. 实现示例

### 11.1 用户认证示例

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel

# 配置
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24小时

# 密码加密
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# 数据模型
class User(BaseModel):
    user_id: str
    username: str
    email: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# 工具函数
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    # 从数据库获取用户
    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

# API端点
@app.post("/api/v1/auth/register", response_model=Token)
async def register(user: UserCreate):
    # 检查邮箱是否已存在
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # 创建新用户
    hashed_password = get_password_hash(user.password)
    new_user = await create_user(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.user_id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(
            user_id=new_user.user_id,
            username=new_user.username,
            email=new_user.email
        )
    )

@app.post("/api/v1/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 查找用户
    user = await get_user_by_email(form_data.username)  # OAuth2使用username字段传递email
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(
            user_id=user.user_id,
            username=user.username,
            email=user.email
        )
    )

@app.get("/api/v1/users/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
```

### 11.2 目标管理示例

```python
from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

# 数据模型
class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    end_date: Optional[date] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed|cancelled)$")
    end_date: Optional[date] = None

class GoalResponse(GoalBase):
    goal_id: str
    user_id: str
    status: str
    progress: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

# API端点
@app.get("/api/v1/goals", response_model=List[GoalResponse])
async def get_goals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(pending|in_progress|completed|cancelled)$"),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    # 构建查询
    query = {"user_id": current_user.user_id}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    # 计算偏移量
    offset = (page - 1) * page_size
    
    # 获取目标列表
    goals = await get_goals_by_user_id(
        user_id=current_user.user_id,
        query=query,
        limit=page_size,
        offset=offset
    )
    
    return goals

@app.post("/api/v1/goals", response_model=GoalResponse, status_code=201)
async def create_goal(
    goal: GoalCreate,
    current_user: User = Depends(get_current_user)
):
    # 创建目标
    new_goal = await create_goal(
        user_id=current_user.user_id,
        title=goal.title,
        description=goal.description,
        category=goal.category,
        priority=goal.priority,
        end_date=goal.end_date
    )
    
    return new_goal

@app.get("/api/v1/goals/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user)
):
    # 获取目标
    goal = await get_goal_by_id(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # 验证所有权
    if goal.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return goal

@app.patch("/api/v1/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    current_user: User = Depends(get_current_user)
):
    # 获取目标
    goal = await get_goal_by_id(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # 验证所有权
    if goal.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 更新目标
    updated_goal = await update_goal(
        goal_id=goal_id,
        updates=goal_update.dict(exclude_unset=True)
    )
    
    return updated_goal

@app.delete("/api/v1/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user)
):
    # 获取目标
    goal = await get_goal_by_id(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # 验证所有权
    if goal.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 删除目标
    await delete_goal(goal_id)
    
    return {"message": "Goal deleted successfully"}

@app.post("/api/v1/goals/{goal_id}/breakdown")
async def breakdown_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user)
):
    # 获取目标
    goal = await get_goal_by_id(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # 验证所有权
    if goal.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # 调用AI服务分解任务
    tasks = await ai_breakdown_goal(goal.title, goal.description)
    
    # 保存任务
    saved_tasks = []
    for i, task in enumerate(tasks):
        saved_task = await create_task(
            goal_id=goal_id,
            title=task["title"],
            description=task.get("description"),
            difficulty=task.get("difficulty", 1),
            order=i + 1
        )
        saved_tasks.append(saved_task)
    
    return {"tasks": saved_tasks}
```

## 12. 总结

本API架构设计为「雪球日记」项目提供了一个符合RESTful最佳实践的API框架，包括核心资源的端点设计、认证机制、错误处理、分页与过滤等功能。通过这个API架构，前端应用可以与后端服务进行高效、安全的通信，实现用户目标管理、任务分解、记录追踪、成长分析等核心功能。

API设计遵循了一致性、可扩展性、安全性和性能优化的原则，为后续的开发和维护提供了良好的基础。同时，通过详细的文档和示例，开发人员可以快速理解和实现API功能，确保项目的顺利进行。