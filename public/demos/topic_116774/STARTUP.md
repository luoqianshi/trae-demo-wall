# 智萃WisdomFlow - 启动说明

## 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0

## 快速启动

### 1. 解压项目
将压缩包解压到任意目录

### 2. 启动后端服务
```bash
cd backend
npm install
npm start
```
后端服务运行在 http://localhost:3000

### 3. 启动前端（Web端）
```bash
cd frontend
npm install
npm run dev
```
前端运行在 http://localhost:5173

### 4. 启动小程序（H5版）
```bash
cd miniapp
npm install
npm run dev:h5
```
小程序运行在 http://localhost:5174

## 测试账号
- 管理员：admin / admin123
- 专家：expert / expert123
- 普通用户：user / user123

## 功能说明
1. **首页**：展示知识条目、快捷功能、热门知识
2. **访谈**：与专家进行AI访谈（仅管理员和专家可见）
3. **知识**：浏览、搜索、收藏知识条目
4. **收藏**：查看收藏的知识
5. **我的**：个人信息、修改资料、修改密码

## 目录结构
```
WisdomFlow/
├── backend/          # 后端服务（NestJS + MySQL）
├── frontend/         # 前端Web端（Vue3 + Element Plus）
└── miniapp/          # 小程序端（uni-app + Vue3）
```
