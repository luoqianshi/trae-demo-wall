# PPT 同步系统 部署与使用说明

一套三端 PPT 同步系统：演讲者端控制 PowerPoint 放映，观众通过手机扫码实时观看同步翻页。

## 系统架构

```
演讲者端 (Windows)              服务器端 (Linux)              观众端 (手机/电脑浏览器)
PySide6 + pywin32               FastAPI + LibreOffice          纯 HTML/JS
控制真实 PowerPoint 放映         PPT 转图片 + WebSocket 推送
        │                              │                              │
        │  1. 上传 PPT (HTTP)           │                              │
        ├─────────────────────────────>│                              │
        │  2. 返回 session_id          │                              │
        │<─────────────────────────────┤                              │
        │  显示二维码(观众链接)          │                              │
        │                              │   3. 扫码打开观众页            │
        │                              │<─────────────────────────────┤
        │                              │   4. WebSocket 连接           │
        │                              │<─────────────────────────────┤
        │  5. 开始放映，翻页时上报页码    │                              │
        ├─────────────────────────────>│                              │
        │                              │   6. 广播页码给所有观众        │
        │                              ├─────────────────────────────>│
        │                              │   7. 观众加载对应图片          │
```

### 三端职责

| 角色 | 运行环境 | 职责 |
|------|---------|------|
| 服务器端 | Linux | 中转：接收 PPT、转图片、WebSocket 推送 |
| 演讲者端 | Windows + PowerPoint | 上传 PPT、控制放映、同步翻页 |
| 观众端 | 任意浏览器 | 扫码进入，实时观看 |

## 文件结构

```
ppttb/
├── server/                        服务器端
│   ├── converter.py               PPT→PDF→PNG 转换 (LibreOffice + PyMuPDF)
│   ├── main.py                    FastAPI 主服务
│   ├── requirements.txt           服务器依赖
│   └── static/
│       └── audience.html          观众页
└── presenter/                     演讲者端
    ├── controller.py              PySide6 界面 + COM 控制 + 上传 + 二维码
    └── requirements.txt           演讲者端依赖
```

## 服务器端部署

### 1. 上传文件

将 `server/` 目录上传到 Linux 服务器，例如 `/opt/ppttb/server/`。

### 2. 安装系统依赖

```bash
sudo apt update
sudo apt install -y libreoffice-impress libreoffice-core
sudo apt install -y fonts-noto-cjk fonts-wqy-zenhei   # 中文字体，避免转换乱码
```

### 3. 安装 Python 依赖

```bash
cd /opt/ppttb/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. 放行端口

```bash
sudo ufw allow 8427
```

云服务器（阿里云/腾讯云等）还需在**控制台安全组**添加入方向规则：TCP 8427。

### 5. 启动服务

前台运行（测试用）：

```bash
cd /opt/ppttb/server
source .venv/bin/activate
python main.py
```

后台常驻（推荐，systemd）：

创建 `/etc/systemd/system/ppttb.service`：

```ini
[Unit]
Description=PPT Sync Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/ppttb/server
ExecStart=/opt/ppttb/server/.venv/bin/python main.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ppttb
sudo systemctl status ppttb          # 查看状态
journalctl -u ppttb -f               # 实时日志
```

### 6. 验证服务

服务器本机执行：

```bash
curl http://127.0.0.1:8427/audience/test
```

返回 HTML 内容即正常。在局域网内其他机器浏览器打开：

```
http://<服务器IP>:8427/audience/test
```

看到黑底观众页（提示"会话不存在"是正常的）说明服务完全 OK。

### 获取服务器 IP

```bash
ip addr          # 找到局域网 IP，如 192.168.202.152
```

## 演讲者端部署

### 环境要求

- Windows 10/11
- 已安装 Microsoft PowerPoint
- 与服务器在同一局域网（或可访问服务器 IP）

### 1. 安装依赖

```powershell
cd d:\ppttb\presenter
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 启动

```powershell
.venv\Scripts\activate
python controller.py
```

## 使用流程

### 演讲者操作

1. 启动 `controller.py`，桌面程序打开
2. 「服务器」输入框填服务器地址，例如 `http://192.168.202.152:8427`
3. 点「选择 PPT」选择本地 PPT 文件
4. 点「上传并生成二维码」：
   - PPT 上传到服务器
   - 服务器自动转换为图片
   - 完成后显示二维码和观众链接
5. 让观众扫描屏幕上的二维码进入观众页
6. 点「开始放映」：
   - 程序自动打开 PowerPoint 放映
   - 此后翻页会自动同步给所有观众

### 翻页控制

开始放映后，三种方式都可以翻页：

- 点击程序界面的「上一页」「下一页」按钮
- 用翻页笔/无线遥控器操作 PowerPoint
- 直接在 PowerPoint 放映窗口用键盘（方向键/空格/Page Up/Down）

无论哪种方式，程序每 500ms 检测当前页码，变化后自动上报服务器。

### 异常处理

- **同步中断**：点「重连同步」按钮，无需重新上传，重新上报当前页码
- **结束放映**：点「结束放映」按钮，会通知所有观众显示"放映已结束"，关闭 PowerPoint，可重新开始一场

### 观众操作

- 用手机扫描演讲者屏幕上的二维码
- 或手动在浏览器输入观众链接 `http://<服务器IP>:8427/audience/<会话ID>`
- 打开后自动实时同步，演讲者翻到哪页，观众看到哪页
- 断线后重新扫码进入即可

## 常见问题

### 服务起不来 / 网页打不开

1. 服务器终端检查是否有 `Uvicorn running on http://0.0.0.0:8427`
2. 服务器本机 `curl http://127.0.0.1:8427/audience/test` 测试
3. 检查防火墙：`sudo ufw status`
4. 云服务器检查安全组规则
5. 确认演讲者电脑和服务器在同一网络

### 上传 PPT 卡住

常见原因：

- **LibreOffice 首次启动慢**：第一次转换可能需 1-2 分钟，耐心等待
- **PPT 过大**：几十 MB 或页数多+图多，转换耗时较长
- **LibreOffice 进程锁**：异常退出会残留进程

```bash
pkill -f soffice        # 清理残留进程
```

- **缺中文字体**：安装 `fonts-noto-cjk fonts-wqy-zenhei`

单独测试转换：

```bash
soffice --headless --convert-to pdf --outdir /tmp 测试.pptx
```

### PowerPoint 打不开 / COM 报错

- 确认演讲者电脑已安装 Microsoft PowerPoint（WPS 不支持）
- 确认 PPT 文件没被其他程序占用
- 重新启动演讲者程序

### 观众端看不到翻页

- 确认演讲者程序「开始放映」已点（状态显示"放映已开始，自动同步中"）
- 确认服务器终端能看到 `POST /sync/...` 日志
- 观众重新扫码进入
- 点「重连同步」按钮强制同步当前页

### 二维码扫不开

- 演讲者端「服务器」地址必须是**手机能访问的 IP**，不能用 `127.0.0.1`
- 手机要和服务器在同一局域网/WiFi

## 技术依赖

### 服务器端

| 依赖 | 用途 |
|------|------|
| fastapi | Web 框架 |
| uvicorn | ASGI 服务器 |
| PyMuPDF | PDF 转 PNG |
| python-multipart | 文件上传支持 |
| libreoffice | PPT 转 PDF（系统依赖） |

### 演讲者端

| 依赖 | 用途 |
|------|------|
| PySide6 | GUI 框架 |
| requests | HTTP 请求 |
| pywin32 | PowerPoint COM 自动化 |
| qrcode | 二维码生成 |
| pillow | 图片处理（qrcode 依赖） |

## 端口与路径说明

- 服务端口：**8427**（如需修改，改 `server/main.py` 末尾 `uvicorn.run` 的 `port` 参数，以及 `presenter/controller.py` 默认地址）
- 演讲者上传：`POST /upload`
- 演讲者同步：`POST /sync/{session_id}?index=N`
- 演讲者结束：`POST /end/{session_id}`
- 观众 WebSocket：`ws://<IP>:8427/ws/{session_id}`
- 观众页面：`GET /audience/{session_id}`
- 图片资源：`GET /slides/{session_id}/{index}.png`
