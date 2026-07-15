# Session 01 - 架构审计与状态一致性加固

## 一、状态流分析

### 核心运行链路

```
中文场景设置 → 持续英文识别 → YOU/STAFF 轮次判断 → 中文翻译 → 刷新建议 → 后端不可达降级
```

### 状态依赖关系

| 状态变量 | 类型 | 核心作用 | 依赖 |
|---------|------|---------|------|
| `fallbackConversationActive` | bool | 是否处于 HOST LIVE 模式 | `recognitionMode`, `autoRealtimeEnabled` |
| `realtimeRecording` | bool | 是否正在实时录音 | `recorder`, `realtimeRecorderStarting` |
| `realtimeSocketOpen` | bool | WebSocket 是否连接 | `realtimeSocket` |
| `realtimeFinishing` | bool | 是否正在关闭实时同传 | 作为互斥锁 |
| `autoRealtimeEnabled` | bool | 是否允许自动同传 | `autoRealtimeSuspended` |
| `dialogExpecting` | enum | 期望下一个说话方 | `classifyLiveSpeaker` |
| `recognitionMode` | enum | 场景/对话模式 | `beginRecognition` |

### 用户交互门禁

1. **麦克风授权**：`RecorderManager.start` 必须直接发生在语音唤醒或硬件键事件的调用栈内
2. **GlobalHook 镜腿键**：只用于暂停/恢复整段会话，不用于逐句操作
3. **唤醒词**：用于开始中文场景或语音指令识别

### 边界情况

1. **后端不可达**：自动进入 HOST LIVE 连续识别模式
2. **网络中断**：WebSocket 断开后自动重连
3. **语音识别失败**：自动重试机制（最多 1800ms 延迟）
4. **AI 忙碌**：fallback 队列处理，等待当前 AI 任务完成
5. **快速连续操作**：防止重复触发的互斥机制

## 二、发现的问题

### 问题 1：`finishRealtimeTranslation` 缺少状态清理（严重）

**位置**：`pages/index/index.ink` 第 1254-1275 行

**问题描述**：
- `finishRealtimeTranslation` 在成功停止录音后直接 `return`，未调用 `closeRealtimeSocket()` 清理 socket 和状态
- 导致 `realtimeFinishing` 保持为 `true`，后续无法重新开启同传
- 同时 `realtimeRecording` 和 `realtimeRecorderStarting` 未被重置

**影响**：用户暂停同传后无法恢复，需要刷新页面

**关键代码（修复前）**：
```javascript
async finishRealtimeTranslation() {
    if (this.realtimeFinishing) {
      return;
    }
    this.realtimeFinishing = true;

    if (this.recorder && this.realtimeRecording) {
      try {
        await this.recorder.stop();
        return;  // ⚠️ 直接返回，未清理状态
      } catch (error) {
        console.log('Realtime recorder stop failed:', error);
      }
    }
    // ...
}
```

### 问题 2：`closeRealtimeSocket` 错误重置 `realtimeFinishing`（中等）

**位置**：`pages/index/index.ink` 第 1278-1295 行

**问题描述**：
- `closeRealtimeSocket` 在清理时无条件重置 `realtimeFinishing = false`
- 当 `finishRealtimeTranslation` 正在异步等待录音停止时，若 `closeRealtimeTranslation` 被其他路径调用，会提前重置互斥标志
- 导致互斥失效，可能并发执行清理逻辑

### 问题 3：`closeRealtimeTranslation` 缺少重复调用保护（中等）

**位置**：`pages/index/index.ink` 第 1297-1326 行

**问题描述**：
- `closeRealtimeTranslation` 没有检查 `realtimeFinishing` 标志
- 可能与 `finishRealtimeTranslation` 并发执行，导致状态不一致

## 三、修改文件

### 3.1 `pages/index/index.ink`

#### 改动 1：修复 `finishRealtimeTranslation` 状态清理

**行号**：1254-1281

**关键 diff**：
```diff
-    if (this.recorder && this.realtimeRecording) {
+    const wasRecording = this.recorder && this.realtimeRecording;
+    this.realtimeRecording = false;
+    this.realtimeRecorderStarting = false;
+    this.pendingAudioFrames = [];
+
+    if (wasRecording) {
       try {
         await this.recorder.stop();
-        return;  // ⚠️ 移除直接返回
       } catch (error) {
         console.log('Realtime recorder stop failed:', error);
       }
     }
     // ...
+    this.closeRealtimeSocket();
+    this.realtimeFinishing = false;
```

**改动说明**：
- 提前记录 `wasRecording` 状态并立即重置录音相关标志
- 移除 `return`，确保无论录音是否成功停止都会调用 `closeRealtimeSocket()`
- 在方法末尾正确重置 `realtimeFinishing`

#### 改动 2：修复 `closeRealtimeSocket` 不重置 `realtimeFinishing`

**行号**：1283-1294

**关键 diff**：
```diff
-    this.realtimeFinishing = false;  // ⚠️ 移除这一行
```

**改动说明**：移除错误的 `realtimeFinishing` 重置，由调用方负责管理互斥标志

#### 改动 3：修复 `closeRealtimeTranslation` 添加重复调用保护

**行号**：1297-1326

**关键 diff**：
```diff
+    if (this.realtimeFinishing) {
+      return;
+    }
+    this.realtimeFinishing = true;
     // ...
     this.closeRealtimeSocket();
+    this.realtimeFinishing = false;
```

**改动说明**：
- 添加 `realtimeFinishing` 检查作为互斥锁
- 在方法末尾正确重置互斥标志

## 四、执行命令与结果

### 4.1 运行后端测试

```bash
cd backend
python -m pytest tests/test_main.py -v
```

**结果**：
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
collected 5 items

tests/test_main.py::CoachPromptTests::test_partner_prompt_contains_scene_context_and_reply PASSED
tests/test_main.py::CoachPromptTests::test_user_prompt_keeps_current_suggestion PASSED
tests/test_main.py::ModelNormalizationTests::test_normalizes_valid_json PASSED
tests/test_main.py::ModelNormalizationTests::test_rejects_missing_required_fields PASSED
tests/test_main.py::ModelNormalizationTests::test_rejects_non_json_response PASSED

============================== 5 passed in 1.19s ==============================
```

### 4.2 静态检查

**JavaScript 语法检查**：
```bash
node --check pages/index/index.ink
```

**结果**：无语法错误

## 五、仍存在的限制

### 5.1 已知限制

1. **单麦克风说话方判定**：依赖建议相似度和对话轮次，无法做到声纹级身份识别
2. **浏览器兼容性**：`SpeechRecognition` API 在部分浏览器中不可用
3. **网络延迟**：WebSocket 重连有 800ms 延迟，可能错过短暂的语音输入
4. **AI 响应延迟**：fallback 模式下 AI 响应可能较慢，影响用户体验

### 5.2 潜在改进方向

1. **增加状态机可视化**：添加调试面板显示当前状态转换
2. **优化重连策略**：根据网络质量动态调整重连延迟
3. **增加录音缓冲**：在网络恢复后重播缓冲的音频帧
4. **强化错误日志**：记录更详细的错误上下文，便于问题定位

## 六、总结

本次审计发现并修复了 3 个状态一致性问题，主要集中在实时同传的关闭流程中：

1. **严重问题**：`finishRealtimeTranslation` 缺少状态清理，导致暂停后无法恢复
2. **中等问题**：`closeRealtimeSocket` 错误重置互斥标志，可能导致并发问题
3. **中等问题**：`closeRealtimeTranslation` 缺少重复调用保护

修复后，实时同传的暂停/恢复流程更加健壮，状态转换更加一致。所有后端测试通过，JavaScript 语法检查通过。