# 码上见 - 快递取件码视觉定位工具

## 项目简介

一个基于 Web 的快递取件码视觉定位工具，用户上传取件码截图和货架照片后，系统自动在照片中用红框标出目标包裹位置。

## 技术栈

- **后端**: Python 3.12 + FastAPI + RapidOCR + OpenCV
- **前端**: React + Vite

## 快速开始

### 1. 安装依赖

```bash
# 后端依赖
cd backend
pip install -r requirements.txt

# 前端依赖
cd frontend
npm install
```

### 2. 启动服务

```bash
# 启动后端（端口 8080）
cd backend
python debug_server.py

# 启动前端（端口 3000）
cd frontend
npm run dev
```

### 3. 访问应用

打开浏览器访问：http://localhost:3000

## 使用流程

1. **上传取件码截图**：系统自动识别并提取候选4位取件码
2. **确认目标码**：如果有多个候选码，选择正确的目标码
3. **上传货架照片**：系统通过OCR识别并匹配目标取件码位置
4. **查看结果**：系统在图片中用红框标出目标位置

## API接口

### POST /api/extract-code
提取取件码

**输入**: 取件码截图图片

**输出**: 候选目标码列表

### POST /api/locate-code
定位货架照片中的目标码

**输入**: 货架照片、目标完整码、目标4位码

**输出**: 标注后的图片文件（找到时）或JSON提示（未找到时）

## 项目结构

```
code-on-sight-demo/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/endpoints/      # API端点
│   │   │   ├── extract_code.py # 取件码提取接口
│   │   │   └── locate_code.py  # 货架码定位接口
│   │   ├── services/           # 核心服务
│   │   │   ├── ocr_service.py  # OCR识别服务（含滑动窗口）
│   │   │   ├── image_service.py # 图像处理服务
│   │   │   └── code_extractor.py # 取件码提取逻辑
│   │   ├── schemas/            # 数据模型
│   │   └── main.py             # 应用入口
│   ├── debug_server.py         # 启动脚本
│   └── requirements.txt        # 依赖列表
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── App.jsx             # 主应用组件
│   │   ├── App.css             # 样式
│   │   └── main.jsx            # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Vite配置
├── SPEC.md                     # 项目规格文档
└── test_shelf_biaozhu.jpg      # 测试图片
```

## 核心技术亮点

### 滑动窗口识别
针对大尺寸图片（如4096×3072），采用滑动窗口分块处理方案：
- 将图片分成1024×1024的小patch
- 以50%重叠率滑动遍历
- 结果坐标转换回原图
- IoU去重避免重复识别

### 模糊匹配优化
考虑OCR字符识别误差，实现自定义模糊匹配：
- Levenshtein距离计算相似度
- 字符相似度映射（0↔O、5↔S等）
- 宽松包含匹配和子串匹配

### 多层醒目标注
3层红黄相间边框效果，确保目标位置一眼可见

## 注意事项

- 本工具仅用于识别取件码数字，不保存任何用户隐私信息
- 建议在光线充足的环境下拍摄货架照片
- 照片中贴码应清晰可见，避免严重模糊或反光
