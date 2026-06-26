# 同路 AA — 大学生周边游结伴出行

TRAE AI 创造力大赛参赛作品

## 快速启动

### 方式一：双击启动（推荐）
- **Windows：** 双击 `start.bat`
- **Mac/Linux：** 终端运行 `bash start.sh`

脚本会自动检测 Python 或 Node.js，启动本地服务器并打开浏览器。

### 方式二：手动启动
```bash
cd tonglu-aa
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

### 方式三：直接打开

双击 index.html，可使用路线规划、预算计算、地图等基础功能。
AI 攻略生成功能需要通过本地服务器访问。

## 功能说明

| 功能 | 联网 | AI | 说明 |
|------|------|-----|------|
| 路线规划 | ✅ OSRM | - | 真实距离和车程 |
| 天气预报 | ✅ Open-Meteo | - | 7天预报 |
| 游玩攻略 | ✅ | ✅ MiMo | AI 生成个性化攻略 |
| 地图展示 | ✅ Leaflet | - | 路线+POI标注 |
| AA 分账 | ❌ | - | 本地计算 |
| 搭子匹配 | ❌ | - | 本地演示数据 |

## 技术栈

- Vue 3.4 + Pinia 2.1（CDN，无需构建）
- Leaflet 1.9（交互式地图）
- OSRM（路线规划 API）
- Open-Meteo（天气 + 地理编码 API）
- MiMo AI（攻略文案生成）

## 项目结构

```
tonglu-aa/
├── index.html        # 主页面（HTML + CSS + Vue 模板）
├── app.js            # 应用逻辑（Vue 3 组合式 API）
├── api.js            # API 请求封装
├── utils.js          # 工具函数
├── map.js            # 地图模块（Leaflet 封装）
├── match.js          # 搭子匹配引擎
├── config.js         # API 配置
├── manifest.json     # PWA 配置
├── server.js         # Node.js 静态文件服务器（fallback）
├── start.bat         # Windows 启动脚本
├── start.sh          # Mac/Linux 启动脚本
└── README.md         # 本文件
```
