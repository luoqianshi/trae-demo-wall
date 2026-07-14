# AI 自助接待系统 - 交互式体验版

汽车 4S 店智能化客户到店接待解决方案。纯静态文件，无需安装依赖即可体验完整功能。

## 使用方法

### Windows

双击 `start.bat`，会自动启动本地服务器并打开浏览器。

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

### 或者手动启动

```bash
# 使用 Python（推荐）
python -m http.server 8080

# 或使用 Node.js
npx serve -l 8080
```

然后在浏览器中访问 `http://localhost:8080/demo.html`

## 访问地址

| 功能 | 地址 |
|------|------|
| DEMO 总入口 | http://localhost:8080/demo.html |
| H5 首页 | http://localhost:8080/ |
| 自助接待流程 | http://localhost:8080/#/reception |
| 项目报告 | http://localhost:8080/report.html |

## 功能说明

1. AI 身份识别 - 车牌识别、手动输入、语音输入
2. 里程读取 - 仪表盘拍照识别、手动输入
3. 外观环检 - 拍照/相册/模拟拍照，AI 检测损伤
4. 维保推荐 - 基于里程+损伤智能推荐，支持多选和自定义
5. 确认提交 - 预检报告自动生成，一键提交工单

## 技术说明

- 前端: Vue 3 + Vant 4 + Pinia + Vue Router 4
- 数据: 内置 Mock API 拦截器 (mock-api.js)，无需后端
- 构建: Vite

## 注意

- 所有数据存储在浏览器内存中，刷新页面后重置
- 摄像头功能在桌面浏览器中可能受限，可使用"模拟拍照"或"手动输入"体验
