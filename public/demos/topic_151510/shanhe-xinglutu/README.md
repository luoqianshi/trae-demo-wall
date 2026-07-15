# 山河行旅图 · 一键启动版

> TRAE AI 创造力大赛 · 初赛 Demo 作品  
> 解压即可一键启动，无后端、无登录、纯前端。

## 如何打开（任选其一）

### macOS
1. 解压 `shanhe-xinglutu.zip`
2. 双击文件夹里的 **`启动.command`**（首次双击如弹出"无法打开，因为它来自身份不明的开发者"，请到"系统设置 → 隐私与安全性"点击"仍要打开"）
3. 浏览器会自动打开 http://localhost:5173/

### Windows
1. 解压 `shanhe-xinglutu.zip`
2. 双击文件夹里的 **`start.bat`**
3. 浏览器会自动打开 http://localhost:5173/

### Linux
1. 解压 `shanhe-xinglutu.zip`
2. 终端进入目录，执行 `bash start.sh`
3. 浏览器会自动打开 http://localhost:5173/

## 手动启动（如果一键脚本无法运行）
```bash
cd shanhe-xinglutu
python3 -m http.server 5173
# 浏览器访问 http://localhost:5173/
```

> 需要先安装 Python 3.x：https://www.python.org/downloads/

## 项目内容
- 11 位诗人（苏/李/杜/白/王/李清照/陶/辛/陆/杜牧/铁木真）
- 99 首诗词（原文+拼音+注解+生字）
- 24 座城市景点讲解 + 5 段朗读写景
- 20 条热门路线 + 30 条 1-9 年级课本路线 + 11 条诗人路线
- 三大模式：诗词地图 / 诗词学习 / 诗词旅行

## 技术栈
- MapLibre GL JS（地图渲染）
- 纯静态 HTML + CSS + JavaScript（零依赖、零构建）
- 真实中国边界 + 烘焙 relief 地形瓦片

## 协议
MIT
