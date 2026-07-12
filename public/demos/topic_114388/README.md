# 期末复习规划助手

智能安排复习时间,高效备战期末。支持艾宾浩斯遗忘曲线、数据导入导出、桌面通知提醒、离线使用。

## 快速开始

由于使用了 ES Module,需要通过 HTTP 服务访问(直接双击 `index.html` 打开会因 CORS 限制报错)。

```bash
# 任选一种本地服务方式

# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

浏览器打开 `http://localhost:8000`。

## 项目结构

```
.
├── index.html              # 主页面
├── styles.css              # 全部样式(支持浅色/深色/系统主题)
├── manifest.json           # PWA 配置
├── service-worker.js       # 离线缓存
├── assets/
│   └── icon.svg            # PWA 图标
└── js/
    ├── app.js              # 主入口:UI 渲染、事件、状态管理
    ├── storage.js          # localStorage 持久化 + 导入/导出
    ├── scheduler.js        # 计划生成算法(含艾宾浩斯曲线)
    ├── reminder.js         # 浏览器通知 + 横幅提醒
    └── utils.js            # 时间格式化、XSS 转义、ID 生成
```

## 功能特性

- 科目管理:多科目录入、1–3 星难度、复习重点维护、点击标记完成
- 时间设置:多段可支配时间、灵活的每日复习窗口
- 计划生成:两种算法可选
  - 按难度权重均匀分配
  - 艾宾浩斯遗忘曲线(0/1/3/7/15/30 天后复习)
- 进度跟踪:总体完成度、单项标记、自动联动科目完成度
- 通知提醒:浏览器桌面通知 + 页面横幅(提前 5 分钟 + ±1 分钟容差)
- 数据导入导出:JSON 备份与恢复
- 主题切换:浅色 / 深色 / 跟随系统
- PWA 离线:首次访问后可离线使用
- 无障碍:ARIA 标签、键盘焦点、减少动效偏好

## 数据存储

所有数据保存在浏览器 `localStorage`:
- `study_subjects` — 科目与重点
- `study_timeslots` — 可复习时间
- `study_schedule` — 生成的复习计划
- `study_settings` — 用户偏好
- `study_theme` — 主题模式

**重要**:清除浏览器数据会丢失所有内容,请定期使用导出按钮备份。

## 浏览器要求

需要支持 ES2020 的现代浏览器:
- Chrome / Edge 88+
- Firefox 78+
- Safari 14+

## 许可

仅作学习用途。
