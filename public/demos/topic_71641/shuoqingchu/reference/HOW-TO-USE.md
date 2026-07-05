# reference/ —— 备份答案 & 兜底演示

现场没有外援时的保险。三个文件，按需用：

- **server.reference.js** —— 完整可用的后端。Agent 造不出来/时间不够时，复制到项目根目录改名 `server.js` 即可。
- **index.reference.html** —— 完整可用的前端。同上，复制到 `src/index.html`。
- **standalone-demo.html** —— 纯离线演示页。**连 node 都跑不起来、或彻底断网时，直接双击用浏览器打开就能演示全流程**（不联网、用内置示例）。

更合规的用法：优先让 TRAE 的 Agent 自己写；卡住时把参考代码**粘给 Agent**说“用这个实现替换 TODO”，让代码仍然经由 TRAE 落地。

用参考版跑真实调用前，记得先 `cp config.example.js config.js` 并填好 Key（Node 需 ≥ 18）。
