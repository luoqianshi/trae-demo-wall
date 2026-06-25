# 部署指南 - AI 摄影助手

本项目是纯静态 HTML 项目，可部署到任何静态网站托管服务。以下是 3 种最简单的方式，按推荐程度排序。

---

## 方式一：Vercel 拖拽部署（最简单 ⭐⭐⭐⭐⭐）

**优点**：无需 GitHub 账号、无需命令行、3 分钟上线、全球 CDN 免费加速、自动 HTTPS。

### 步骤

1. **访问 Vercel**
   - 打开 [https://vercel.com](https://vercel.com)
   - 点击右上角 **"Sign Up"** 注册（推荐用 GitHub 账号，或邮箱注册）

2. **新建项目**
   - 登录后点击 **"Add New... → Project"**
   - 选择 **"Browse All Templates"** 或直接进入 **"Deploy"** 页面

3. **拖拽部署（最简单）**
   - 在 Vercel 部署页面，找到 **"Import Project"** 区域
   - 将整个项目文件夹 `AI相机DEMO` 拖拽到上传区域
   - 或选择 **"Deploy without Git"** 手动上传

4. **等待部署**
   - 约 30-60 秒后部署完成
   - Vercel 会给你一个类似 `https://ai-photo-assistant-xxx.vercel.app` 的 URL

5. **访问**
   - 直接点击 Vercel 提供的链接即可访问你的项目

---

## 方式二：Netlify 拖拽部署（同样简单 ⭐⭐⭐⭐⭐）

**优点**：拖拽即部署，免费 HTTPS，全球 CDN。

### 步骤

1. 访问 [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. 将整个 `AI相机DEMO` 文件夹直接拖拽到页面中央
3. 等待 10-30 秒，自动生成 `https://xxx.netlify.app` 的链接
4. 完成！无需注册即可使用（30 天后链接可能失效，建议注册账号）

---

## 方式三：GitHub Pages（适合有 GitHub 账号的用户 ⭐⭐⭐⭐）

**优点**：完全免费、稳定可靠、可绑定自定义域名。

### 步骤

1. **创建 GitHub 仓库**
   - 登录 [GitHub](https://github.com)
   - 点击右上角 **"+" → "New repository"**
   - 仓库名填写 `ai-photo-assistant`
   - 选择 **Public**（公开）
   - 点击 **"Create repository"**

2. **推送代码到 GitHub**

   在项目目录中打开终端（PowerShell），执行：

   ```bash
   cd j:\AI相机DEMO
   git init
   git add .
   git commit -m "Initial commit: AI 摄影助手 v2.1"
   git branch -M main
   git remote add origin https://github.com/你的用户名/ai-photo-assistant.git
   git push -u origin main
   ```

3. **开启 GitHub Pages**
   - 在 GitHub 仓库页面，点击 **"Settings"**
   - 左侧菜单选择 **"Pages"**
   - Source 选择 **"Deploy from a branch"**
   - Branch 选择 **"main"** 和 **"/ (root)"**
   - 点击 **"Save"**

4. **访问**
   - 几分钟后访问 `https://你的用户名.github.io/ai-photo-assistant/`

---

## 方式四：腾讯云/阿里云静态网站托管（国内访问快 ⭐⭐⭐）

**优点**：国内访问速度快、CDN 加速。

**缺点**：需要实名认证、域名备案（首次约 1-2 天）。

简单步骤：
1. 注册并实名认证腾讯云/阿里云
2. 开通「对象存储 COS」或「静态网站托管」
3. 创建存储桶，开启静态网站
4. 上传 `ai-photo-assistant-app.html` 文件
5. 获得访问 URL

---

## 自定义域名（可选）

部署完成后，可以绑定自己的域名（如 `photo.xxx.com`）：

### Vercel 绑定域名
1. 在 Vercel 项目页面点击 **"Settings" → "Domains"**
2. 输入你的域名
3. 按提示在域名 DNS 服务商添加 CNAME 记录
4. 等待 SSL 证书自动签发（约 1-5 分钟）

### Netlify 绑定域名
1. 在 Netlify 项目页面点击 **"Domain settings"**
2. 添加自定义域名
3. 配置 DNS

---

## 部署后优化建议

1. **添加 PWA 支持**：将项目改造为可安装的 Web App
2. **SEO 优化**：在 HTML `<head>` 中补充 `<meta name="description">` 等
3. **性能监控**：接入 Google Analytics 或百度统计
4. **CDN 加速**：Vercel/Netlify 默认已开启全球 CDN

---

## 常见问题

### Q: 部署后摄像头无法使用？
A: 浏览器要求 HTTPS 协议才能访问摄像头。Vercel/Netlify 默认提供 HTTPS，本地访问需用 `localhost` 或 `127.0.0.1`。

### Q: 部署后访问很慢？
A: 检查是否启用了 CDN。Vercel/Netlify 默认全球 CDN，国内访问可考虑部署到腾讯云/阿里云。

### Q: 如何更新已部署的项目？
A:
- Vercel: 重新拖拽文件即可
- GitHub Pages: 修改代码后 `git push`，几分钟后自动更新

### Q: 文件名是中文会有问题吗？
A: 建议将文件夹 `AI相机DEMO` 重命名为英文（如 `ai-photo-assistant`），避免部分托管服务的兼容问题。

---

## 推荐选择

- **如果想要最快速上线**：选 Vercel 拖拽部署 ⭐
- **如果有 GitHub 账号**：选 GitHub Pages ⭐
- **如果需要国内访问快**：选腾讯云 COS ⭐

部署过程中遇到任何问题，可以随时问我！
