# Python局域网服务器开发计划

## 一、项目概述

开发一个面向中小学教务的AI智能数据清洗+视频转码矫正的Python服务器，支持局域网内所有设备（PC、平板、手机）访问。核心特点：
- **局域网部署**：服务器部署在学校内网，所有设备均可访问
- **纯本地运行**：数据不上传云端，保障学生隐私
- **三大核心模块**：视频转码归一化、Excel数据清洗、学生特征指纹匹配
- **跨设备兼容**：支持PC、平板、手机等多种设备访问

---

## 二、技术架构

### 2.1 技术栈选择

| 层级 | 技术 | 说明 |
|------|------|------|
| Web框架 | FastAPI | 高性能异步Web框架，自动生成API文档 |
| 视频转码 | FFmpeg（服务器端） | 视频编码识别与转码，仅服务器安装 |
| 数据处理 | openpyxl + xlrd | 直接操作Excel文件，轻量级无pandas依赖 |
| 模糊匹配 | fuzzywuzzy + python-Levenshtein | 编辑距离计算 |
| 前端 | HTML5 + CSS3 + JavaScript | 响应式Web界面，适配多设备 |
| 文件存储 | 本地文件系统 | 上传和处理后的文件存储 |
| 网络通信 | HTTP/HTTPS | 局域网内设备访问 |

### 2.2 部署架构说明

- **FFmpeg**：仅在服务器端安装，所有视频转码操作在服务器完成，客户端无需安装
- **Python依赖**：使用国内镜像源（清华大学PyPI镜像）加速安装
- **数据处理**：使用openpyxl/xlrd直接操作Excel，避免pandas的庞大依赖

### 2.2 架构设计

```
┌──────────────────────────────────────────────────────────────────┐
│                      局域网环境                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   PC     │  │  平板    │  │   手机   │  │  其他设备│          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │             │                │
│       └─────────────┴──────┬──────┴─────────────┘                │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Python Server                          │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐    │   │
│  │  │               FastAPI Application                │    │   │
│  │  │                                                  │    │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │    │   │
│  │  │  │ Video API │  │ Data API │  │  Match API     │  │    │   │
│  │  │  │ 视频转码  │  │ 数据清洗 │  │ 学生匹配       │  │    │   │
│  │  │  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │    │   │
│  │  │       │             │                │            │    │   │
│  │  │  ┌────▼─────┐  ┌────▼─────┐  ┌───────▼────────┐  │    │   │
│  │  │  │Transcoder│  │Cleaner   │  │StudentMatcher  │  │    │   │
│  │  │  │视频转码器 │  │数据清洗器│  │学生匹配器     │  │    │   │
│  │  │  └──────────┘  └──────────┘  └────────────────┘  │    │   │
│  │  └──────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌──────────────────┐              │   │
│  │  │   Static Files   │  │   Upload Files   │              │   │
│  │  │  (HTML/CSS/JS)   │  │  (上传文件存储)   │              │   │
│  │  └──────────────────┘  └──────────────────┘              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 三、核心模块设计

### 3.1 AI智能多媒体编码归一化模块

**功能需求**：
- 自动识别MP4、MOV、AVI等各类混乱视频编码
- AI自适应分配转码策略，统一转为H.264通用格式
- 自动修复损坏、不兼容视频文件
- 批量处理支持

**API接口**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/video/upload` | POST | 上传视频文件 |
| `/api/video/transcode` | POST | 转码视频文件 |
| `/api/video/list` | GET | 获取视频列表 |
| `/api/video/download/{id}` | GET | 下载处理后的视频 |

**实现方案**：
```python
class VideoTranscoder:
    def analyze_video(self, file_path):
        # 使用subprocess调用ffprobe分析视频元数据
        # 返回：编码类型、分辨率、帧率、时长等信息
    
    def determine_strategy(self, metadata):
        # 根据视频特征智能选择转码策略
        # 策略：直接复制流（已为H.264）/ 重新编码 / 修复后转码
    
    def transcode(self, input_path, output_path, strategy):
        # 使用subprocess调用ffmpeg执行转码
        # 统一输出：H.264视频编码 + AAC音频编码，MP4容器
    
    def repair_video(self, file_path):
        # 尝试重新封装或帧级修复损坏的视频文件
```

### 3.2 AI智能模糊字段映射清洗模块

**功能需求**：
- 识别无固定格式Excel成绩表
- 自动识别乱列、空列、多余表头
- 自动剔除脏数据、对齐数据字段
- 不限制表格排版

**API接口**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/data/upload` | POST | 上传Excel文件 |
| `/api/data/clean` | POST | 清洗数据 |
| `/api/data/preview/{id}` | GET | 预览数据 |
| `/api/data/download/{id}` | GET | 下载清洗后的Excel |

**实现方案**：
```python
class DataCleaner:
    def detect_header(self, worksheet):
        # 智能检测表头位置（直接操作openpyxl worksheet）
    
    def identify_fields(self, headers):
        # 模糊匹配字段（姓名、学号、班级、各科成绩）
    
    def remove_dirty_data(self, rows):
        # 剔除脏数据、异常值（处理原始行数据）
    
    def standardize_format(self, rows, field_mapping):
        # 标准化输出格式（生成标准化行数据）
```

### 3.3 AI班级姓名特征指纹匹配算法

**功能需求**：
- 以班级+姓名生成独立学生特征指纹
- 同名不同学生自动隔离避免数据错乱
- 识别学生转班记录
- 自动拼接多阶段完整成绩

**API接口**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/match/upload` | POST | 上传多学期Excel文件 |
| `/api/match/process` | POST | 执行学生匹配 |
| `/api/match/result/{id}` | GET | 获取匹配结果 |
| `/api/match/download/{id}` | GET | 下载合并后的Excel |

**实现方案**：
```python
class StudentMatcher:
    def generate_fingerprint(self, class_name, student_name, extra_features=None):
        # 生成学生特征指纹（班级+姓名哈希组合）
        # 返回：唯一指纹字符串
    
    def calculate_similarity(self, fp1, fp2):
        # 计算指纹相似度（编辑距离）
        # 返回：相似度分数(0-100)
    
    def find_duplicates(self, students):
        # 识别同名学生并隔离（基于班级维度区分）
        # 输入：学生字典列表 [{class, name, ...}, ...]
        # 返回：去重后的学生列表
    
    def track_class_changes(self, student_history):
        # 追踪学生转班记录（跨学期数据分析）
        # 输入：多学期学生记录列表
        # 返回：转班信息列表
    
    def merge_records(self, student_records):
        # 合并多阶段成绩记录（基于特征指纹匹配）
        # 输入：多文件学生数据（行列表形式）
        # 返回：合并后的学生完整成绩记录
```

---

## 四、前端界面设计

### 4.1 页面结构

| 页面 | 功能 | 文件路径 |
|------|------|----------|
| index.html | 首页/导航 | `static/index.html` |
| video.html | 视频转码 | `static/video.html` |
| data.html | 数据清洗 | `static/data.html` |
| match.html | 学生匹配 | `static/match.html` |

### 4.2 响应式设计要点

根据经验回顾，需要注意：
1. **布局适配**：桌面端网格布局，移动端列表布局
2. **触摸目标**：按钮、输入框尺寸>=40px
3. **安全区适配**：移动端safe-area-inset
4. **视频播放**：增加playsinline属性，避免强制全屏
5. **事件模型统一**：使用事件委托或onclick，避免多种方式并存

### 4.3 核心交互流程

**视频转码流程**：
```
选择文件 → 上传 → 分析编码 → 显示策略 → 开始转码 → 进度显示 → 下载结果
```

**数据清洗流程**：
```
选择文件 → 上传 → 预览数据 → 字段映射确认 → 开始清洗 → 预览结果 → 下载
```

**学生匹配流程**：
```
选择多文件 → 上传 → 显示学生列表 → 匹配确认 → 执行匹配 → 显示结果 → 下载
```

---

## 五、项目目录结构

```
AI-Edu-Server/
├── .trae/
│   └── documents/
│       ├── AI-Edu-Data-Cleaner_plan.md
│       └── Python-Server-Plan.md
├── app/                           # 主应用
│   ├── main.py                    # FastAPI入口
│   ├── routes/                    # API路由
│   │   ├── video.py               # 视频转码API
│   │   ├── data.py                # 数据清洗API
│   │   └── match.py               # 学生匹配API
│   ├── services/                  # 核心服务
│   │   ├── video_transcoder.py    # 视频转码器
│   │   ├── data_cleaner.py        # 数据清洗器
│   │   └── student_matcher.py     # 学生匹配器
│   ├── algorithms/                # AI算法
│   │   ├── field_matching.py      # 字段匹配算法
│   │   ├── fingerprint.py         # 特征指纹算法
│   │   └── similarity.py          # 相似度计算
│   ├── utils/                     # 工具函数
│   │   ├── ffmpeg_wrapper.py      # FFmpeg封装
│   │   ├── excel_parser.py        # Excel解析
│   │   └── file_utils.py          # 文件工具
│   └── static/                    # 静态文件
│       ├── index.html             # 首页
│       ├── video.html             # 视频转码页
│       ├── data.html              # 数据清洗页
│       ├── match.html             # 学生匹配页
│       ├── css/                   # 样式文件
│       └── js/                    # JavaScript文件
├── uploads/                       # 上传文件目录
├── outputs/                       # 输出文件目录
├── requirements.txt               # Python依赖
└── README.md                      # 说明文档
```

---

## 六、开发步骤

### 阶段一：项目初始化（第1天）

1. 创建项目目录结构
2. 安装Python依赖（FastAPI、pandas、ffmpeg-python等）
3. 初始化FastAPI项目
4. 配置文件上传和输出目录

### 阶段二：核心算法模块开发（第2-4天）

1. 实现视频转码模块（编码识别、转码策略、损坏修复）
2. 实现数据清洗模块（表头识别、字段映射、脏数据检测）
3. 实现学生匹配模块（特征指纹、相似度计算、转班追踪）
4. 编写单元测试

### 阶段三：API接口开发（第5-6天）

1. 实现视频转码API（上传、转码、列表、下载）
2. 实现数据清洗API（上传、清洗、预览、下载）
3. 实现学生匹配API（上传、匹配、结果、下载）
4. 添加异常处理和日志记录

### 阶段四：前端界面开发（第7-9天）

1. 实现首页导航
2. 实现视频转码页面（响应式设计，支持移动端）
3. 实现数据清洗页面（表格预览、字段映射）
4. 实现学生匹配页面（多文件上传、匹配结果展示）
5. 优化移动端交互体验

### 阶段五：测试与优化（第10天）

1. 局域网内多设备测试
2. 性能优化（大文件处理、并发请求）
3. 错误处理和边界情况测试
4. 文档编写

---

## 七、关键依赖

### 7.1 Python依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| fastapi | ^0.104.0 | Web框架 |
| uvicorn | ^0.24.0 | ASGI服务器 |
| openpyxl | ^3.1.0 | Excel读写(.xlsx) |
| xlrd | ^2.0.0 | 旧版Excel支持(.xls) |
| fuzzywuzzy | ^0.18.0 | 模糊匹配 |
| python-Levenshtein | ^0.21.0 | 编辑距离 |
| python-multipart | ^0.0.6 | 文件上传 |

### 7.2 外部工具

| 工具 | 用途 |
|------|------|
| FFmpeg | 视频转码（仅服务器端安装，需添加到系统PATH） |

### 7.3 国内镜像源配置

**安装命令**：
```bash
# 使用清华大学PyPI镜像安装所有依赖
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --trusted-host pypi.tuna.tsinghua.edu.cn

# 或使用阿里云镜像
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
```

**pip全局配置（推荐）**：

创建或修改 `pip.ini`（Windows）或 `pip.conf`（Linux/macOS）：

```ini
[global]
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
trusted-host = pypi.tuna.tsinghua.edu.cn
```

**Windows路径**：`%APPDATA%\pip\pip.ini`
**Linux/macOS路径**：`~/.config/pip/pip.conf` 或 `~/.pip/pip.conf`

---

## 八、局域网部署说明

### 8.1 服务器端部署步骤

1. **安装Python环境**：
   - 安装Python 3.10+（推荐3.11）
   - 确保已配置pip国内镜像源

2. **安装FFmpeg**（仅服务器端）：
   ```bash
   # Windows：下载FFmpeg并添加到系统PATH
   # 下载地址：https://ffmpeg.org/download.html

   # Linux（Ubuntu/Debian）
   sudo apt update && sudo apt install ffmpeg

   # macOS（使用Homebrew）
   brew install ffmpeg
   ```

3. **验证FFmpeg安装**：
   ```bash
   ffmpeg -version
   ```

4. **安装Python依赖**：
   ```bash
   # 使用清华大学镜像安装
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
   ```

5. **获取局域网IP**：
   ```bash
   # Windows
   ipconfig
   # Linux/macOS
   ifconfig
   ```

6. **启动服务器**：
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 8.2 客户端访问（无需安装任何软件）

- 服务器本机：`http://localhost:8000`
- 局域网其他设备：`http://服务器IP:8000`

**支持的客户端设备**：
- PC浏览器（Chrome、Firefox、Edge等）
- 平板浏览器（Safari、Chrome等）
- 手机浏览器（Safari、Chrome、微信内置浏览器等）

### 8.3 端口配置

- 默认端口：8000
- 可通过环境变量 `PORT` 自定义
- 确保防火墙允许该端口入站连接

---

## 九、潜在风险与应对

| 风险 | 应对措施 |
|------|----------|
| FFmpeg未安装 | 在启动时检测FFmpeg是否可用，给出明确提示 |
| 大文件上传超时 | 配置较大的上传超时时间和文件大小限制 |
| 并发转码性能 | 实现任务队列，限制同时转码数量 |
| Excel格式千变万化 | 设计灵活的字段识别算法，支持多种格式 |
| 同名学生匹配冲突 | 引入班级维度、特征指纹算法 |
| 移动端兼容性 | 响应式设计，测试主流手机浏览器 |

---

## 十、验证标准

1. **局域网访问测试**：在PC、平板、手机上均可正常访问服务器
2. **视频转码测试**：导入10种不同编码格式视频，验证全部成功转码为H.264
3. **数据清洗测试**：导入5种不同格式Excel成绩表，验证字段正确识别和数据标准化
4. **学生匹配测试**：导入包含同名学生、转班记录的多学期数据，验证匹配准确率>99%
5. **批量处理测试**：同时处理10个文件，验证进度显示正常、无崩溃

---

## 十一、输出物

1. 完整的Python服务器源代码
2. 响应式Web前端界面
3. API文档（FastAPI自动生成）
4. 部署说明文档

---

**计划版本**：v1.1  
**创建日期**：2026-07-04  
**更新说明**：
1. 移除pandas/numpy依赖，改用openpyxl+xlrd直接操作Excel
2. 移除ffmpeg-python依赖，改用subprocess直接调用ffmpeg命令行
3. 添加国内镜像源配置说明（清华大学PyPI镜像）
4. 明确FFmpeg仅服务器端安装，客户端无需安装任何软件