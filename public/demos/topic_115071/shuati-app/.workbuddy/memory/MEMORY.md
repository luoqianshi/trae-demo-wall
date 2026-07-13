# 刷题应用 · 项目记忆

## 架构要点
- 纯 vanilla HTML/CSS/JS 单页应用，无框架，无构建工具
- `state.bank` = 主题库（永不被刷题子集覆盖）；`state.quizBank` = 当前刷题集（考试/收藏/错题等子集）
- `getQuizList()` = quizBank || getGroupBank()，quiz 函数统一使用
- `pruneSyntheticState()` 清理 `__` 前缀合成分组/结果/进度
- 侧栏 `buildSideGrid()` 构建一次 + `updateSideCell()`/`updateSideCurrent()` 增量更新
- 模态框 `modalFocusIn/modalFocusOut` + 全局 Tab 焦点陷阱 + Esc

## 技术栈
- pdf.js (vendor/) + mammoth.browser.min.js (vendor/) 用于 PDF/DOCX 解析
- localStorage 持久化 + 可选后端 API (localhost:8766)
- CSS 变量亮/暗双主题

## 文件结构
- index.html — 主页面（含顶栏进度条/连接状态点）
- style.css — 样式（含暗色模式覆盖）
- js/api.js — 配置、状态、存储、工具函数
- js/parser.js — 文件解析、题目提取、上传事件
- js/app.js — 视图渲染、交互、弹窗
- vendor/ — pdf.min.js, pdf.worker.min.js, mammoth.browser.min.js
