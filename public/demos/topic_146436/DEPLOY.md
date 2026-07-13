# 心晴日记 - 部署指南

## 方式一：离线体验版（最快分享）

直接把 `dist/心晴日记-体验版.html` 发给别人，双击打开即可体验 UI 和手写绘画功能。

**限制**：AI 识别、心情画像生成等需要后端的功能不可用。

---

## 方式二：线上部署（完整功能）

### 准备工作

1. 注册 [GitHub](https://github.com) 账号
2. 获取 Agnes AI API Key（https://agnes-ai.com）

### 方案 A：Railway 部署（推荐，免费额度充足）

1. **推送代码到 GitHub**
   ```bash
   cd mind-diary
   git init
   git add .
   git commit -m "心晴日记"
   git branch -M main
   git remote add origin https://github.com/你的用户名/mind-diary.git
   git push -u origin main
   ```

2. **在 Railway 部署**
   - 访问 https://railway.app
   - 用 GitHub 登录
   - 点 "New Project" → "Deploy from GitHub repo" → 选择你的 mind-diary 仓库
   - Railway 会自动识别 Node.js 项目并安装依赖

3. **配置环境变量**
   - 在 Railway 项目的 "Variables" 标签页添加：
     - `AGNES_API_KEY` = `你的 Agnes API Key`
   - 或者：把 `config.example.json` 复制为 `config.json`，填入 API Key，一起推送

4. **生成域名**
   - 在 "Settings" → "Networking" 点 "Generate Domain"
   - 得到一个类似 `mind-diary-production.up.railway.app` 的链接
   - 把这个链接发给别人就能用了

### 方案 B：Render 部署

1. 推送代码到 GitHub（同上）
2. 访问 https://render.com，用 GitHub 登录
3. "New" → "Web Service" → 选择仓库
4. 配置：
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - 环境变量：`AGNES_API_KEY` = 你的 Key
5. 部署完成后得到 `https://mind-diary.onrender.com` 格式的链接

### 方案 C：Vercel 部署（需要额外配置）

Vercel 默认不支持 Express 长期运行的服务，需要改为 Serverless 函数，配置较复杂，不推荐。

### 方案 D：自有服务器

```bash
# 在服务器上
git clone https://github.com/你的用户名/mind-diary.git
cd mind-diary
npm install
cp config.example.json config.json
# 编辑 config.json 填入 API Key
node server.js
# 用 nginx 反向代理 3001 端口
```

---

## 重要说明

- **API Key 安全**：绝对不要把真实的 `config.json` 推送到公开的 GitHub 仓库。部署平台用环境变量 `AGNES_API_KEY` 最安全
- **数据存储**：当前日记保存在服务端 `data/diaries.json`，是本地文件存储。部署到云端后，每次重新部署数据会丢失。如需持久化，后续可改为数据库
- **费用**：Railway/Render 免费额度足够个人使用。AI API 调用费用由你的 Agnes 账户承担
