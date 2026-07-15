# Agent Manifest

## Identity

- **Name**: 跨语言沟通助手
- **English Name**: Cross-language Communication Assistant
- **Version**: 1.2.0
- **Description**: 运行在 Rokid AI 眼镜中的面对面跨语言沟通副驾驶，提供实时双语对话记录与上下文英文表达建议。
- **Author**: Rokid AIUI Demo

## Capabilities

- **Permissions**:
  - microphone
  - network
  - audio
- **Skills**:
  - scene-understanding
  - speech-recognition
  - bilingual-translation
  - contextual-response-coaching

## Interaction Model

- 用户用中文描述沟通场景、对象、地点与目标。
- 左侧建议栏持续给出用户可以亲自说出的英文表达。
- 右侧翻译栏记录双方对话，并显示中文翻译。
- 唤醒词用于开始中文场景或语音指令识别。
- `GlobalHook` 镜腿键用于暂停或恢复自动实时同传。
- 主流程不需要进入按钮导航模式。

## UI Presentation

- **Required mode**: Full-screen interactive page / Interactive InkView
- **Landing route**: `pages/index/index`
- 不要把本页作为 conversation-flow card 承载；对话流卡片是只读表面，无法使用麦克风、语音唤醒或硬件键事件。
- 进入全屏页后，先通过唤醒词更新中文场景，再说“开始同传”或按一次 `GlobalHook` 镜腿键完成麦克风交互授权。
- 同传开启后会持续监听英文对话；后续每句话不需要按键，`GlobalHook` 仅用于暂停或恢复整段会话。
- 实时后端不可达时自动进入 `HOST LIVE` 连续识别模式；宿主每次识别结束后页面会自动恢复监听，不要求逐句操作。
- 中文场景识别完成后无论实时后端是否可达，都先自动进入连续对话循环；每句话使用一个全新的语音识别会话，避免固件复用旧会话后停止监听。
- 单麦克风模式使用“当前建议相似度 + YOU/STAFF 对话轮次”区分说话方：场景后的第一句视为 YOU，随后按双方轮次推进。
