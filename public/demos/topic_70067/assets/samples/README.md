# samples/ — 网页版兜底 3D 模型

网页 `index.html` 里的 `?demo=<name>` 参数可以直接加载本目录下的 GLB 文件，
避免评委首次访问要等 60s 才能看到 3D 效果。

## 目录约定

```
assets/samples/
  guangong.glb   ← 关公·朱红
  baogong.glb    ← 包公·墨黑
  caocao.glb     ← 曹操·素白
```

## 如何生成这些文件？

1. 打开网页版：`http://<你的IP>/`。
2. 分别用（关公+朱红）、（包公+墨黑）、（曹操+素白）三个组合各生成一次。
3. 生成完成后，从浏览器开发者工具 Network 面板复制 `.glb` 请求的 URL。
4. 本地 `curl -o guangong.glb "<URL>"` 下载后放进这里。
5. 部署到腾讯云时，`assets/samples/` 会随 `scp -r ai-face-mask-workshop` 一同上传。

## 用法（网页）

访问 `http://<你的IP>/?demo=guangong` 直接加载关公样本，
`?demo=baogong`、`?demo=caocao` 类似。

## 用法（小程序）

小程序端的本地兜底 GLB 独立放置在 `hunyuan3d-studio-app/miniprogram/src/pages/viewer/assets/sample.glb`。
可以把 `guangong.glb` 复制过去并重命名为 `sample.glb`（注意 < 500KB，未 Draco 压缩）。
