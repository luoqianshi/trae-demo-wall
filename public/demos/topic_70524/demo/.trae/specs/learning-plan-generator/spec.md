# 学习计划生成系统 - 产品需求文档

## Overview
- **Summary**: 一个基于大模型API的学习计划生成系统，用户输入学习目标、目的、每日时长和当前水平后，系统自动生成详细的学习计划，包括每日学习内容、任务作业和学习资源。支持作业提交、AI评测和每日打卡功能。
- **Purpose**: 帮助用户制定系统化、可执行的学习计划，并通过AI智能评测提供个性化反馈，提升学习效率。
- **Target Users**: 有学习需求的个人用户，包括学生、职场人士等。

## Goals
- [x] 用户输入学习目标、目的、每日学习时长、当前水平，生成完整学习计划
- [x] 生成的学习计划按天拆分，每天有独立入口查看详细内容
- [x] 用户可以提交每日作业，AI进行评测并返回评价结果
- [x] 支持每日打卡功能
- [x] 登录/注册/忘记密码功能
- [x] 边界三态处理：加载中、空数据占位、出错提示
- [x] 安全要求：API Key、token、内部接口地址绝不能写在前端代码里

## Non-Goals (Out of Scope)
- [ ] 多用户协作功能
- [ ] 学习进度统计图表
- [ ] 移动端适配
- [ ] 社交分享功能
- [ ] 视频播放功能

## Background & Context
- 系统使用GLM-4.7-Flash大模型API生成学习计划和评测作业
- 后端使用Python实现API代理，保护API Key、token、内部接口地址
- 前端使用单文件HTML实现，支持本地离线运行
- 数据存储使用localStorage

## Functional Requirements
- **FR-1**: 用户注册和登录功能，支持忘记密码重置
- **FR-2**: 用户输入学习目标、目的、每日时长、当前水平，生成学习计划
- **FR-3**: 学习计划按天拆分展示，每天有独立入口
- **FR-4**: 用户提交每日作业，AI进行评测
- **FR-5**: 每日打卡功能
- **FR-6**: 学习计划结果保存和历史记录查看

## Non-Functional Requirements
- **NFR-1**: 页面明亮积极有点击反馈，有视觉设计
- **NFR-2**: 前端保证安全性，API Key、token、内部接口地址绝不能写在前端代码里
- **NFR-3**: 支持本地离线运行（文件协议）
- **NFR-4**: 加载中显示loading，空数据友好占位，出错提示

## Constraints
- **Technical**: 单文件HTML实现，CSS写在&lt;style&gt;里，JS写在&lt;script&gt;里，图片用内联SVG或Base64
- **Business**: API Key、token、内部接口地址通过后端代理，前端不直接调用大模型API
- **Dependencies**: 依赖GLM-4.7-Flash大模型API，后端Python服务

## Assumptions
- [x] 用户已有互联网连接用于调用后端API
- [x] 用户使用现代浏览器（支持ES6+）
- [x] localStorage可用用于数据持久化

## Acceptance Criteria

### AC-1: 用户注册
- **Given**: 用户未登录且无账户
- **When**: 用户填写用户名、密码、邮箱并点击注册
- **Then**: 账户创建成功并自动登录
- **Verification**: `programmatic`
- **Notes**: 密码长度至少6位，邮箱格式验证

### AC-2: 用户登录
- **Given**: 用户已有账户
- **When**: 用户输入用户名和密码并点击登录
- **Then**: 登录成功进入主页
- **Verification**: `programmatic`
- **Notes**: 错误提示无效凭证

### AC-3: 忘记密码
- **Given**: 用户忘记密码
- **When**: 用户点击忘记密码并输入注册邮箱
- **Then**: 显示密码重置提示（模拟）
- **Verification**: `programmatic`

### AC-4: 生成学习计划
- **Given**: 用户已登录，填写学习目标、目的、每日时长、当前水平
- **When**: 用户点击生成学习计划按钮
- **Then**: 显示加载状态，成功后展示学习计划列表，按天拆分
- **Verification**: `programmatic`
- **Notes**: 失败时显示错误提示，空数据显示占位

### AC-5: 查看每日计划详情
- **Given**: 用户已生成学习计划
- **When**: 用户点击某一天的计划入口
- **Then**: 展示当天的详细学习内容、要求、作业和学习资源
- **Verification**: `human-judgment`

### AC-6: 提交作业
- **Given**: 用户在每日计划详情页
- **When**: 用户填写作业内容并提交
- **Then**: 显示加载状态，成功后展示AI评测结果
- **Verification**: `programmatic`
- **Notes**: 失败时显示错误提示

### AC-7: 每日打卡
- **Given**: 用户在每日计划详情页且当日未打卡
- **When**: 用户点击打卡按钮
- **Then**: 打卡成功，按钮状态改变
- **Verification**: `programmatic`

### AC-8: 视觉设计与交互反馈
- **Given**: 用户在任意页面
- **When**: 用户进行交互操作（点击、输入等）
- **Then**: 有明确的视觉反馈（悬停效果、点击反馈、加载状态）
- **Verification**: `human-judgment`

### AC-9: 安全性验证
- **Given**: 前端代码已部署
- **When**: 检查前端源代码
- **Then**: 前端代码中不包含API Key、token、内部接口地址等敏感信息
- **Verification**: `human-judgment`
- **Notes**: 所有敏感信息通过后端代理，前端只调用后端API

## Open Questions
- [ ] 后端Python服务的具体部署方式？
- [ ] 学习计划的文件保存格式和位置？
- [ ] 是否需要支持多学习计划？
