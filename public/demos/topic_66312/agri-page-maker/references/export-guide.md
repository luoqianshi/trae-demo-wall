# 拆分下载 / 导出说明

## 一键导出（推荐）

HTML 顶部已嵌入「📦 导出全部模块」按钮。点击后自动：
1. 用 `html2canvas` 把每个 `data-section` 渲染为 2x 高清 PNG
2. 用 `JSZip` 打包为 `<产品名>-modules.zip`
3. 浏览器自动下载

> ⚠️ 由于第三方 CDN（jsdelivr）在某些地区可能慢，导出时耐心等待 5~10 秒。

## 手动截图

如果按钮失效，按以下方法逐张截图：

### macOS
- 打开 HTML → `Cmd + Shift + 5` → 选择「捕获选定窗口」或「滚动窗口」

### Chrome DevTools
1. F12 → 设备模式（iPhone 12 Pro）
2. 选中目标 `<section data-section="...">` 元素
3. 右键 → Capture node screenshot

### Safari
1. 启用「开发」菜单 → 偏好设置 → 高级
2. 开发 → 显示 Web 检查器
3. 同上选中节点后右键截图

## 批量下载（进阶）

在浏览器控制台粘贴：

```js
const sections = document.querySelectorAll('[data-section]');
let i = 0;
for (const s of sections) {
  const canvas = await html2canvas(s, {backgroundColor: null, scale: 2});
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `${s.dataset.section}.png`;
  a.click();
  await new Promise(r => setTimeout(r, 500));  // 防止浏览器拦截
}
```

## 用户替换图片

所有图片都引用 `assets/` 目录下的相对路径。用户只需：
1. 准备同尺寸/同比例的新图片
2. 命名为 `assets/` 下对应文件名（如 `hero.jpg`）
3. 覆盖即可，无需改 HTML

### 推荐比例参考

| 文件名 | 推荐尺寸 | 推荐比例 |
|---|---|---|
| hero.jpg | 1200×900 | 4:3 |
| origin-1.jpg ~ origin-4.jpg | 600×600 | 1:1 |
| feature-N.jpg | 800×450 | 16:9 |
| recipe-N.jpg | 800×450 | 16:9 |
| package.jpg | 600×600 | 1:1 |
| tips-bg.jpg | 1200×675 | 16:9 |

## 用户编辑文字

所有文字均为真实 HTML 标签，**不依赖任何图片**。用户可直接在浏览器中：
- `F12` → 选中元素 → 双击修改文字
- 或在文本编辑器中打开 HTML，搜索对应文字直接改

## 文件结构

```
pages/
└── {product-slug}/
    ├── index.html              # 完整页面
    ├── README.md               # 用户使用说明
    └── assets/
        ├── hero.jpg
        ├── origin-1.jpg
        ├── feature-1.jpg
        ├── recipe-1.jpg
        └── ...
```
