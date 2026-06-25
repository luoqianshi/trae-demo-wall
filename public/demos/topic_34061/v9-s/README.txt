漏洞哨兵 - 企业级 AI 安全扫描与修复平台
=====================================

使用方式：

方式一：离线体验（推荐先看界面）
1. 解压后双击打开 index.html
2. 体验完整的扫描流程、AI 报告、配置修复器、GitHub PR 演示
3. 此为前端演示模式，扫描结果为模拟数据

方式二：真实扫描体验（展示技术深度）
1. Mac 用户：双击 start.command
   Windows 用户：双击 start.bat
2. 等待 2-3 秒，浏览器会自动打开 http://localhost:8000
3. 输入真实网站地址（如 https://example.com）
4. 系统会真实请求目标网站，读取响应头，返回真实安全分析

技术说明：
- 前端：纯 HTML/CSS/JavaScript，移动端友好的 Web App
- 后端：Python HTTP 服务器，真实响应头扫描
- 扫描能力：HTTPS、HSTS、CSP、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Server 信息、CORS
- 修复能力：Nginx 配置自动修复、Diff 展示、修复报告下载
- 合规能力：域名归属验证（DNS TXT / 文件验证）

提交信息：
- 作品名称：漏洞哨兵
- 赛道：AI 应用开发
- 版本：V7 真实扫描版
