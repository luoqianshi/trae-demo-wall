# 爸妈说明书 - 技术方案设计

## 1. 技术选型

### 1.1 前端（微信小程序）
- **框架**: 微信原生小程序 / Taro（跨端备选）
- **核心组件**: Canvas（标注绘制、箭头拖动）、触摸事件系统（互动练习热区点击）
- **适老化**: 全局rpx换算确保最小24pt字体，按钮最小48px触摸区域

### 1.2 AI服务链

| 模块 | 技术方案 | 备选方案 |
|------|---------|---------|
| UI元素检测 | OmniParser（微软开源）+ fine-tune | CogAgent（清华开源）、UI-TARS（字节） |
| 步骤推理 | GPT-4o / Claude 3.5 Sonnet + SoM Prompt | 通义千问-VL、GLM-4V（国产备选） |
| 图像标注 | Python Pillow（红圈/箭头/文字绘制） | OpenCV（高级视觉效果） |
| 语音合成 | 腾讯云TTS（温暖音色/慢速） | 微信小程序内置TTS、edge-tts |
| 视频合成 | FFmpeg（命令行调用） | moviepy（Python封装，适合特效） |
| PII脱敏 | 正则匹配+OCR检测 | 多模态LLM辅助识别敏感信息 |

### 1.3 后端
- **语言**: Python（FastAPI）— AI生态最完善
- **数据库**: MySQL（关系数据）+ Redis（缓存/会话）+ Elasticsearch（广场搜索）
- **存储**: 腾讯云COS + CDN（截图/标注图/视频分发）
- **部署**: 腾讯云/阿里云，容器化部署

## 2. 核心流程技术细节

### 2.1 截图上传与预处理
1. 子女端小程序选择1-10张截图（最大5MB/张，自动压缩至1080px宽度）
2. 上传至COS，返回URL列表
3. 后端拉取图片，进行PII脱敏预处理（模糊手机号、身份证号、金额数字）

### 2.2 UI元素检测
- 调用OmniParser模型，输入截图，输出元素列表：
```json
[
  {"type": "button", "bbox": [x, y, w, h], "text": "预约挂号", "confidence": 0.92},
  {"type": "input", "bbox": [...], "text": "搜索", "confidence": 0.87},
  ...
]
```
- Set-of-Mark增强：在图片上为每个可交互元素绘制编号标签，提升大模型定位精度

### 2.3 操作路径推理
- 将带编号标注的截图+意图描述+元素列表发送给多模态LLM
- Prompt设计核心要点：
  - 明确输出格式（JSON步骤序列）
  - 要求用老人能听懂的大白话
  - 每步指定目标元素编号和操作类型
  - 限制步数不超过截图数量+1
- 输出示例：
```json
{
  "steps": [
    {"step": 1, "element_id": 3, "action": "tap", "text": "点一下顶部的搜索框"},
    {"step": 2, "element_id": null, "action": "input", "text": "在框里输入协和医院", "target_bbox": [...]},
    {"step": 3, "element_id": 7, "action": "tap", "text": "点预约挂号这个橙色按钮"}
  ]
}
```

### 2.4 图像标注合成
- 使用Pillow在原始截图上绘制：
  - 红色粗圆圈（线宽4px，半径比目标元素大15px）
  - 箭头（从图片空白区域指向圆圈中心，带三角形箭头）
  - 序号标签（圆圈内白色数字）
  - 底部文字条（半透明黑色背景+白色24pt+文字，高度80px）
- 箭头路径规划：自动寻找不遮挡关键内容的路径

### 2.5 互动练习热区
- 基于目标元素bbox，向外扩展20%作为热区矩形
- 前端Canvas层检测触摸坐标是否在热区内
- 3次错误后自动扩大热区至150%并增强提示

## 3. API设计（核心接口）

```
POST /api/tutorial/generate
  输入: { images: [url], intent: string, options: {...} }
  输出: { tutorial_id, steps: [...] }

POST /api/tutorial/:id/edit
  输入: { steps: [{text, arrow_bbox, voice_url, hotspot_bbox}] }
  输出: { status: "ok" }

GET /api/tutorial/:id/export?format=card|image|video
  输出: 导出文件URL或小程序卡片参数

POST /api/tutorial/:id/practice/verify
  输入: { step: number, tap_x: number, tap_y: number }
  输出: { correct: boolean, hint: string }

GET /api/plaza/search?q=&category=&page=
  输出: { tutorials: [...] }
```

## 4. 性能预算

| 环节 | 目标耗时 |
|------|---------|
| 截图上传（5张） | ≤5秒（4G网络） |
| AI生成全流程 | ≤15秒 |
| 图像标注合成 | ≤3秒 |
| 视频合成（5步） | ≤30秒（异步处理） |
| 小程序页面加载 | ≤1秒 |

## 5. 成本估算（MVP初期）

| 项目 | 单次成本 | 日活1000时月成本 |
|------|---------|----------------|
| LLM API调用 | ~0.15元/次 | ~4,500元 |
| UI检测模型（自部署GPU） | 折旧~0.02元/次 | ~600元 |
| COS存储+CDN | ~0.03元/教程 | ~900元 |
| 云服务器 | - | ~2,000元 |
| **合计** | ~0.2元/教程 | **~8,000元/月** |
