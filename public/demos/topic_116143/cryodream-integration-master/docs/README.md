# ComfyUI 工作流设计系统

## 项目简介
ComfyUI Draw Flow 是一个可视化的工作流设计系统，基于 ComfyUI 进行扩展，提供拖拽式的工作流编辑、任务调度、项目管理等功能，帮助用户快速构建和管理 AI 绘画工作流。

## 功能特性
- 🎨 可视化拖拽式工作流编辑器
- 🔗 与 ComfyUI 深度集成，支持所有 ComfyUI 节点
- 📊 任务调度和执行状态监控
- 📁 项目管理和版本控制
- 👥 多用户协作和权限管理
- 🚀 高性能和可扩展的架构设计

## 技术栈
### 前端
- React 18 + TypeScript
- Vite + TanStack Router
- shadcn/ui + Tailwind CSS
- Zustand + TanStack Query

### 后端
- Spring Boot 3.x
- MySQL + Redis + Elasticsearch
- MyBatis-Plus + Spring Security
- Maven 构建

## 文档导航
- [需求分析](./01-需求分析/): 项目的需求分析和用户故事
- [技术调研](./02-技术调研/): 技术选型和调研结果
- [模板中心](./03-模板中心/): 前后端开发模板和代码规范
- [开发计划](./04-开发计划/): 项目开发计划和进度跟踪
- [开发规范](./05-开发规范/): 项目的开发规范和流程说明
- [项目跟踪](./06-项目跟踪/): Bug 跟踪、测试报告和项目总结

## 快速开始
### 前端开发
```bash
cd client
npm install
npm run dev
```
访问 http://localhost:5173 即可查看前端应用

### 后端开发
```bash
cd service
mvn spring-boot:run
```
后端服务启动在 http://localhost:8080

### 完整启动
使用项目根目录下的启动脚本：
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

## 开发规范
- 遵循 [全局开发规范](./05-开发规范/全局开发规范.md)、[前端开发模板](./03-模板中心/前端开发模板.md) 和 [后端开发模板](./03-模板中心/后端开发模板.md) 中的规范
- 工作流节点创建与展示必须遵循全局开发规范中的“工作流节点创建规范”
- 提交代码前需要进行代码检查和格式化
- 遵循 Git 提交规范，使用规范的 Commit Message

## 贡献指南
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证
本项目采用 MIT 许可证，详见 LICENSE 文件

