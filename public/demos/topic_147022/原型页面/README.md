# 入画童行原型页面

这个目录用于存放拆分后的前端 HTML 原型页面。每个页面都可以独立打开，页面之间通过普通 HTML 链接跳转，不依赖后端。

## 一级页面

- `index.html`：首页
- `character-library.html`：角色库
- `adapt-book.html`：绘本改编
- `create-original.html`：原创绘本
- `bookshelf.html`：我的书架

## 流程内页面

- `character-create.html`：创建家庭角色
- `adapt-preview.html`：绘本改编流程内的预览确认
- `original-role-suggest.html`：原创绘本流程内的角色确认与风格设置
- `preview-read.html`：从书架进入的绘本详情 / 预览共读

## 资源说明

页面图片资源复用上一级目录的 `assets/`，因此本目录中的 HTML 使用 `../assets/...` 引用图片。
