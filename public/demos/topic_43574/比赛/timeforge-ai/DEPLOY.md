# TimeForge AI - 部署文档

本文档介绍 TimeForge AI 学习任务管理系统的安装、配置与部署流程。

---

## 环境要求

| 环境 | 版本要求 |
|------|----------|
| Python | 3.8 或更高版本 |
| 操作系统 | Windows / macOS / Linux |
| 内存 | 256MB 以上 |
| 磁盘空间 | 50MB 以上 |

---

## 安装步骤

### 1. 获取项目代码

将项目代码解压到目标目录，例如：

```bash
# Linux / macOS
mkdir -p ~/projects/timeforge-ai
cp -r timeforge-ai/* ~/projects/timeforge-ai/

# Windows
# 将 timeforge-ai 文件夹复制到目标位置，例如 C:\projects\timeforge-ai\
```

### 2. 创建虚拟环境（推荐）

```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 3. 安装 Python 依赖

```bash
cd timeforge-ai
pip install -r requirements.txt
```

依赖清单：

```
flask
flask-cors
```

---

## 数据库初始化

TimeForge AI 使用 SQLite 3 作为数据库，无需额外安装数据库服务。首次运行时，数据库文件 `timeforge.db` 将自动创建。

### 填充演示数据（推荐）

```bash
python seed_data.py
```

该命令将执行以下操作：

1. 创建数据库表结构（users、tasks、activities）
2. 创建演示用户（demo_user，等级 Lv.5）
3. 创建 7 个演示任务（涵盖多种任务类型和状态）
4. 生成 31 天历史活动记录

运行成功后，控制台输出示例：

```
演示数据填充完成！
  - 用户: demo_user (等级5, 战力2340, 连续12天)
  - 任务: 7 个（涵盖实验报告/课程设计/考试复习/英语四级/考研复习/竞赛项目/其他）
  - 活动记录: 31 天
```

### 重置数据库

如需重新初始化数据，只需再次运行 `python seed_data.py` 即可，脚本会自动清空已有数据并重新填充。

---

## 启动服务

### 开发模式启动

```bash
python app.py
```

启动后控制台输出：

```
==================================================
  TimeForge AI - 学习任务管理系统后端
  启动地址: http://0.0.0.0:5000
  仪表盘:   http://localhost:5000/
==================================================
```

访问 http://localhost:5000/ 即可打开系统首页。

### 指定端口启动

修改 `app.py` 文件末尾的 `app.run()` 参数：

```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

### 局域网访问

由于服务默认监听 `0.0.0.0`，同一局域网内的其他设备可通过本机 IP 地址访问，例如：

```
http://192.168.1.100:5000/
```

---

## 生产环境部署建议

### 使用 Gunicorn 部署（Linux / macOS）

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动服务（4 个 worker 进程）
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 使用 Waitress 部署（Windows）

```bash
# 安装 Waitress
pip install waitress

# 创建启动脚本 run_prod.py
```

在项目根目录创建 `run_prod.py`：

```python
from waitress import serve
from app import app

serve(app, host='0.0.0.0', port=5000)
```

然后运行：

```bash
python run_prod.py
```

### 使用 Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static/ {
        alias /path/to/timeforge-ai/static/;
        expires 7d;
    }
}
```

---

## 常见问题

### Q1: 启动时提示 "ModuleNotFoundError: No module named 'flask'"

**A**: 请确保已安装依赖：

```bash
pip install -r requirements.txt
```

如果使用了虚拟环境，请确认已激活虚拟环境。

### Q2: 端口 5000 被占用

**A**: 修改 `app.py` 中的端口号，或将占用端口的进程关闭：

```bash
# Windows - 查找占用 5000 端口的进程
netstat -ano | findstr :5000

# Linux / macOS - 查找占用 5000 端口的进程
lsof -i :5000
```

### Q3: 数据库文件在哪里？

**A**: 数据库文件 `timeforge.db` 位于项目根目录下，由 `database.py` 自动创建。首次运行 `seed_data.py` 或 `app.py` 时自动生成。

### Q4: 如何备份数据？

**A**: 直接复制 `timeforge.db` 文件即可完成备份。SQLite 数据库是单文件形式，无需额外操作。

### Q5: 模板页面无法渲染，返回 JSON 数据？

**A**: 请确保 `templates/` 目录存在且包含所有模板文件。系统设计为模板缺失时自动降级为 JSON 响应，不会导致服务崩溃。

### Q6: 如何添加新的任务类型？

**A**: 编辑 `app.py` 中的以下变量：

- `SUBTASK_TEMPLATES`：添加新任务类型的子任务模板
- `ESTIMATED_HOURS_MAP`：设置新任务类型的预估工时
- `ASSISTANT_ADVICE`：添加新任务类型的 AI 建议