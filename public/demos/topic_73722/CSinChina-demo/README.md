# 科学公民 (CSinChina) — 离线体验包

一个面向中国公民科学领域的 Web 导航与协作平台，连接科学研究者与普通公众。

---

## 快速启动

### 环境要求
- Node.js 18+（如未安装，请前往 https://nodejs.org 下载 LTS 版本）

### 启动步骤

```bash
# 1. 解压 ZIP 后，进入项目目录
cd csinchina-demo

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 浏览器访问 http://localhost:3001
```

服务启动后，请使用浏览器访问 `http://localhost:3001` 即可体验完整功能。

---

## 演示账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 科学家/机构 | scientist@demo.com | demo123 |
| 公众用户 | public@demo.com | demo123 |

---

## 主要功能

1. **项目浏览与筛选**：按学科分类（天文学、生物多样性、海洋科学等）浏览公民科学项目，支持关键词搜索
2. **项目发布**（科学家角色）：填写项目信息，按学科分类发布，招募公众志愿者
3. **项目参与**（公众角色）：一键参与感兴趣的项目，在个人面板追踪进度
4. **外部项目收录**：平台已收录 15 个真实中国公民科学项目，点击卡片可直接跳转官网参与

---

## 技术栈

- 前端：React 19 + Vite + React Router
- 后端：Express.js + SQLite
- 认证：JWT + bcrypt

---

## 注意事项

- 数据存储在本地 SQLite 文件（`server/database.sqlite`），重启服务后数据保留
- 首次启动时会自动初始化数据库并导入演示数据
- 如需重置数据，删除 `server/database.sqlite` 后重新启动即可
