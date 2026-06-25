# Image Studio UI 与交互优化 Spec

## Why
当前页面存在布局结构问题（Header 在 Hero 下方已修复）、Hero 内容冗余、上传区占用空间不合理、缺少实时预览、裁剪功能不可用、滤镜差异不明显、EXIF 读取不稳定、水印默认值错误等问题，需要系统性优化。

## What Changes
- **精简 Hero**：移除 hero-desc 详细描述、hero-features 功能列表、heroCta 按钮，仅保留标题和一句核心标语
- **上传区自动收缩**：有图片后上传区缩小为一行"继续添加"按钮，释放空间给预览和结果
- **实时预览面板**：右侧工作区顶部加预览区，设置变更时实时显示处理效果
- **滤镜缩略图预览**：滤镜按钮用当前图片生成小缩略图预览，替代纯文字
- **水印面板条件显示**：选"无"时隐藏所有水印控件
- **Toast 加图标**：成功/错误/警告/信息各有对应图标
- **进度条动画**：处理中显示条纹动画
- **结果项处理中状态**：每张图片处理时显示 loading 动画
- **设置持久化**：localStorage 保存上次设置，下次打开自动恢复

## Impact
- Affected code: index.html, app.js, styles.css
- 无 breaking changes，所有功能向后兼容

## ADDED Requirements

### Requirement: Hero 精简
Hero 区域 SHALL 仅保留品牌标题和一句核心标语，移除详细描述、功能列表和 CTA 按钮。

#### Scenario: 首屏展示
- **WHEN** 用户打开页面
- **THEN** Hero 仅显示标题和一句标语，无冗余内容

### Requirement: 上传区自动收缩
上传区 SHALL 在有图片后自动缩小为一行"继续添加"按钮，点击可展开完整上传区。

#### Scenario: 有图片后收缩
- **WHEN** 用户上传了至少一张图片
- **THEN** 上传区缩小为一行按钮，显示"继续添加图片"

#### Scenario: 点击展开
- **WHEN** 用户点击"继续添加"按钮
- **THEN** 展开完整上传区供用户继续上传

### Requirement: 实时预览面板
右侧工作区 SHALL 在有图片时显示预览区，设置变更时实时更新预览效果。

#### Scenario: 设置变更时预览
- **WHEN** 用户修改任何设置（格式、质量、滤镜等）
- **THEN** 预览区在 200ms 防抖后更新为最新效果

#### Scenario: 多张图片时预览第一张
- **WHEN** 有多张图片
- **THEN** 预览区显示第一张（或选中图片）的处理效果

### Requirement: 滤镜缩略图预览
滤镜按钮 SHALL 显示当前图片的小缩略图预览，而非纯文字。

#### Scenario: 选择滤镜
- **WHEN** 用户查看滤镜面板
- **THEN** 每个滤镜按钮显示应用该滤镜后的小缩略图

### Requirement: 水印面板条件显示
水印面板 SHALL 在选择"无"时隐藏所有水印相关控件。

#### Scenario: 选择"无"
- **WHEN** 用户选择水印类型为"无"
- **THEN** 隐藏文字内容、颜色、字号、透明度、位置、模式等控件

### Requirement: Toast 加图标
Toast 通知 SHALL 根据类型显示对应图标（成功✓、错误✕、警告⚠、信息ℹ）。

#### Scenario: 显示 Toast
- **WHEN** 系统弹出 Toast 通知
- **THEN** 通知左侧显示对应类型的图标

### Requirement: 进度条动画
进度条 SHALL 在处理中显示条纹动画，让用户知道系统仍在工作。

#### Scenario: 处理中
- **WHEN** 图片正在处理
- **THEN** 进度条显示流动的条纹动画

### Requirement: 结果项处理中状态
结果列表中每张图片 SHALL 在处理时显示 loading 动画。

#### Scenario: 处理中状态
- **WHEN** 图片正在处理
- **THEN** 缩略图区域显示 loading 旋转动画

### Requirement: 设置持久化
用户设置 SHALL 保存到 localStorage，下次打开自动恢复。

#### Scenario: 恢复设置
- **WHEN** 用户重新打开页面
- **THEN** 上次的格式、质量、滤镜等设置自动恢复

## MODIFIED Requirements

### Requirement: Hero 区域
Hero 区域从包含描述、功能列表、CTA 按钮的完整首屏，精简为仅包含标题和核心标语。
