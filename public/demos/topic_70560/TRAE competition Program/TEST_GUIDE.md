# AI教务智能处理系统 - 功能清单与测试说明

## 一、功能清单

### 1. 视频转码模块 (Video Transcoder)

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/video/upload` | POST | 上传视频文件 |
| `/api/video/transcode` | POST | 上传并转码视频为H.264格式 |
| `/api/video/batch` | POST | 批量转码多个视频文件 |
| `/api/video/list` | GET | 获取已上传和已处理的视频列表 |
| `/api/video/info/{filename}` | GET | 获取视频详细信息（编码、分辨率等） |
| `/api/video/download/{filename}` | GET | 下载转码后的视频文件 |

**核心能力**：
- AI智能识别视频编码格式
- 自动检测是否需要转码（非H.264格式自动转码）
- 支持多种输入格式：MP4、MOV、AVI、MKV、FLV、WMV、WebM
- 统一输出为H.264编码的MP4格式
- 视频修复功能（修复损坏/不兼容的视频文件）
- 批量处理支持

### 2. 数据清洗模块 (Data Cleaner)

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/data/upload` | POST | 上传Excel数据文件 |
| `/api/data/analyze` | POST | 分析Excel文件结构 |
| `/api/data/clean` | POST | 清洗数据并标准化输出 |
| `/api/data/batch` | POST | 批量清洗多个Excel文件 |
| `/api/data/list` | GET | 获取已上传和已处理的数据文件列表 |
| `/api/data/download/{filename}` | GET | 下载清洗后的数据文件 |

**核心能力**：
- AI智能识别Excel表头和字段
- 自动映射混乱字段到标准字段
- 自动剔除脏数据、空行、无效数据
- 支持xlsx和xls格式
- 标准化输出字段：学号、姓名、班级、科目、成绩等
- 批量处理支持

### 3. 学生匹配模块 (Student Matcher)

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/api/match/upload` | POST | 上传匹配用的Excel文件 |
| `/api/match/find_duplicates` | POST | 在单个文件中查找重复学生 |
| `/api/match/merge` | POST | 合并多个文件中的学生记录 |
| `/api/match/track_changes` | POST | 追踪学生转班记录 |
| `/api/match/list` | GET | 获取已上传和已处理的匹配文件列表 |
| `/api/match/download/{filename}` | GET | 下载匹配结果文件 |

**核心能力**：
- 基于"班级+姓名"特征指纹的精准匹配算法
- 同名不同学生自动隔离（通过班级区分）
- 识别并合并同一学生的多阶段成绩记录
- 追踪学生转班记录
- 检测重复数据

### 4. 系统接口

| API路径 | HTTP方法 | 功能描述 |
|---------|----------|----------|
| `/` | GET | 首页 |
| `/video` | GET | 视频转码页面 |
| `/data` | GET | 数据清洗页面 |
| `/match` | GET | 学生匹配页面 |
| `/api/health` | GET | 健康检查（含FFmpeg状态） |

---

## 二、测试环境准备

### 1. 启动服务器

```bash
cd "f:\TRAE competition Program"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. 确认服务器运行

```bash
python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health').read().decode())"
```

预期输出：
```json
{"status":"healthy","version":"1.0.0","ffmpeg_available":true}
```

### 3. 准备测试文件

**视频测试文件**（任选一种或多种）：
- MP4格式视频（可直接用手机录制）
- MOV格式视频（iPhone录制）
- AVI格式视频
- 任意其他格式视频

**Excel测试文件**：
- 创建包含学生成绩的Excel文件（xlsx或xls格式）
- 表头可混乱，包含：学号、姓名、班级、科目、成绩等字段

---

## 三、详细测试步骤

### 测试1：健康检查

**目的**：验证服务器和FFmpeg是否正常运行

```bash
python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health').read().decode())"
```

**预期结果**：
- `status`: "healthy"
- `version`: "1.0.0"
- `ffmpeg_available`: true

### 测试2：视频转码 - 单个视频转码

**目的**：验证视频上传和转码功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/video/transcode'
files = {'file': open('test_video.mp4', 'rb')}  # 替换为你的测试视频路径

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- HTTP状态码：200
- `success`: true
- 返回output_path、strategy、message等信息

### 测试3：视频转码 - 获取视频信息

**目的**：验证视频信息分析功能

```bash
python -c "
import requests

# 先上传视频
upload_url = 'http://localhost:8000/api/video/upload'
files = {'file': open('test_video.mp4', 'rb')}
response = requests.post(upload_url, files=files)
print('Upload:', response.json())

# 获取视频信息
filename = 'test_video.mp4'
info_url = f'http://localhost:8000/api/video/info/{filename}'
response = requests.get(info_url)
print('Info:', response.json())
"
```

**预期结果**：
- 返回视频的duration、video_codec、audio_codec、resolution、width、height、frame_rate、bit_rate等信息

### 测试4：视频转码 - 批量转码

**目的**：验证批量视频转码功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/video/batch'
files = [
    ('files', open('video1.mp4', 'rb')),
    ('files', open('video2.mp4', 'rb'))
]

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- 返回批量处理结果列表
- 每个视频的处理状态

### 测试5：视频转码 - 获取文件列表

**目的**：验证文件列表功能

```bash
python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/video/list').read().decode())"
```

**预期结果**：
- 返回uploaded和processed两个列表
- 包含已上传和已处理的视频文件名

### 测试6：数据清洗 - 数据清洗功能

**目的**：验证Excel数据清洗功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/data/clean'
files = {'file': open('test_data.xlsx', 'rb')}  # 替换为你的测试Excel路径

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- HTTP状态码：200
- `success`: true
- 返回original_rows、cleaned_rows、removed_rows、field_mapping、standardized_headers等信息

### 测试7：数据清洗 - 数据分析功能

**目的**：验证Excel文件分析功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/data/analyze'
files = {'file': open('test_data.xlsx', 'rb')}

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- 返回文件分析结果，包括表头信息、字段映射建议等

### 测试8：学生匹配 - 查找重复学生

**目的**：验证重复学生检测功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/match/find_duplicates'
files = {'file': open('test_data.xlsx', 'rb')}

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- 返回重复学生列表及匹配相似度

### 测试9：学生匹配 - 合并记录

**目的**：验证多文件学生记录合并功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/match/merge'
files = [
    ('files', open('data1.xlsx', 'rb')),
    ('files', open('data2.xlsx', 'rb'))
]

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- 返回合并结果，包括合并后的学生总数、重复信息等

### 测试10：学生匹配 - 追踪转班记录

**目的**：验证学生转班记录追踪功能

```bash
python -c "
import requests

url = 'http://localhost:8000/api/match/track_changes'
files = [
    ('files', open('grade1.xlsx', 'rb')),
    ('files', open('grade2.xlsx', 'rb'))
]

response = requests.post(url, files=files)
print(response.status_code)
print(response.json())
"
```

**预期结果**：
- 返回学生转班记录、新增学生、流失学生等信息

### 测试11：前端页面访问

**目的**：验证前端页面可正常访问

```bash
python -c "
import urllib.request

# 测试首页
index = urllib.request.urlopen('http://localhost:8000/').read().decode()
print('首页长度:', len(index))

# 测试视频页面
video = urllib.request.urlopen('http://localhost:8000/video').read().decode()
print('视频页面长度:', len(video))

# 测试数据页面
data = urllib.request.urlopen('http://localhost:8000/data').read().decode()
print('数据页面长度:', len(data))

# 测试匹配页面
match = urllib.request.urlopen('http://localhost:8000/match').read().decode()
print('匹配页面长度:', len(match))
"
```

**预期结果**：
- 所有页面返回200状态码
- 返回HTML内容长度大于0

### 测试12：错误处理 - 上传不支持的文件格式

**目的**：验证错误处理功能

```bash
python -c "
import requests

# 测试上传非视频文件到视频接口
url = 'http://localhost:8000/api/video/upload'
files = {'file': open('test.txt', 'rb')}

response = requests.post(url, files=files)
print('视频接口错误处理:', response.status_code, response.json())

# 测试上传非Excel文件到数据接口
url = 'http://localhost:8000/api/data/upload'
files = {'file': open('test.txt', 'rb')}

response = requests.post(url, files=files)
print('数据接口错误处理:', response.status_code, response.json())
"
```

**预期结果**：
- 返回400状态码
- 返回错误信息，说明不支持的文件类型

---

## 四、测试用例汇总

| 测试编号 | 测试名称 | 测试方法 | 预期结果 |
|----------|----------|----------|----------|
| T1 | 健康检查 | GET /api/health | 返回healthy状态，ffmpeg_available为true |
| T2 | 视频转码 | POST /api/video/transcode | 转码成功，生成H.264格式MP4 |
| T3 | 视频信息 | GET /api/video/info/{filename} | 返回视频元数据 |
| T4 | 批量转码 | POST /api/video/batch | 多个视频批量处理成功 |
| T5 | 视频列表 | GET /api/video/list | 返回上传和处理列表 |
| T6 | 数据清洗 | POST /api/data/clean | 清洗成功，标准化输出 |
| T7 | 数据分析 | POST /api/data/analyze | 返回文件结构分析 |
| T8 | 查找重复 | POST /api/match/find_duplicates | 返回重复学生列表 |
| T9 | 合并记录 | POST /api/match/merge | 多文件合并成功 |
| T10 | 追踪转班 | POST /api/match/track_changes | 返回转班记录 |
| T11 | 前端页面 | GET /, /video, /data, /match | 返回HTML页面 |
| T12 | 错误处理 | 上传不支持格式 | 返回400错误 |

---

## 五、测试结果记录

### 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器地址 | http://localhost:8000 |
| 健康检查 | ✅ |
| FFmpeg可用 | ✅ |
| 版本 | 1.0.0 |

### 测试结果

| 测试编号 | 测试名称 | 状态 | 备注 |
|----------|----------|------|------|
| T1 | 健康检查 | | |
| T2 | 视频转码 | | |
| T3 | 视频信息 | | |
| T4 | 批量转码 | | |
| T5 | 视频列表 | | |
| T6 | 数据清洗 | | |
| T7 | 数据分析 | | |
| T8 | 查找重复 | | |
| T9 | 合并记录 | | |
| T10 | 追踪转班 | | |
| T11 | 前端页面 | | |
| T12 | 错误处理 | | |

---

## 六、附录

### 测试数据准备建议

**视频测试文件**：
1. 使用手机录制一段10-30秒的视频（MP4格式）
2. 如果有其他格式视频（MOV、AVI等）也可用于测试

**Excel测试文件示例**：

| 序号 | 姓名 | 班级 | 学号 | 语文 | 数学 | 英语 |
|------|------|------|------|------|------|------|
| 1 | 张三 | 初一1班 | 2024001 | 85 | 92 | 88 |
| 2 | 李四 | 初一1班 | 2024002 | 78 | 85 | 90 |
| 3 | 王五 | 初一2班 | 2024003 | 90 | 88 | 92 |
| 4 | 张三 | 初一2班 | 2024004 | 82 | 79 | 85 |

**注意**：第4行的"张三"与第1行同名但不同班级，测试匹配算法应能正确区分。

### 常见问题排查

**Q: FFmpeg不可用**
- A: 确保已安装imageio-ffmpeg：`pip install imageio-ffmpeg`

**Q: 视频转码失败**
- A: 检查输入视频文件是否损坏，尝试用其他视频测试

**Q: Excel解析失败**
- A: 确保文件格式为xlsx或xls，文件未被其他程序占用

**Q: 服务器无法启动**
- A: 检查端口8000是否被占用，尝试其他端口