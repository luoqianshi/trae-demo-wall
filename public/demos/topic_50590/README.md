# 🤖 智能错题本 (Smart Error Book)

> AI 驱动的通用智能刷题/错题本工具，支持拍照识别题目、AI 解答、举一反三、任意文本导入、AI 自动生成知识目录。

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-2.3+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特性

- 📷 **拍照识别** - 多模态 AI 自动识别图片中的题目（手写/印刷均可）
- 📥 **文本导入** - 粘贴任意格式纯文本，AI 自动解析题目、答案、选项
- 🗂️ **AI 知识目录** - 批量扫描题库，自动生成层次化知识点目录
- ⚡ **AI 解答** - 单题 AI 深度解析（知识点、解题思路、易错点）
- 💡 **举一反三** - 基于错题自动生成相似练习题
- ❌ **错题本** - 自动收录错题，支持标记"已掌握"
- 📝 **灵感笔记** - 随时记录学习心得
- 📂 **分类管理** - 自定义分类整理题目
- 🔐 **首次配置向导** - API Key 等配置通过网页填写，不硬编码
- 📱 **移动端适配** - 响应式设计，手机/平板均可使用
- ⌨️ **键盘快捷键** - 高效刷题体验

## 🚀 快速开始

### 环境要求
- Python 3.8+
- pip

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 启动服务
```bash
python server.py
```

启动后访问 http://localhost:5000

### 3. 首次配置
首次打开页面会自动弹出配置向导，填写：
- **API Key**（必填）：你的 OpenAI 兼容 API 密钥
- **API 地址**：OpenAI 兼容接口地址（如 `https://api.openai.com/v1`）
- **文字模型**：文本模型名称（如 `gpt-4o-mini`、`deepseek-chat`、`doubao-pro` 等）
- **多模态模型**：图片识别模型名称（如 `gpt-4o`）

配置保存后即可使用。配置信息存储在 `config.json`（已加入 `.gitignore`，不会泄露）。

### 4. 云端同步（可选）
在侧边栏「⚙️ 设置」→「☁️ 云端同步」中配置：
- **远端服务器地址**：另一台机器的访问地址（如 `http://YOUR_SERVER_IP:5000`）
- **同步密码（Token）**：两端填相同密码，防止他人访问数据

配置后可一键「推送到服务器」或「从服务器拉取」，支持合并/覆盖模式。**不填写则完全本地运行**，不会发起任何外部网络连接。

## 🔒 安全特性

- **本地加密存储**：API Key、同步密码等敏感字段使用基于机器特征（主机名+用户名+MAC地址）派生的密钥，通过 PBKDF2 + 异或流加密后存储在 config.json 中，即使文件泄露也无法在其他机器上解密
- **脱敏返回**：所有 API 不返回明文密钥，仅显示末 4 位
- **同源鉴权**：数据备份/同步接口在设置 Token 后会拒绝跨域未授权请求
- **安全响应头**：自动添加 X-Content-Type-Options、X-Frame-Options、Referrer-Policy
- **文件权限**：config.json 在支持的系统上自动设置为仅所有者可读写（0o600）
- **CORS 限制**：默认只允许同源访问，不配置远端地址时拒绝跨域请求

## 📁 项目结构

```
xuexitong-quiz/
├── server.py              # Flask 后端（AI 接口 + 数据 API）
├── parse_questions.py     # MHTML/HTML 题库解析工具（可选）
├── requirements.txt       # Python 依赖
├── templates/
│   └── index.html         # 前端单页应用
├── uploads/               # 上传图片（自动创建）
├── questions.json         # 题库数据（运行时生成）
├── notes.json             # 笔记数据（运行时生成）
├── categories.json        # 分类数据（运行时生成）
├── knowledge.json         # 知识点目录（运行时生成）
├── config.json            # 配置文件（用户自行创建，含 API Key）
└── .gitignore
```

## 🔧 API 接口

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/` | 主页面 |
| GET | `/api/status` | 检查配置状态 |
| GET/POST | `/api/config` | 获取/保存配置 |
| GET | `/api/questions` | 获取题目列表（支持 chapter/type/wrong/mastered/category/kp 筛选） |
| POST | `/api/questions` | 新增题目 |
| PUT | `/api/questions/<id>` | 更新题目（标记错题/已掌握） |
| DELETE | `/api/questions/<id>` | 删除题目 |
| GET | `/api/stats` | 学习统计 |
| POST | `/api/ocr` | AI 拍照识别题目 |
| POST | `/api/ai/solve` | AI 解答题目 |
| POST | `/api/ai/similar` | AI 举一反三 |
| POST | `/api/import_text` | 通用文本批量导入 |
| POST | `/api/batch_catalog_stream` | AI 批量生成知识目录（SSE 流式） |
| GET/POST | `/api/notes` | 笔记列表/新增 |
| DELETE | `/api/notes/<id>` | 删除笔记 |
| GET/POST | `/api/categories` | 分类列表/新增 |
| PUT/DELETE | `/api/categories/<id>` | 更新/删除分类 |

## 🖥️ 部署

### 本地运行
```bash
python server.py
# 默认端口 5000，可在 config.json 中修改 port 字段
```

### 服务器部署（Linux + systemd）
```bash
# 1. 上传代码到服务器
# 2. 安装依赖
pip3 install -r requirements.txt

# 3. 创建 systemd 服务
# /etc/systemd/system/smart-error-book.service
[Unit]
Description=Smart Error Book
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/xuexitong-quiz
ExecStart=/usr/bin/python3 /path/to/xuexitong-quiz/server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target

# 4. 启动服务
systemctl enable smart-error-book
systemctl start smart-error-book
```

然后在浏览器访问 `http://服务器IP:5000`，在配置页面填入你的 API Key 即可。

## 🔑 支持的 AI 服务

任何兼容 OpenAI API 格式的服务均可使用，包括但不限于：
- OpenAI (GPT-4o, GPT-4o-mini 等)
- MiMo / 小米大模型
- DeepSeek
- 通义千问 / Qwen
- 智谱 GLM
- 月之暗面 Kimi
- 本地部署的 Ollama
- 其他 OneAPI / NewAPI 中转服务

只需修改配置页面中的 **API 地址** 和 **模型名称** 即可切换。

## ⚠️ 注意事项

- `config.json` 包含 API Key，**切勿**提交到公开仓库
- 首次使用需自行提供有效的 API Key
- 所有数据存储在本地 JSON 文件中，请注意备份

## 📄 License

MIT
