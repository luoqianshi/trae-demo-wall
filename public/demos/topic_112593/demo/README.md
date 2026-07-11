# 铭晨 MINGCHEN - 智能激光射击训练系统

## 快速开始

### Windows 用户

1. **安装运行环境**（二选一）：
   - **Node.js**（推荐）：访问 https://nodejs.org/ 下载 LTS 版本，安装时全部默认选项即可
   - **Python**（备选）：访问 https://www.python.org/downloads/ 安装，记得勾选 "Add Python to PATH"

2. **启动应用**：
   - 双击 `start.bat`
   - 等待 1-2 秒，浏览器会自动打开
   - 如果浏览器没自动打开，手动访问 `http://localhost:3521`

3. **停止应用**：
   - 在黑色命令窗口中按 `Ctrl + C`，然后关闭窗口

### macOS / Linux 用户

1. 确保已安装 Node.js 或 Python
2. 打开终端，进入本文件夹
3. 执行：
   ```bash
   # 方式1：Node.js
   node server.js

   # 方式2：Python
   python3 -m http.server 3521
   ```
4. 浏览器访问 `http://localhost:3521`

---

## 使用说明

1. **开始训练**：点击「开始」进入射击模式
2. **射击**：鼠标点击靶纸即可射击（演示模式）
3. **切换武器**：鼠标滚轮切换手枪/步枪/冲锋枪
4. **查看成绩**：训练结束后自动弹出成绩报告
5. **历史记录**：点击右上角「历史」查看所有训练记录
6. **深度分析**：在历史记录页面切换到「深度分析」Tab
7. **设置**：点击右上角齿轮图标调整音效、主题等

---

## 文件说明

| 文件/文件夹 | 说明 |
|-----------|------|
| `index.html` | 主页面 |
| `css/style.css` | 样式文件 |
| `js/` | JavaScript 代码 |
| `assets/` | 图片资源 |
| `server.js` | Node.js 本地服务器 |
| `start.bat` | Windows 一键启动脚本 |
| `README.md` | 本说明文件 |

---

## 注意事项

- 请勿直接双击 `index.html` 打开，必须使用本地服务器运行
- 推荐使用 Chrome 或 Edge 浏览器
- 所有数据保存在浏览器本地，清除浏览器数据会丢失记录

---

> 世界很大，放手去造。
