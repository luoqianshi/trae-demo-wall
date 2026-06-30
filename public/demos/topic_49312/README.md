# HR人力资源管理系统

## 快速启动
1. 确保已安装 Node.js (v16+)
2. 双击 start.bat 一键启动（自动安装依赖、初始化数据库、启动服务）
3. 或手动启动：
   - 后端: cd backend && npm install && node init-db.js && node src/app.js
   - 前端: cd frontend && npm install && npx vite
4. 浏览器访问 http://localhost:5173

## 默认账号
- 管理员: admin / admin123
- HR: hr01 / 123456
- 部门经理: mgr_tech / 123456
- 普通员工: emp01 / 123456

## 技术栈
- 前端: React 18 + Ant Design 5 + Vite
- 后端: Node.js + Express + sql.js (SQLite)
- 认证: JWT
- 加密: AES
