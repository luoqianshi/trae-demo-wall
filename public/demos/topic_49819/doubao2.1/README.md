# ValueLedger（创值账本）

面向研发团队的 AI 项目事实账本 —— 基于真实贡献度的价值计量系统。

## 一、技术栈

- **语言**：Python 3.10+（全部使用 Python 标准库，零 pip install 即可运行核心功能）
- **Server**：`http.server` 原生 HTTP 服务，RESTful API 设计
- **Client**：`urllib.request`（HTTP 调用）+ `tkinter`（现代化 GUI 界面）
- **数据库**：`sqlite3`（单文件库 `valueledger.db`，server 端持有，自动迁移）
- **AI 评价**：DeepSeek API（OpenAI 兼容接口，`urllib.request` 调用，失败自动降级）
- **哈希存证**：`hashlib.sha256` 代码内容存证
- **会话管理**：Token 持久化登录，客户端自动保存登录状态

## 二、目录结构

```
doubao2.1/
├── README.md                 # 本文档
├── run_server.py             # 服务端启动脚本
├── run_client_gui.py         # GUI 客户端启动脚本（推荐）
├── run_client.py             # CLI 客户端启动脚本
├── valueledger/
│   ├── __init__.py
│   ├── config.py             # 全局配置（支持环境变量覆盖）
│   ├── data/
│   │   └── valueledger.db    # SQLite 数据库（运行后自动生成）
│   ├── server/
│   │   ├── __init__.py
│   │   ├── main.py           # HTTP server 启动入口
│   │   ├── api_handlers.py   # RESTful API 路由处理
│   │   ├── db.py             # sqlite3 建表 / CRUD（带自动迁移）
│   │   ├── ai_client.py      # DeepSeek 代码评价（带降级）
│   │   └── utils.py          # 服务端工具函数
│   └── client/
│       ├── __init__.py
│       ├── main.py           # CLI 客户端入口
│       ├── gui.py            # Tkinter GUI 客户端（主力使用）
│       ├── api_client.py     # API 封装客户端
│       └── utils.py          # 客户端工具函数
```

## 三、启动方式

### 1. 启动 Server

```bash
python run_server.py
```

- 监听地址：`0.0.0.0:8765`（可通过环境变量 `SERVER_HOST`/`SERVER_PORT` 修改）
- 首次启动自动创建空数据库 `valueledger.db`
- 数据库为空时，第一个通过客户端注册的用户自动成为 boss
- 配置支持环境变量覆盖：
  - `DEEPSEEK_API_KEY`：DeepSeek API 密钥
  - `DEEPSEEK_API_URL`：API 地址
  - `DEEPSEEK_MODEL`：使用的模型（默认 `deepseek-chat`）
  - `SERVER_HOST`/`SERVER_PORT`：服务端监听配置

### 2. 启动 Client

**GUI 客户端（推荐，参赛演示主力）**：
```bash
python run_client_gui.py
```

**命令行客户端（测试参考）**：
```bash
python run_client.py
```

> GUI 客户端自动保存服务端地址和登录 Token，下次启动无需重新输入。

## 四、用户体系

### 4.1 角色

| 角色 | 说明 |
|:---|:---|
| **boss** | 第一个注册的用户，具备用户任免、角色调整、查看项目进度、查看贡献度排行等全部权限 |
| **manager** | 中层管理者，可创建项目、给开发者分配任务 |
| **usr** | 价值创造者（开发者），可提交代码获得 AI 评价、确认/修正评价 |

### 4.2 用户状态

| 状态 | 说明 |
|:---|:---|
| **active** | 在职，可正常登录、被分配任务 |
| **dismissed** | 已免职，无法登录，不会被分配任务，不计入贡献度排行 |

### 4.3 注册与登录

- **首次注册**：数据库为空时，客户端启动后进入注册窗口，填写用户名+密码+确认密码，注册者自动成为 boss
- **后续登录**：数据库已有 boss 后，客户端启动进入登录窗口，用用户名+密码登录
- **免职限制**：被免职用户（status=dismissed）无法登录，会收到明确提示
- **Token 会话**：登录成功后服务端颁发 Token，客户端自动保存，重启免登录

### 4.4 修改密码

所有角色登录后均可修改自己的密码（需输入旧密码 + 新密码 + 确认新密码）。

## 五、功能清单

### 5.1 boss 功能

| 功能 | 说明 |
|:---|:---|
| 项目进度查看 | 可视化查看所有项目进度条，按 confirmed 任务计算真实完成百分比 |
| 贡献度排行 | 按开发者聚合：提交次数、完成任务数、平均得分，奖牌排名展示 |
| 用户列表 | 表格展示所有用户（ID/用户名/角色/状态/注册IP/MAC地址/注册时间），不同状态颜色区分 |
| 用户任免 | ① 切换角色（开发者↔管理者）② 免职用户（禁止登录）③ 复职用户（恢复权限） |
| 修改密码 | 修改自己的密码 |

### 5.2 manager 功能

| 功能 | 说明 |
|:---|:---|
| 创建项目 | 填写项目名称 + 描述 |
| 项目列表 | 查看所有项目及进度 |
| 创建任务 | 选择项目 + 选择在职开发者 + 填写任务标题/描述，自动分配 |
| 查看任务 | 按项目筛选查看任务列表及状态流转 |
| 修改密码 | 修改自己的密码 |

### 5.3 usr（开发者）功能

| 功能 | 说明 |
|:---|:---|
| 我的任务 | 查看分配给自己的所有任务（含项目名、状态），三色状态标识 |
| 提交代码 | 选择本地 .py 文件 → 选择对应任务 → 服务端计算 sha256 存证 → 调 DeepSeek 生成 AI 评分+评语 |
| 确认评价 | 查看 AI 原始评分和评语，可拖动滑块调整分数、修改评语，系统自动标记是否修改过 AI 评价 |
| 提交历史 | 查看自己所有提交记录，显示最终得分、是否修改、确认时间 |
| 修改密码 | 修改自己的密码 |

### 5.4 代码提交流程

```
1. 开发者选择任务 + 选择代码文件
   ↓
2. 点击"提交代码进行AI评审"
   ↓
3. 后台异步调用 AI，界面无阻塞
   ↓
4. AI 返回后弹窗显示：AI评分 + AI评价
   ↓
5. 自动跳转到"确认评价"页面
   ↓
6. 开发者可确认或修正评价，提交后任务状态变为"已完成"
   ↓
7. boss 端项目进度实时更新，贡献度数据更新
```

### 5.5 任务状态流转

```
todo（待开始）→ submitted（待确认，代码已提交AI评审）→ confirmed（已完成，开发者确认评价）
```

项目进度 = 已确认任务数 / 总任务数 × 100%

## 六、HTTP API 路由

所有接口均返回 JSON，除公开接口外需要在 Header 携带 `Authorization: Bearer <token>`。

### 公开接口（无需登录）

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| GET | `/api/has-users` | 检查系统是否已有用户（用于判断首次注册） |
| POST | `/api/register` | 注册新用户，首次注册自动成为 boss |
| POST | `/api/login` | 用户登录，返回 token 和用户信息 |

### 通用接口（需登录）

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| GET | `/api/me` | 获取当前登录用户信息 |
| GET | `/api/projects` | 获取所有项目列表（含进度） |
| GET | `/api/projects/{id}/tasks` | 获取指定项目的任务列表 |
| GET | `/api/my/tasks` | 获取当前用户的任务列表 |
| GET | `/api/my/submissions` | 获取当前用户的提交记录 |
| POST | `/api/change-password` | 修改自己的密码 |

### 开发者接口（usr 角色）

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| POST | `/api/tasks/{id}/submit` | 提交代码，触发 AI 评审 |
| POST | `/api/submissions/{id}/confirm` | 确认/修正评价 |

### 管理者接口（manager/boss 角色）

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| POST | `/api/projects` | 创建新项目 |
| POST | `/api/tasks` | 创建新任务并分配给开发者 |

### BOSS 专属接口

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| GET | `/api/boss/projects` | 获取所有项目进度（boss 视图） |
| GET | `/api/boss/contributions` | 获取开发者贡献度排行（仅统计在职用户） |
| GET | `/api/users` | 获取所有用户列表 |
| POST | `/api/boss/users/{id}/role` | 修改用户角色（usr ↔ manager） |
| POST | `/api/boss/users/{id}/dismiss` | 免职用户（status → dismissed） |
| POST | `/api/boss/users/{id}/restore` | 复职用户（status → active） |

## 七、数据模型（SQLite）

```sql
-- 用户表（带自动迁移）
users(id, username UNIQUE, password(sha256), role(boss/manager/usr),
      status(active/dismissed), ip_address, mac_address, created_at)

-- 项目表
projects(id, name, description, created_by, created_at, status(active))

-- 任务表（带状态流转）
tasks(id, project_id, title, description, assignee_id, created_by,
      status(todo/submitted/confirmed), created_at)

-- 代码提交表（含哈希存证+修改标记）
code_submissions(id, task_id, user_id, filename, code_content,
                 ai_score, ai_comment, final_score, final_comment,
                 code_hash(sha256), is_modified(0/1),
                 submitted_at, confirmed_at)

-- 会话表（Token 持久化）
sessions(token PK, user_id, created_at)
```

## 八、配置说明（valueledger/config.py）

所有配置项均支持环境变量覆盖，方便部署：

| 配置项 | 默认值 | 环境变量 | 说明 |
|:---|:---|:---|:---|
| `SERVER_HOST` | `0.0.0.0` | `SERVER_HOST` | server 监听地址 |
| `SERVER_PORT` | `8765` | `SERVER_PORT` | server 监听端口 |
| `DEEPSEEK_API_KEY` | （内置测试key） | `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/v1/chat/completions` | `DEEPSEEK_API_URL` | DeepSeek 接口地址 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | `DEEPSEEK_MODEL` | 使用的模型（实测可用） |
| `DEFAULT_SERVER_URL` | `http://127.0.0.1:8765` | `DEFAULT_SERVER_URL` | 客户端默认服务端地址 |

## 九、开发说明

### 9.1 重置数据库

如需清空所有数据重新开始演示：

```bash
# 停掉 server 后删除数据库文件
del valueledger\data\valueledger.db    # Windows
rm valueledger/data/valueledger.db     # Linux/Mac

# 重启 server，会自动创建空数据库并执行迁移
python run_server.py
```

### 9.2 设计亮点

1. **开箱可用**：AI 配置真实可运行，失败自动降级到 60 分，不会现场翻车
2. **真实进度**：任务状态完整流转，进度百分比按已确认任务计算，不是假数据
3. **RESTful API**：资源化路由设计，二次开发加端点非常方便
4. **Token 会话**：持久化登录，客户端重启不用重新登录，演示流畅
5. **自动迁移**：数据库升级自动 ALTER TABLE 添加新字段，兼容旧库
6. **MAC 客户端上报**：MAC 地址由客户端采集上报，准确记录注册设备
7. **环境变量配置**：敏感信息和部署配置支持环境变量，不硬编码

### 9.3 已知限制（Demo 范围）

- 无 HTTPS，密码以明文走 HTTP body（局域网演示可接受，生产需加 HTTPS）
- 密码哈希目前使用无盐 sha256（参赛 Demo 级别，生产建议加盐）
- 贡献度计算为简化版本（平均分 × 提交数），未引入难度/质量系数
- 无消息推送，数据需手动刷新查看
- GUI 使用 Tkinter 原生渲染，风格为现代浅色主题

### 9.4 后续可扩展方向

- 密码加盐哈希存储，提升安全性
- 项目状态流转（进行中/暂停/已完成/已归档）
- 贡献度公式升级（引入任务难度系数、代码质量权重）
- 按项目维度聚合查看所有代码和评价
- 评价修改审批流（manager 审批 usr 的分数修改）
- 操作日志审计
- Web 端管理后台
- HTTPS + WSS 加密传输

## 十、快速演示流程

1. **启动服务端**：`python run_server.py`
2. **启动 GUI 客户端**：`python run_client_gui.py`
3. **注册第一个账号（BOSS）**：例如用户名 `boss`，密码 `123456`
4. **注册第二个账号（开发者）**：退出登录，注册 `dev1`/`123456`
5. **回到 BOSS 账号**：在"用户任免"页面将 `dev1` 提拔为管理者，或保持开发者
6. **创建项目和任务**：用 manager 身份（或 boss）创建项目，给 dev1 分配任务
7. **切换到 dev1 账号**：在"提交代码"页面提交一个 Python 文件，等待 AI 评审
8. **确认评价**：AI 出分后，调整分数或直接确认
9. **回到 BOSS 账号**：查看"项目进度"显示进度更新，"贡献度排行"显示 dev1 得分

整个流程约 3-5 分钟即可完整演示闭环。
