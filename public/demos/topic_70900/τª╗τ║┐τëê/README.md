# 情绪日记 · 离线版

## 使用方法

1. 双击 `index.html` 在浏览器中打开
2. 首次打开点击右上角 ⚙️ 设置智谱 API Key
3. 申请 Key：访问 https://open.bigmodel.cn/ 注册并实名认证
4. 在控制台创建 API Key，粘贴到设置面板保存

## 文件结构

- `index.html` - 首页
- `auth.html` - 登录/注册
- `calendar.html` - 日历
- `drawing.html` - 画板
- `mbti.html` - MBTI 性格测试
- `README.md` - 本说明

## 注意事项

- 所有数据保存在浏览器 localStorage，不联网也能使用
- AI 分析需要联网调用智谱 API（消耗 tokens）
- 画作和 AI 结果仅存本机，换浏览器/换电脑数据不会同步
- 跟服务器 124.220.33.147 完全独立，不影响线上服务
