# TRAE 初赛 Demo 上传说明

## 你要传什么

论坛直接上传这个文件：

- `PPAPI-Workbench-TRAE-Submission.html`

这个 HTML 是作品演示页，大小约 3.4 MB，低于 TRAE 社区 20 MB 附件限制，评委可以直接下载打开。

## exe 怎么处理

Windows exe 不建议直接传论坛，因为当前构建约 60 MB，超过社区 20 MB 附件限制。

正确做法：

1. 把 exe 上传到你的官网、GitHub Release、飞书云文档、蓝奏云或其他公开可下载地址。
2. 在帖子正文里写“Windows 体验版下载链接：xxx”。
3. 不要写本地路径，例如 `C:\Users\joy\...`，评委打不开本地路径。

当前 Windows exe：

- `C:\Users\joy\Image-Studio\image-studio\build\bin\ppapi-workbench-1.2.0-video-provider.exe`
- SHA256：`A6E685FD2BD650676ED2D5470F768504A23736A3EE17F4ED36D7CBE10434CF0B`

## 建议正文里这样写

```text
Demo 体验方式：

1. 作品演示页：见附件 PPAPI-Workbench-TRAE-Submission.html，下载后用 Chrome / Edge 打开即可查看完整产品 Demo。
2. Windows 桌面体验版：由于 exe 超过社区 20M 附件限制，下载链接放在这里：
   【把你的公开下载链接粘到这里】
3. 核心演示流程：
   - 参考图模式：上传参考图 -> AI 理解画面 -> 生成 4 个方案 -> 选择方案出图 -> 用结果池图片继续再创作。
   - 文生图模式：输入“小猫吃鱼” -> 生成 4 个不同视觉方案 -> 选择方向出图。
   - 矢量图模式：上传图片 -> AI 构建 SVG -> 输出可用于 CDR/印刷物料的矢量文件。
   - AI 分层 PSD：把生成图做分层重建，方便后续在 Photoshop 里编辑文字和图层。
   - 视频节点：在生成结果后继续生成 mp4，支持 VectorEngine / 即梦 NewAPI 服务商选择。
```

## 最小提交组合

如果你嫌麻烦，最少提交这 3 个东西：

1. 标题和正文文案。
2. `PPAPI-Workbench-TRAE-Submission.html` 附件。
3. exe 的公开下载链接。

