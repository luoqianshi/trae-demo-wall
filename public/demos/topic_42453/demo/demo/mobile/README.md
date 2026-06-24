# mobile demo

纯前端移动端 demo，无构建步骤，浏览器直接打开 `index.html` 即可运行。

## 领域结构

| 文件夹 | 职责 | 完成度 |
|---|---|---|
| `core/` | 应用骨架：shell（顶栏/视图容器）+ drawer（☰ 抽屉）+ bridge（跨域桥接） | 完成 |
| `shared/` | 跨域公用：visibility（可见度模型）+ a11y | 部分 |
| `friends/` | 好友 + 聊天 + 双视图（列表/分组）+ 管理页 | 完成 |
| `notes/` | 笔记编辑（editor）/ 笔记本管理（notebook）/ 笔记概览（overview） | 部分 |
| `publish/` | 发布流程 | 部分 |
| `profile/` | 个人页 + 设置（隐私/可见度/社交授权/登录设备/数据控制） | 部分 |
| `square/` | 广场 / 动态 | 占位 |
| `workflow/` | 工作流 | 占位 |
| `ai/` | AI 能力：agent + zx-* | 部分 |

## 完成度标记规则

- **完成**：核心交互可用，视觉到位
- **部分**：主流程跑通，但有缺页/占位/未打磨
- **占位**：仅有静态结构或最小桩代码

## 外部依赖（不在本目录内）

以下资源通过 `../../demo/shared/` 引用，是 mobile / desktop 共享文件：

- `components.css` — 公共组件样式
- `mock-data.js` — 模拟数据
- `icons.js` — 图标 SVG 集合
