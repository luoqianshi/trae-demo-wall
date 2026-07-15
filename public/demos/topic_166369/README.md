# 图客 V5.2 — 设计师精准沟通协作平台

> 这是 TRAE AI 创造力大赛的初赛 Demo 产物，由 TRAE IDE 设计画布生成。

## 如何体验

1. 将整个文件夹解压到本地
2. 用浏览器打开 `pages/login-sms.html` 作为入口页面
3. 页面间的导航交互通过按钮和 Tab 实现（基于 `data-dom-id` 属性）

## 页面索引

### 浅色模式（18 页）

| 页面 | 文件 | 说明 |
|------|------|------|
| 登录-短信验证码 | `pages/login-sms.html` | 品牌面板 + 短信登录表单 |
| 登录-邀请码 | `pages/login-invite.html` | 6 格邀请码输入 |
| 工作台-展开态 | `pages/workspace-expanded.html` | 三栏工作台（侧边栏+CAD+抽屉） |
| 工作台-收起态 | `pages/workspace-collapsed.html` | 侧边栏收起为图标 |
| 工作台-联系人 | `pages/workspace-contacts.html` | 联系人列表 + 角色徽章 |
| 工作台-文件目录 | `pages/workspace-filetree.html` | 文件树抽屉覆盖层 |
| 工作台-选型面板 | `pages/workspace-selection.html` | 产品卡片 + 复选框 |
| 工作台-待办 | `pages/workspace-todo.html` | 待办 Tab（开发中占位） |
| 工作台-人才库 | `pages/workspace-talent.html` | 人才库 Tab（开发中占位） |
| 新建项目弹窗 | `pages/modal-new-project.html` | 模态弹窗 |
| 成员管理弹窗 | `pages/modal-members.html` | 成员角色管理 |
| 选型比选表格 | `pages/compare-table.html` | 多方案参数对比 |
| 空状态-无文件 | `pages/empty-no-file.html` | CAD 区域空状态 |
| 空状态-无项目 | `pages/empty-no-project.html` | 无项目引导 |
| 项目会议-会议室 | `pages/meeting.html` | 三栏会议（参与者+CAD+聊天） |
| 项目会议-入口 | `pages/meeting-entry.html` | 创建/加入会议 |
| 移动端-首页 | `pages/mobile-home.html` | 375px 移动端布局 |
| 移动端-记录详情 | `pages/mobile-record-detail.html` | 协作记录详情 |

### 深色模式（5 页）

| 页面 | 文件 | 说明 |
|------|------|------|
| 工作台-深色 | `pages/workspace-expanded-dark.html` | CAD 浅线深底（类似 AutoCAD 暗色模式） |
| 工作台收起-深色 | `pages/workspace-collapsed-dark.html` | 深色图标栏 |
| 登录-深色 | `pages/login-sms-dark.html` | 深色品牌渐变 |
| 比选表格-深色 | `pages/compare-table-dark.html` | 深色表格 |
| 会议-深色 | `pages/meeting-dark.html` | 深色会议室 |

## 设计系统

本项目使用 V5.2 设计系统（`tuke-v52`），共 192 个 CSS token：

- **主色**：Teal (#2d716c) — 唯一品牌强调色
- **中性色**：Morandi 暖灰 10 阶
- **语义色**：Success / Warning / Error / Info（低饱和度）
- **字体**：Outfit（标题）+ Noto Sans SC（正文）+ JetBrains Mono（等宽）
- **圆角**：2-8px 锐利工程几何
- **阴影**：5 级暖色调阴影

## 核心功能

1. **图纸在线预览**：支持 DWG / GLB / PDF / 图片，无需安装专业软件
2. **坐标锚固标注**：在图纸精确位置添加图钉、箭头、文字和语音批注
3. **异步沟通**：像发微信一样讨论图纸，标注绑定坐标，无需全员在线
4. **项目会议**：共享图纸屏幕，多人同屏标注，结论自动关联坐标

## 技术栈

纯 HTML + CSS（设计画布产物），使用 CSS 自定义属性（Custom Properties）实现设计系统 token。
