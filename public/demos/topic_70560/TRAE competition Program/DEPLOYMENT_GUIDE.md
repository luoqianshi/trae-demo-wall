# AI教育数据清洗与视频转码系统 - 部署指南

## 一、环境要求

### 1.1 操作系统
- ✅ Windows 10 / Windows 11（推荐）
- ✅ Windows Server 2016 及以上
- ✅ Linux (Ubuntu 18.04+, CentOS 7+)

### 1.2 Python版本
- ✅ Python 3.9 - 3.12（推荐 Python 3.11）

### 1.3 硬件要求
- 内存：至少 4GB（推荐 8GB）
- 硬盘：至少 10GB 可用空间
- CPU：双核及以上

---

## 二、依赖库安装

### 2.1 使用国内镜像源安装（推荐）

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 2.2 手动安装所有依赖

```bash
pip install fastapi==0.95.2 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install uvicorn==0.24.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install openpyxl==3.1.2 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install xlrd==2.0.1 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install fuzzywuzzy==0.18.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install python-Levenshtein==0.21.1 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install python-multipart==0.0.9 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install pydantic==1.10.14 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install imageio-ffmpeg==0.6.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install python-pptx==1.0.2 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install aiosqlite==0.19.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install python-jose[cryptography]==3.3.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install passlib[bcrypt]==1.7.4 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install cryptography==41.0.7 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install httpx==0.25.2 -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install python-dotenv==1.0.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 2.3 依赖库说明

| 库名 | 版本 | 用途 |
|------|------|------|
| fastapi | 0.95.2 | Web框架，提供API服务 |
| uvicorn | 0.24.0 | ASGI服务器，运行FastAPI |
| openpyxl | 3.1.2 | 读取/写入 .xlsx Excel文件 |
| xlrd | 2.0.1 | 读取 .xls Excel文件（旧格式） |
| fuzzywuzzy | 0.18.0 | 模糊匹配算法 |
| python-Levenshtein | 0.21.1 | Levenshtein距离计算 |
| python-multipart | 0.0.9 | 文件上传支持 |
| pydantic | 1.10.14 | 数据验证 |
| imageio-ffmpeg | 0.6.0 | 内置FFmpeg，视频转码 |
| python-pptx | 1.0.2 | 生成PPT报告（预留） |
| aiosqlite | 0.19.0 | SQLite数据库支持 |
| python-jose | 3.3.0 | JWT认证（预留） |
| passlib | 1.7.4 | 密码加密（预留） |
| cryptography | 41.0.7 | 加密库 |
| httpx | 0.25.2 | HTTP客户端 |
| python-dotenv | 1.0.0 | 环境变量管理 |

---

## 三、Windows系统部署

### 3.1 安装Python

1. 下载 Python 3.11：https://www.python.org/downloads/release/python-3119/
2. 勾选 "Add Python to PATH"
3. 安装完成后验证：
   ```bash
   python --version
   pip --version
   ```

### 3.2 下载项目代码

将项目文件解压到 `f:\TRAE competition Program` 目录

### 3.3 安装依赖

```bash
cd "f:\TRAE competition Program"
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 3.4 启动服务器

#### 方式一：命令行启动

```bash
cd "f:\TRAE competition Program"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 方式二：创建启动脚本

创建 `start.bat` 文件：

```bat
@echo off
cd /d "f:\TRAE competition Program"
echo 正在启动AI教育数据清洗系统...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
```

双击运行 `start.bat` 即可启动服务器。

### 3.5 验证服务

打开浏览器访问：
- 本地访问：`http://localhost:8000`
- 局域网访问：`http://服务器IP:8000`

访问健康检查接口：`http://localhost:8000/api/health`

预期返回：
```json
{"status":"healthy","version":"1.0.0","ffmpeg_available":true}
```

---

## 四、Linux系统部署

### 4.1 安装Python 3.11

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-dev python3.11-venv

# CentOS/RHEL
sudo yum install python3.11 python3.11-devel
```

### 4.2 创建虚拟环境（推荐）

```bash
cd /opt/TRAE_competition_Program
python3.11 -m venv venv
source venv/bin/activate
```

### 4.3 安装依赖

```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 4.4 启动服务器

```bash
cd /opt/TRAE_competition_Program
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4.5 后台运行（使用nohup）

```bash
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > app.log 2>&1 &
```

### 4.6 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 8000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

---

## 五、局域网访问配置

### 5.1 获取服务器IP

```bash
# Windows
ipconfig

# Linux
ifconfig
# 或
ip addr
```

查找 IPv4 地址，通常格式为：`192.168.x.x` 或 `10.x.x.x`

### 5.2 客户端访问

在局域网内的其他设备上，打开浏览器访问：

```
http://服务器IP:8000
```

例如：`http://192.168.1.100:8000`

### 5.3 注意事项

1. 确保服务器和客户端在同一局域网
2. 关闭服务器的防火墙或允许 8000 端口
3. 如果服务器使用笔记本电脑，确保连接的是同一个WiFi

---

## 六、常见问题解决

### 6.1 端口被占用

```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID <进程ID>

# Linux
lsof -i :8000
kill -9 <进程ID>
```

### 6.2 依赖安装失败

```bash
# 升级pip
pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple

# 清除缓存
pip cache purge

# 重新安装
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 6.3 FFmpeg不可用

本系统使用 `imageio-ffmpeg`，无需单独安装FFmpeg。如果提示不可用：

```bash
pip install imageio-ffmpeg==0.6.0 -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 6.4 上传文件失败

确保 `uploads` 和 `output` 目录存在：

```bash
# Windows
mkdir "f:\TRAE competition Program\uploads"
mkdir "f:\TRAE competition Program\output"

# Linux
mkdir -p /opt/TRAE_competition_Program/{uploads,output}
chmod 755 /opt/TRAE_competition_Program/{uploads,output}
```

---

## 七、服务管理

### 7.1 查看日志

```bash
# 实时查看
tail -f app.log

# 查看最近100行
tail -100 app.log
```

### 7.2 重启服务

```bash
# 终止旧进程
pkill -f "uvicorn app.main"

# 重新启动
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > app.log 2>&1 &
```

---

## 八、功能模块

### 8.1 视频转码模块
- 上传视频文件
- AI识别编码格式
- 自动转码为H.264格式
- 批量转码支持

### 8.2 数据清洗模块
- 上传Excel文件
- AI识别表头
- 自动清洗脏数据
- 重复行检测与移除
- 清洗并合并多文件

### 8.3 学生匹配模块
- 基于班级+姓名的特征指纹匹配
- 合并同一学生多学期成绩
- 追踪转班记录

---

## 九、接口清单

| 接口 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 首页 |
| `/video` | GET | 视频转码页面 |
| `/data` | GET | 数据清洗页面 |
| `/match` | GET | 学生匹配页面 |
| `/api/health` | GET | 健康检查 |
| `/api/video/upload` | POST | 上传视频 |
| `/api/video/transcode` | POST | 视频转码 |
| `/api/data/upload` | POST | 上传Excel |
| `/api/data/clean` | POST | 数据清洗 |
| `/api/data/clean_and_merge` | POST | 清洗并合并 |
| `/api/match/upload` | POST | 上传匹配文件 |
| `/api/match/merge` | POST | 合并记录 |

---

## 十、许可证

本项目仅供教育学习使用，禁止商业用途。