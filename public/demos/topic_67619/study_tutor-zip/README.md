# 高中数学 AI 答疑小程序

W1 核心闭环实现。详细设计见 docs/superpowers/specs/2026-06-19-gaokao-math-ai-tutor-design.md。

## 开发环境准备

1. 安装依赖：`npm install`
2. 用微信开发者工具打开 `miniprogram/` 目录
3. 替换 `project.config.json` 的 appid
4. 替换 `app.js` 中 wx.cloud.init 的 env
5. 右键 cloudfunctions 下每个云函数 → 上传并部署

## 测试

`npm test` 跑所有云函数单元测试。

## W1 dogfood 检查清单

每次给新测试者前确认：
- [ ] 云函数环境变量已设
- [ ] 4 个云函数都已部署最新版本
- [ ] 数据库 5 个集合已建索引
- [ ] 测试题库：3 道易、3 道中、1 道难（覆盖函数/三角/几何）
- [ ] 反馈收集表（飞书/腾讯文档）已建好

## 监控指标（云开发控制台 → 监控）

每日观察：
- fn-solve 调用次数与错误率
- 单题平均 token 消耗与成本
- 缓存命中率（usage_log 中 cacheHit=true 占比）
- LLM 调用 P95 延时
- feedback 集合 reportedWrong=true 数量（若 > 5% 必须停服核查）

## W1 → W2 过渡条件

- 核心闭环 3 人 ×3 天稳定使用，无致命 bug
- AI 准确率体感 ≥ 80%（无系统性错误类型）
- 反馈错答比例 < 10%

满足后启动 W2 计划（支付、评测集、内容安全完整版）。
