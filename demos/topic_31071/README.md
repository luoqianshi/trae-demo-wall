# CMS智能内容中台 - Demo

## 快速开始

### 启动方法（二选一）

#### 方法一：命令行启动（推荐）
1. 解压 ZIP 文件到任意文件夹
2. 进入解压后的文件夹
3. 在文件夹空白处按住 Shift + 右键，选择"在此处打开 PowerShell 窗口"或"在此处打开命令窗口"
4. 运行以下命令之一：

**如果有 Python：**
`
python -m http.server 8080
`

**如果有 Node.js：**
`
npx -y serve -l 8080
`

5. 浏览器访问 http://localhost:8080

#### 方法二：使用 VS Code Live Server
1. 用 VS Code 打开解压后的文件夹
2. 右键点击 index.html，选择"Open with Live Server"

---

## Demo 账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | admin123 |
| 编辑 | editor | editor123 |

---

## 功能模块

- 用户登录 / RBAC权限管理
- 仪表盘数据统计
- 文章管理（创建/编辑/审核/发布/版本历史）
- 分类管理 / 标签管理
- 媒体库
- 评论管理
- 组织架构管理
- 角色权限管理
- 平台同步设置（微信公众号/抖音/微博/小红书/今日头条）
- 系统设置
- 前台门户 / 移动端H5

---

## 技术栈

Vue 3 + Vite + Element Plus + Pinia + Express.js + MySQL

由 TRAE Work 开发完成
