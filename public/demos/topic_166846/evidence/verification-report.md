# 本地交付验证报告

验证时间：2026-07-15（Asia/Singapore）

> 这是本地工程与浏览器验收记录，不是 TRAE Session 证明。比赛要求的 TRAE Session ID 和过程截图仍须按 `docs/02-TRAE执行与Session取证.md` 在 TRAE 中真实完成。

## 自动检查

- HTML 内联 JavaScript：1 个脚本块，语法编译通过；
- FastAPI 后端：`python -m unittest discover -s tests -t . -v`，5/5 通过；
- AIUI 实时关闭状态：`node tests/aiui-realtime-close.test.js`，2/2 通过；验证优雅结束只发送一次 `session.finish`、等待 `session.finished` 后关闭，以及立即关闭路径不会重复发送；
- `submission-manifest.json`：JSON 解析通过；
- 安全扫描：源码与参赛材料中未发现形如真实 `sk-*` 的长密钥；
- HTML ZIP：只包含 `index.html` 和 `README.txt`；
- AIUI ZIP：只包含 `AGENTS.md`、`app.js`、`app.json`、`README.md`、`lib/`、`pages/`；
- 两个 ZIP 均不包含 `.env`、`.venv`、`__pycache__` 或后端 API Key。

## 浏览器回归与证据

- 本地自动化首轮已验证页面加载、无错误浮层、控制台无错误、无外部运行时请求；
- TRAE Session 2 在其修改后再次完成三个场景、3 轮连续对话、替代表达、朗读、自定义输入、Enter 提交和无网络依赖测试；
- 1440、900、390 三档视口均无横向溢出，关键按钮、场景标签和输入框可见；
- 3 张产品截图位于 `evidence/product/`，TRAE Session 2 的浏览器画面和测试记录位于 `evidence/trae-sessions/`；
- 最终归档轮次尝试再次启动 `agent-browser` 时，受管环境拒绝联网执行 npm 包，因此没有绕过限制重复运行；HTML 语法、AIUI 状态测试与后端测试均在最终代码上重新执行通过。

## TRAE 真实性材料

- 3 个真实 Session ID 已写入作品帖、取证手册和 `submission-manifest.json`；
- 3 张 TRAE 过程截图已按 Session 1/2/3 归档；
- TRAE 生成的 `session-01-architecture.md`、`session-02-web-demo.md`、`session-03-release.md` 均保留；
- Session 1 修复 AIUI 关闭互斥状态，Session 2 修复 Web Demo 重置与朗读容错，Session 3 完成事实核对与安全打包。

## 产物哈希

```text
e0f1f4e772428f412ee45281dbba44d2f49bf096359a3fcf02c15cc22302eb98  跨语言沟通助手-初赛HTML体验包.zip
35d372af206cacf4319b096cb650ff8c0f653aa87bd1e3f2f7c3a17afde2a1fe  跨语言沟通助手-AIUI导入包.zip
```

完整报名材料包包含本文本身，因此其哈希不写入本文；三个 ZIP 的最终哈希统一以 `dist/SHA256SUMS.txt` 为准。
