# 预设动画修复记录 - 2026-06-24

## 问题描述
预设动画（shake、pulse、sway 等）在展示区和导出视频中均无效果。

## 根因分析

### Bug 1：展示区播放逻辑错误（`app.js` 约6158行）
`animate` 函数中处理预设动画的代码存在两个错误：

1. **`existingAnims` 的 duration/delay/iterations 被写死**（`'1s'`/`'0s'`/`'1'`），
   导致入场动画的实际时长丢失，浏览器解析 `animation` 简写失败，所有动画被忽略。

2. **清除预设动画时只清了 `style`，没有恢复入场/出场 CSS 类**，
   导致出场动画无法执行。

### Bug 2：导出视频缺少动画处理函数
`calcAnimTransform` 函数缺少以下 CSS @keyframes 对应的处理：
`twist`、`spiral`、`ripple`、`rotate`、`flipX`、`flipY`、
`heartbeat`、`tada`、`rubberBand`、`wobble`、`jello`、`lightSpeed`、`rollIn`
导出视频时这些动画会落入默认分支（无变换），完全无效果。

## 修复内容

### 修复1：`animate` 函数（展示区）
**文件**：`G:\phpstudy_pro\WWW1\JGW\JGWOK3\app.js`
**位置**：约6158-6220行（处理预设动画的 `setTimeout` 块）

改动要点：
- 不再把入场/出场动画的 @keyframes 名混进 `animationName`
- 改用 `block.style.animation`（简写属性）单独设置预设动画，
  格式：`name duration timing delay iteration fillMode`
- 清除预设动画时只清 `block.style.animation`，不碰 CSS 类
- 同时清掉 `block.style.transform`，避免旋转/翻转残留影响出场动画

### 修复2：`calcAnimTransform` 函数（导出视频）
**文件**：`G:\phpstudy_pro\WWW1\JGW\JGWOK3\app.js`
**位置**：约7646行（默认返回前）

补充了以下动画的 `calcAnimTransform` 处理：
| 动画名 | 实现方式 |
|--------|-----------|
| `twist` | rotate -15~+15° 往复 |
| `spiral` | 螺旋位移 + 缩放 + 旋转 |
| `ripple` | 缩放脉冲 + 透明度渐弱 |
| `rotate` | 360° 旋转 |
| `flipX` | scaleX = cos(πp) 模拟水平翻转 |
| `flipY` | scaleY = cos(πp) 模拟垂直翻转 |
| `heartbeat` | 缩放脉冲（频率×2） |
| `tada` | 抖动位移 + 缩放 |
| `rubberBand` | X/Y 独立缩放模拟橡皮筋 |
| `wobble` | 摆动（同 sway 近似） |
| `jello` | X/Y 独立缩放近似 skew |
| `lightSpeed` | 水平位移 + 渐入透明度 |
| `rollIn` | 旋转 + 水平位移 + 渐入 |

## 验证方式
1. 打开 `index.html`，添加文字块，添加预设动画（如 shake、pulse）
2. 点击播放，观察预设动画是否正常显示，出场动画是否正常执行
3. 点击"导出视频"，检查导出视频中预设动画是否生效

## 备注
- CSS @keyframes 名称与 `calcAnimTransform` 中的 `animName` 必须一致
- 导出视频使用 Canvas 逐帧绘制，`calcAnimTransform` 的精度直接影响视频效果
- `flipX`/`flipY` 用 scale 模拟翻转，与真实 3D flip 有视觉差异，属可接受近似
