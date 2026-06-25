UI 组件提示词库 - 使用说明
================================

【推荐使用方式】
1. 双击运行 "启动.bat"
2. 在浏览器中打开 http://localhost:3000
3. 前台页面展示所有组件
4. 访问 http://localhost:3000/admin/ 进入管理后台

【注意事项】
- 本项目使用 Next.js 构建，需要通过本地服务器访问
- 直接双击打开 HTML 文件可能无法正常显示样式
- 管理后台使用 Client Component，必须在服务器环境下运行

【文件说明】
- index.html      : 前台首页（组件展示）
- admin/index.html: 管理后台（组件配置）
- _next/          : 静态资源目录（JS/CSS/字体）

【技术栈】
- Next.js 16 + React + TypeScript
- Tailwind CSS v4
- 64 个 UI 组件预览（React Bits / shadcn/ui / Aceternity UI / Magic UI / Ant Design / Mantine）
