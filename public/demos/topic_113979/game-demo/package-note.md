# Package Note / 打包说明

> 本文件在 Session 5 会做最终完善（zip 名称、目录范围、提交前检查）。Session 1 先给出基本说明。

## 建议 zip 名称

`workspace-switcher-game-demo.zip`

## zip 应包含的目录

zip 应包含 `contest/game-demo` 整个目录，保持内部相对路径不变。解压后双击 `index.html` 即可运行。

目录结构：

```text
workspace-switcher-game-demo/
  index.html
  README.md
  package-note.md
  assets/
    css/style.css
    js/app.js
    js/demo-data.js
    js/scenes.js
    img/.gitkeep
  docs/
    acceptance-checklist.md
    post-materials-template.md
    session-notes-template.md
```

## 打包前检查

- [ ] 所有 CSS / JS 使用相对本地路径。
- [ ] 不依赖 CDN、npm、外部图片或网络请求。
- [ ] 双击 `index.html` 可在离线环境下正常运行。
- [ ] 页面安全声明可见。
- [ ] 不包含真实系统操作代码。

## 不要打包的内容

- 不要打包原运行目录 `E:\learning\新建文件夹\workspace-control`。
- 不要打包实验报告原文（实验报告指标已写入 `demo-data.js`）。
- 不要在 zip 中包含任何虚构的截图或 Session ID。
