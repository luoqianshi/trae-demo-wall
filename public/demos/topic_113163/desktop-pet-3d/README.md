# 桌面宠物原型

这是第一版 Windows 桌面宠物原型。当前路线已调整为“视频动作宠物引擎”：用透明视频或内置占位动画表现宠物动作，用状态机和窗口路径控制桌面行为。

## 已实现

- 透明、置顶、无边框桌面宠物窗口
- 视频动作层：使用透明 WebM 表现宠物动作
- 无素材时自动使用内置 CSS 占位猫动画
- 鼠标点击：开心互动
- 鼠标按住宠物可拖动窗口
- 鼠标右键菜单：睡觉、醒来、切换尺寸、关闭桌面宠物
- 支持迷你、小、中、大四种宠物窗口尺寸
- 自动记住上次窗口位置和尺寸
- 右键菜单可一键回到底部中间，也可以忘记当前位置
- 已接入待机、开心、睡觉等透明视频动作；睡觉当前直接进入循环动画

## 运行方式

最简单的方式是在外层文件夹双击：

```text
启动3D桌面宠物-无黑窗.vbs
```

如果想停止桌宠，双击：

```text
停止3D桌面宠物.bat
```

如果需要查看运行日志：

```text
logs/desktop-pet.log
```

窗口位置和尺寸会保存在：

```text
config/window-state.json
```

如果拖乱位置，可以右键点 `回到底部中间`。如果想完全恢复默认位置和默认尺寸，可以右键点 `忘记当前位置`。

开发方式运行：

```bash
npm install
npm start
```

后续运行：

```bash
npm start
```

也可以直接双击外层文件夹里的 `打开3D桌面宠物.bat`，这是备用启动方式。

## 动作素材

当前你的猫的透明视频素材放在：

```text
assets/video-pets/my-cat
```

当前支持这些动作文件名：

```text
idle.webm
walk.webm
sleep_loop.webm
sleep_enter.webm  备用，当前程序暂不启用
happy.webm
happy_hold.webm
paw_hit.webm
angry_run.webm
crazy_run.webm
```

没有这些文件时，程序会自动显示内置占位猫。动作生成提示词在：

```text
assets/video-pets/my-cat/ACTION_PROMPTS.md
```

## 照片预处理

如果要用宠物正面、侧面、背面照片制作动作素材，可以先用 `remove.bg` 抠图。

先打开配置文件：

```text
config/removebg-config.json
```

把 `apiKey` 填成你的 remove.bg API Key：

```json
{
  "apiKey": "你的 remove.bg API Key"
}
```

然后创建一个宠物素材目录，例如：

```text
assets/source-pets/my-cat/input
```

把照片放进去，建议命名：

```text
front.jpg
left.jpg
right.jpg
back.jpg
sit.jpg
```

第一次使用前安装脚本依赖：

```bash
pip install -r tools/requirements.txt
```

运行预处理：

```bash
python tools/preprocess_pet_photos.py my-cat
```

输出结果：

```text
assets/source-pets/my-cat/transparent  透明背景 PNG
assets/source-pets/my-cat/green        绿色背景 JPG
assets/source-pets/my-cat/manifest.json
```

为了让同一只猫在不同角度里颜色更一致，可以继续运行色调统一脚本。默认用 `front.png` 作为参考：

```bash
python tools/normalize_pet_colors.py my-cat --reference front.png
```

输出结果：

```text
assets/source-pets/my-cat/normalized          统一色调后的透明背景 PNG
assets/source-pets/my-cat/green_normalized    统一色调后的绿色背景 JPG
assets/source-pets/my-cat/color-normalized-manifest.json
```

后续生成视频时，优先使用 `normalized` 或 `green_normalized` 里的素材。

## 当前说明

`sleep_enter.webm` 已保留在素材目录里，但当前版本暂时不播放过渡动画，因为过渡到循环时会有明显跳动。右键“睡觉”会直接播放 `sleep_loop.webm`，这样更稳定。

## 下一步

- 准备一套透明 WebM 猫动作素材
- 做宠物的家、玩具和更多场景
- 支持不同动物动作包：猫、狗、熊猫、青蛙、鸡
- 增加设置面板：宠物大小、透明度、是否置顶、开机启动
- 增加桌面功能：隐藏桌面图标、喝水提醒、使用时长记录
