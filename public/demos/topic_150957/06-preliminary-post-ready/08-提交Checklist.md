# 迁跃 AI｜官方初赛提交 Checklist

参考：[TRAE 初赛参赛指南](https://forum.trae.cn/t/topic/22549)

## 发帖模板

- [ ] 社区发布时选择话题标签：`学习工作`
- [x] 标题：`【学习工作赛道】迁跃 AI｜跨行业经验迁移智能体`
- [x] 0. 已包含打招呼、匿名职业身份与真实 TRAE 协作感受
- [x] 1. 已包含产品形态、核心用户、3 项能力和 4 张产品图位置
- [x] 2. 已包含灵感来源、真实痛点、方向判断与产品取舍
- [x] 3. 已明确选择“交互式 HTML ZIP”体验方式
- [x] 4. 已直接列出 3 个真实 TRAE Session ID
- [x] 4. 已预留 3 张真实 TRAE 过程截图位置
- [ ] 5. 报名审核通过帖链接：待用户补充

## 首选交互 Demo

- [x] 文件：`06-preliminary-post-ready/02-交互Demo/Qianyue-AI-TRAE-Interactive-Demo.zip`
- [x] 来源：TRAE Work 单文件 HTML 产物链
- [x] 解压后双击 `index.html`，不需要本地服务器
- [x] 无需 API Key、登录或安装
- [x] 7 个交互阶段、3 个匿名 Persona、7 项 Transfer Asset 字段
- [x] ZIP 大小：15,844 bytes，小于 20MB
- [x] ZIP SHA-256：`d635dcbcaa07d918247f17aa60bda465cb043f120ed5791fd9fc75f52e40f647`
- [x] `unzip -t` 通过
- [x] 单文件 HTML validator 通过
- [x] 无外部网络请求、真实 Key、持久化和真实隐私

## 产品截图

- [x] `01-三案例选择.png`
- [x] `02-Agent首次分析.png`
- [x] `03-唯一追问与勾选补证.png`
- [x] `04-Transfer-Asset完成.png`
- [x] 4 张均为 1440×900 PNG
- [x] 产品截图与 TRAE 过程截图分开保存

## TRAE 真实性证据

- [x] TRAE Code 创意 HTML 候选稿：真实 Session ID + 截图
- [x] TRAE Work 正式交互 HTML：真实 Session ID + 截图
- [x] TRAE Work 单步演示与勾选补证优化：真实 Session ID + 截图
- [x] 正文直接展示 3 个 Session ID，不再只引用外部表格
- [x] 不使用 Codex 任务 ID 或 Git SHA 冒充 TRAE Session
- [x] 补充审计：TRAE Code 最终提交审查真实 Session ID + 截图
- [x] 新增过程图已遮挡 TRAE 用户编号和本地个人路径
- [ ] 向官方确认第三方工具参与资格边界

## 真实性边界

- [x] 当前 Demo 使用本地 Mock 流程
- [x] 未接真实模型，不需要 API
- [x] 输入只存在页面内存，刷新即清空
- [x] 林晨、周衡、叶舒与案例指标均为虚构演示内容
- [x] 证据充分度不表述为录用概率
- [x] 视频仅为补充材料，不替代交互 Demo

## 当前发布门禁

```text
POST_TEMPLATE_READY=true
TRAE_HTML_DEMO_READY=true
PRODUCT_SCREENSHOT_COUNT=4
REAL_TRAE_SESSION_COUNT=4
REAL_TRAE_PROCESS_SCREENSHOT_COUNT=4
REGISTRATION_APPROVED_LINK_READY=false
PRELIMINARY_READY=false
PRELIMINARY_SUBMITTED=false
```

当前唯一确定的硬阻断项是“报名审核通过帖链接尚未补入”。TRAE实质迭代证据已补强；第三方工具参与资格边界仍需向官方确认。
