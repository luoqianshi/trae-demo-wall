# 本地服务器存储集成与安全认证实现计划

## 一、需求分析

### 用户核心需求
1. **本地服务器存储集成**：学生信息存储到本地服务器数据库（SQLite）
2. **登录/注册系统**：支持管理员和普通用户注册登录
3. **密码加密存储**：账号密码不允许明文存储
4. **数据加密传输**：所有传输数据不允许明文
5. **管理员权限**：管理员只有一个账号（首次注册使用邀请码），其余均为普通用户
6. **人机验证（CAPTCHA）**：集成第三方验证码服务

### 技术约束
- 必须使用国内镜像源安装依赖
- 不允许明文存储任何敏感数据
- 不允许明文传输任何敏感数据
- 支持局域网内所有设备访问
- 不需要外部云服务，仅使用本地存储

---

## 二、技术选型

| 功能模块 | 技术方案 | 理由 |
|---------|---------|------|
| 本地数据库 | SQLite (aiosqlite) | Python内置，无需额外安装，支持异步操作，轻量级 |
| 密码哈希 | bcrypt (passlib) | 业界标准，安全可靠，防彩虹表攻击 |
| 数据加密 | AES-256-GCM (cryptography) | 对称加密，加密解密效率高，提供认证加密 |
| 会话管理 | JWT (python-jose) | 无状态认证，便于横向扩展，支持过期时间 |
| 传输加密 | HTTPS | 通过uvicorn配置SSL证书实现 |
| 验证码 | Google reCAPTCHA v2 | 免费、成熟、文档完善、前端后端验证简单 |

---

## 三、文件结构规划

### 新增文件

| 文件路径 | 功能描述 |
|---------|---------|
| `app/routes/auth.py` | 认证相关API路由（登录、注册、验证码） |
| `app/services/auth_service.py` | 认证业务逻辑（密码验证、JWT生成） |
| `app/services/crypto_service.py` | 加密解密服务（AES-256-GCM） |
| `app/services/local_storage.py` | 本地存储服务（SQLite操作） |
| `app/static/login.html` | 登录页面 |
| `app/static/register.html` | 注册页面 |
| `app/config/admin_config.json` | 管理员邀请码配置文件 |
| `data/app.db` | SQLite数据库文件（运行时自动创建） |

### 修改文件（最小改动）

| 文件路径 | 修改内容 |
|---------|---------|
| `app/main.py` | 添加认证路由、认证中间件、SSL配置（仅添加，不修改现有代码） |
| `requirements.txt` | 添加新依赖（仅添加，不修改现有依赖） |

**说明：** 所有现有功能文件（data.py、video.py、match.py、index.html、data.html、style.css等）**完全不修改**，通过FastAPI中间件拦截未认证请求，重定向到登录页面。

---

## 四、数据库设计

### 表结构

#### users 表（用户表）
| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| username | VARCHAR(50) | 用户名（唯一） |
| password_hash | VARCHAR(255) | bcrypt哈希密码 |
| role | VARCHAR(20) | 角色（admin/user） |
| created_at | TIMESTAMP | 创建时间 |
| last_login | TIMESTAMP | 最后登录时间 |

#### student_data 表（学生数据表）
| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 关联用户ID |
| encrypted_data | TEXT | AES加密的学生数据(JSON) |
| file_name | VARCHAR(255) | 原始文件名 |
| created_at | TIMESTAMP | 创建时间 |

---

## 五、核心实现方案

### 5.1 认证系统

#### 管理员注册流程（仅限第一个账号）
1. 用户访问注册页面
2. 输入用户名、密码、邀请码
3. 验证reCAPTCHA
4. 服务端验证邀请码（读取`admin_config.json`）
5. 检查是否已有管理员账号（数据库查询role=admin）
6. 若无管理员，使用bcrypt哈希密码，创建管理员账号（role=admin）
7. 生成JWT令牌返回

#### 普通用户注册流程
1. 用户访问注册页面
2. 输入用户名、密码（无需邀请码）
3. 验证reCAPTCHA
4. 使用bcrypt哈希密码，创建普通用户账号（role=user）
5. 生成JWT令牌返回

#### 登录流程
1. 用户输入用户名、密码
2. 验证reCAPTCHA
3. 服务端验证密码（bcrypt比对）
4. 更新最后登录时间
5. 生成JWT令牌（包含用户ID、角色、过期时间）
6. 返回令牌给前端

#### JWT中间件（零侵入方案）
- 通过FastAPI中间件统一拦截所有请求
- 未认证用户访问任何页面或API时，自动重定向到登录页面
- 认证用户访问时正常放行，不影响现有功能
- **不修改任何现有路由文件**，所有保护逻辑在中间件中实现

### 5.2 数据加密

#### AES-256-GCM加密方案
- 使用用户密码派生加密密钥（PBKDF2HMAC）
- 每次加密生成随机IV（12字节）
- 生成认证标签（16字节）
- 存储格式：`IV:Tag:EncryptedData`（Base64编码）

#### 加密流程（存储时）
1. 用户登录获取JWT
2. 上传学生数据
3. 使用用户密码派生密钥
4. AES加密数据
5. 存储加密后的数据到SQLite

#### 解密流程（读取时）
1. 用户登录获取JWT
2. 请求读取数据
3. 从SQLite获取加密数据
4. 使用用户密码派生密钥
5. AES解密数据
6. 返回解密后的数据

### 5.3 本地存储集成

#### SQLite配置
- 数据库文件路径：`data/app.db`
- 连接方式：aiosqlite异步连接
- 表结构：users、student_data

#### 数据操作
- 上传：加密后存储到`student_data`表
- 查询：按用户ID查询，返回加密数据
- 删除：按记录ID删除
- 导出：解密后导出为Excel

### 5.4 传输加密

#### HTTPS配置
- 使用自签名SSL证书（开发环境）
- 生产环境使用Let's Encrypt证书
- uvicorn配置SSL参数

#### 请求加密
- 所有API请求使用HTTPS
- JWT令牌通过Authorization Header传输
- 敏感数据（密码）通过HTTPS POST Body传输

---

## 六、API接口设计

### 6.1 认证接口

#### POST /api/auth/register
注册账号（管理员/普通用户）

**请求体（管理员注册，仅限第一个）：**
```json
{
    "username": "admin",
    "password": "secure_password",
    "invite_code": "ADMIN_INVITE_CODE",
    "captcha_token": "reCAPTCHA_token"
}
```

**请求体（普通用户注册）：**
```json
{
    "username": "user1",
    "password": "secure_password",
    "captcha_token": "reCAPTCHA_token"
}
```

**响应：**
```json
{
    "success": true,
    "message": "注册成功",
    "token": "jwt_token",
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin"
    }
}
```

**说明：**
- 若提供`invite_code`且验证通过，且系统尚无管理员，则注册为管理员（role=admin）
- 若未提供`invite_code`或邀请码无效，则注册为普通用户（role=user）
- 管理员账号仅限一个，已有管理员后再次使用邀请码注册将失败

#### POST /api/auth/login
用户登录

**请求体：**
```json
{
    "username": "admin",
    "password": "secure_password",
    "captcha_token": "reCAPTCHA_token"
}
```

**响应：**
```json
{
    "success": true,
    "message": "登录成功",
    "token": "jwt_token",
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin"
    }
}
```

#### POST /api/auth/verify_captcha
验证验证码

**请求体：**
```json
{
    "captcha_token": "reCAPTCHA_token"
}
```

**响应：**
```json
{
    "success": true,
    "message": "验证成功"
}
```

#### GET /api/auth/me
获取当前用户信息

**Header：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
    "success": true,
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00",
        "last_login": "2024-01-01T00:00:00"
    }
}
```

### 6.2 本地存储接口

#### POST /api/storage/upload
上传加密数据到本地数据库

**Header：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
    "data": "AES_encrypted_base64_data",
    "file_name": "students.xlsx"
}
```

**响应：**
```json
{
    "success": true,
    "message": "上传成功",
    "record_id": 1
}
```

#### GET /api/storage/list
获取用户的本地存储数据列表

**Header：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
    "success": true,
    "records": [
        {
            "id": 1,
            "file_name": "students.xlsx",
            "created_at": "2024-01-01T00:00:00"
        }
    ]
}
```

#### GET /api/storage/download/{record_id}
下载并解密本地存储数据

**Header：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
    "success": true,
    "data": "decrypted_student_data_json"
}
```

#### DELETE /api/storage/delete/{record_id}
删除本地存储数据

**Header：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
    "success": true,
    "message": "删除成功"
}
```

---

## 七、配置文件设计

### 7.1 admin_config.json
```json
{
    "invite_code_hash": "bcrypt_hash_of_invite_code",
    "created_at": "2024-01-01T00:00:00",
    "version": "1.0"
}
```

---

## 八、依赖列表

```txt
# 现有依赖
fastapi==0.95.2
uvicorn==0.24.0
openpyxl==3.1.2
xlrd==2.0.1
fuzzywuzzy==0.18.0
python-Levenshtein==0.21.1
python-multipart==0.0.9
pydantic==1.10.14
imageio-ffmpeg==0.6.0

# 新增依赖
aiosqlite==0.19.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
cryptography==41.0.7
httpx==0.25.2
python-dotenv==1.0.0
```

---

## 九、风险与处理

### 9.1 安全风险

| 风险 | 处理方案 |
|-----|---------|
| 密码泄露 | 使用bcrypt哈希，加盐处理 |
| 数据泄露 | AES-256-GCM加密存储 |
| 传输劫持 | 强制HTTPS |
| SQL注入 | 使用参数化查询 |
| 暴力破解 | reCAPTCHA + 登录失败次数限制 |
| JWT伪造 | 使用强密钥签名 |

### 9.2 依赖风险

| 风险 | 处理方案 |
|-----|---------|
| 数据库文件损坏 | 定期备份数据库文件 |
| reCAPTCHA不可访问 | 可替换为国内验证码服务（腾讯防水墙/阿里云盾） |

---

## 十、实施步骤

### 步骤1：创建配置文件
- 创建 `app/config/admin_config.json`

### 步骤2：安装依赖
- 更新 `requirements.txt`
- 使用国内镜像安装依赖

### 步骤3：创建加密服务
- 创建 `app/services/crypto_service.py`

### 步骤4：创建本地存储服务
- 创建 `app/services/local_storage.py`

### 步骤5：创建认证服务
- 创建 `app/services/auth_service.py`

### 步骤6：创建认证路由
- 创建 `app/routes/auth.py`

### 步骤7：创建登录/注册页面
- 创建 `app/static/login.html`
- 创建 `app/static/register.html`

### 步骤8：修改主应用（最小改动）
- 在 `app/main.py` 中添加认证路由和认证中间件（仅添加，不修改现有代码）

**说明：** 所有现有路由文件（data.py、video.py、match.py）和前端页面（index.html、data.html、style.css等）**完全不修改**

### 步骤11：测试验证
- 测试注册/登录流程
- 测试数据加密存储
- 测试HTTPS传输
- 测试验证码功能

---

## 十一、部署说明

### 开发环境
```bash
# 安装依赖（使用国内镜像）
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 启动服务（HTTP模式）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 启动服务（HTTPS模式，需提前生成SSL证书）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --ssl-keyfile=./ssl/key.pem --ssl-certfile=./ssl/cert.pem
```

### 生产环境
- 使用Nginx作为反向代理
- 配置Let's Encrypt SSL证书
- 设置环境变量管理敏感配置
- 配置防火墙规则
- 定期备份数据库文件

---

## 十二、注意事项

1. **邀请码安全**：邀请码仅存储哈希值，不存储明文
2. **密钥管理**：加密密钥由用户密码派生，不存储在服务器
3. **HTTPS强制**：所有生产环境必须启用HTTPS
4. **JWT过期**：设置合理的令牌过期时间（建议1小时）
5. **日志审计**：记录关键操作日志（登录、数据上传/下载）
6. **备份策略**：定期备份SQLite数据库文件
