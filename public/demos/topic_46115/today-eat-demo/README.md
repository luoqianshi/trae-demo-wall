# 今天吃什么！Demo

这是一个可运行的 AI 饮食推荐 Demo。前端填写当前状态，后端调用 DeepSeek 生成推荐结果。

## 启动方式

## 先安装 Node.js

如果终端提示 `npm: command not found`，说明电脑还没有安装 Node.js / npm。

### 推荐方式：官网下载

打开 Node.js 官网，下载 LTS 版本并安装：

```text
https://nodejs.org
```

安装完成后，新开一个终端，输入：

```bash
node -v
npm -v
```

如果都能显示版本号，就可以继续启动 Demo。

### Homebrew 方式

如果你已经安装 Homebrew，可以运行：

```bash
brew install node
```

项目里也提供了辅助脚本：

```bash
chmod +x install-node-macos.command
./install-node-macos.command
```

### Windows

双击 `start-demo.bat`，等待终端显示启动成功后，打开：

```text
http://localhost:3000
```

### macOS

双击 `start-demo.command`，等待终端显示启动成功后，打开：

```text
http://localhost:3000
```

如果提示“无法执行，因为你没有正确的访问权限”，请打开“终端”，进入项目文件夹后执行：

```bash
chmod +x start-demo.command
./start-demo.command
```

### 手动启动

```bash
npm install
npm start
```

启动后打开：

```text
http://localhost:3000
```

## 说明

- 作品包不包含真实 API Key。
- 页面右上角可以选择 DeepSeek、豆包、GLM、Kimi、千问、ChatGPT，并输入体验者自己的 API Key。
- 不输入 Key 时会进入演示模式，使用预设回答展示完整流程。
- 点击“验证连通”可以检查当前 Key 和模型是否可用。
- 输入的 Key 只用于当前请求，不会写入 SQLite。
- 如果浏览器显示 `ERR_CONNECTION_REFUSED`，说明本机服务没有启动，重新运行 `start-demo.bat` 或 `npm start` 即可。
- 后台会把“推荐提问历史”和“你选择过的菜品”保存在本地 SQLite 数据库 `data/app.sqlite` 中。
- 下一次推荐时，AI 会参考最近选择和最近提问，减少重复推荐，并更贴近你的口味。
- 如果旧版本已经生成过 `data/db.json`，新版启动时会尝试把旧数据迁移到 `data/app.sqlite`。
