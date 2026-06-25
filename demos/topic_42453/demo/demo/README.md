# 「知行」App Demo（双端）

本目录包含「知行」App 的双端 HTML Demo。

## 子目录说明

- **`mobile/`**：手机版 Demo（iPhone 外壳 + 5 tab 底部导航），访问 `mobile/index.html`
- **`desktop/`**：桌面版 Demo（侧栏 + 顶栏林状态条 + 多栏布局），访问 `desktop/index.html`

## 共享依赖

两端都复用 `../../demo/shared/` 下的设计系统（墨韵·星图）、mock 数据（固态电池主线）、图标库。

## 启动方式

```bash
# 在项目根目录启动静态服务器
python -m http.server 8000

# 手机版
http://localhost:8000/app-demo/mobile/

# 桌面版
http://localhost:8000/app-demo/desktop/
```
