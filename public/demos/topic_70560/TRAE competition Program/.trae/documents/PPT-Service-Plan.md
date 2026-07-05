# 在线PPT服务集成方案

## 一、项目调研结论

### 1.1 现有架构分析

项目基于 **FastAPI + Python** 构建，后端路由采用模块化设计，前端使用纯HTML/CSS/JS实现。

**核心文件结构：**
- `app/main.py` - 主应用入口，包含路由注册和页面分发
- `app/routes/` - API路由模块（video.py, data.py, match.py）
- `app/services/` - 业务逻辑层
- `app/static/` - 静态资源（HTML页面、CSS样式）

**现有功能模块：**
1. 视频转码模块 - `/video`
2. 数据清洗模块 - `/data`
3. 学生匹配模块 - `/match`

### 1.2 技术栈选择

基于"快速开发"和"不修改现有文件"的约束，选择以下技术方案：

| 层次 | 技术方案 | 理由 |
|------|----------|------|
| 后端PPT生成 | `python-pptx` | 成熟的Python库，支持创建和修改PPTX文件 |
| 前端编辑器 | Quill.js (CDN) | 轻量级富文本编辑器，支持CDN引入无需安装 |
| 模板引擎 | 内置模板系统 | 简单JSON配置驱动，快速实现模板选择 |
| 样式框架 | 复用现有CSS | 保持系统风格一致性 |

### 1.3 约束分析

- **不修改现有文件**：仅新增文件，路由和导航可修改main.py和index.html
- **快速开发**：优先使用成熟库和CDN资源
- **局域网访问**：保持0.0.0.0绑定

---

## 二、文件和模块规划

### 2.1 新增文件

| 文件路径 | 说明 |
|----------|------|
| `app/routes/ppt.py` | PPT模块API路由 |
| `app/services/ppt_generator.py` | PPT生成核心服务 |
| `app/static/ppt.html` | PPT编辑器前端页面 |
| `app/static/ppt_templates/` | PPT模板目录（预设模板文件） |

### 2.2 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `app/main.py` | 注册PPT路由和页面路由 |
| `app/static/index.html` | 添加PPT导航入口 |
| `app/static/video.html` | 添加PPT导航按钮 |
| `app/static/data.html` | 添加PPT导航按钮 |
| `app/static/match.html` | 添加PPT导航按钮 |
| `requirements.txt` | 添加python-pptx依赖 |

---

## 三、实现步骤

### 步骤1：安装依赖

```bash
pip install python-pptx -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 步骤2：创建PPT服务层

**文件：** `app/services/ppt_generator.py`

功能：
- 创建空白PPT演示文稿
- 应用模板样式（字体、颜色、布局）
- 添加幻灯片（标题页、内容页、列表页、图片页）
- 导出PPTX文件

### 步骤3：创建PPT路由

**文件：** `app/routes/ppt.py`

API端点：
- `POST /api/ppt/create` - 创建PPT
- `POST /api/ppt/add_slide` - 添加幻灯片
- `POST /api/ppt/template` - 获取模板列表
- `GET /api/ppt/download/{filename}` - 下载PPT文件

### 步骤4：创建前端编辑器

**文件：** `app/static/ppt.html`

功能模块：
- 模板选择面板
- 幻灯片列表管理
- 富文本编辑器（标题、内容）
- PPT预览区
- 导出按钮

### 步骤5：修改主应用入口

**文件：** `app/main.py`

修改内容：
- 导入ppt路由
- 注册ppt路由
- 添加PPT页面路由 `/ppt`

### 步骤6：更新导航系统

修改各页面导航栏，添加"PPT制作"按钮：
- `app/static/index.html`
- `app/static/video.html`
- `app/static/data.html`
- `app/static/match.html`

### 步骤7：创建预设模板

在 `app/static/ppt_templates/` 创建几个基础模板配置文件。

---

## 四、核心功能设计

### 4.1 PPT模板系统

支持3种预设模板：
1. **教育汇报模板** - 蓝色主题，适合教师汇报
2. **学生展示模板** - 活泼色彩，适合学生作业展示
3. **数据报告模板** - 专业商务风格

### 4.2 幻灯片类型

| 类型 | 说明 |
|------|------|
| 标题页 | 主标题 + 副标题 + 日期 |
| 内容页 | 标题 + 正文文本 |
| 列表页 | 标题 + 项目符号列表 |
| 图文页 | 标题 + 图片 + 说明文字 |

### 4.3 编辑器功能

- 文本编辑（粗体、斜体、字号）
- 幻灯片添加/删除/排序
- 模板切换
- 实时预览
- PPTX导出下载

---

## 五、潜在风险与处理

### 5.1 依赖安装失败
- **风险**：python-pptx在某些环境安装失败
- **处理**：使用清华镜像源，提前验证安装

### 5.2 样式冲突
- **风险**：新增PPT页面样式与现有系统冲突
- **处理**：使用独立CSS命名空间，复用现有样式变量

### 5.3 文件权限问题
- **风险**：PPT输出目录无写入权限
- **处理**：复用现有的 `outputs` 目录，使用已有的目录创建工具

### 5.4 性能问题
- **风险**：生成大PPT文件耗时较长
- **处理**：限制单PPT最大幻灯片数量（50页）

---

## 六、验证方案

### 6.1 功能验证

1. 访问首页，确认PPT导航按钮存在
2. 点击进入PPT页面，确认模板选择功能正常
3. 创建PPT，添加多种类型幻灯片
4. 导出PPT文件，验证文件可正常打开

### 6.2 兼容性验证

1. 测试主流浏览器（Chrome、Edge、Firefox）
2. 测试移动端访问
3. 测试局域网内其他设备访问

---

## 七、交付物清单

| 交付物 | 状态 |
|--------|------|
| `app/routes/ppt.py` | 新增 |
| `app/services/ppt_generator.py` | 新增 |
| `app/static/ppt.html` | 新增 |
| `app/main.py` | 修改 |
| `app/static/index.html` | 修改 |
| `app/static/video.html` | 修改 |
| `app/static/data.html` | 修改 |
| `app/static/match.html` | 修改 |
| `requirements.txt` | 修改 |