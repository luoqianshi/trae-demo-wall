# Tasks

- [x] Task 1: 精简 Hero 区域
  - [x] 移除 hero-desc 详细描述、hero-features 功能列表、heroCta 按钮
  - [x] 保留标题和一句核心标语，调整间距和布局
  - [x] 删除 app.js 中 initHeroCta 相关代码

- [x] Task 2: 上传区自动收缩
  - [x] 有图片时上传区缩小为一行"继续添加图片"按钮
  - [x] 点击按钮展开完整上传区
  - [x] 添加收缩/展开动画过渡
  - [x] styles.css 添加收缩状态样式

- [x] Task 3: 实时预览面板
  - [x] 在右侧工作区顶部添加预览区（有图片时显示）
  - [x] 预览区显示当前选中图片的处理效果
  - [x] 设置变更时 200ms 防抖更新预览
  - [x] 预览区显示原图/处理后对比信息（尺寸、大小）

- [x] Task 4: 滤镜缩略图预览
  - [x] 上传图片后，为每个滤镜生成小缩略图预览
  - [x] 缩略图使用 canvas 快速渲染（低分辨率）
  - [x] 滤镜按钮布局调整为缩略图+名称

- [x] Task 5: 水印面板条件显示
  - [x] 选择"无"时隐藏所有水印控件（文字内容、颜色、字号、透明度、位置、模式）
  - [x] 选择"文字"时显示文字相关控件
  - [x] 选择"图片"时显示图片相关控件
  - [x] 更新 updateWatermarkUI 逻辑

- [x] Task 6: Toast 加图标 + 进度条动画 + 结果项 loading
  - [x] Toast 根据类型添加图标（success: bi-check-circle-fill, error: bi-x-circle-fill, warning: bi-exclamation-triangle-fill, info: bi-info-circle-fill）
  - [x] 进度条添加条纹流动动画（CSS animation）
  - [x] 结果项处理中时缩略图显示 loading 旋转动画

- [x] Task 7: 设置持久化
  - [x] 页面关闭前保存 state.settings 到 localStorage
  - [x] 页面打开时从 localStorage 恢复设置
  - [x] 恢复设置后同步 UI 控件状态

# Task Dependencies
- Task 2 依赖 Task 1（Hero 精简后上传区位置调整）
- Task 3 依赖 Task 2（预览面板在上传区收缩后的空间中显示）
- Task 4 依赖 Task 3（滤镜缩略图需要预览面板的 canvas 渲染能力）
- Task 5、6、7 无依赖，可并行
