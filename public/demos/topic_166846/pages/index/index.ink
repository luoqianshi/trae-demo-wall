<script def>
{
  "navigationBarTitleText": "跨语言沟通助手",
  "description": "作为全屏 Interactive InkView 运行的语音优先面对面跨语言沟通副驾驶：左侧根据场景与对话上下文推荐下一句英文，右侧在用户完成一次麦克风交互授权后持续监听英文，并实时呈现我方和对方的原文与中文翻译。本页通过语音唤醒设置中文场景，不应作为只读 conversation-flow card 承载。",
  "schema": {
    "data": {
      "type": "object",
      "properties": {
        "scene": {
          "type": "string",
          "description": "用户用中文描述的当前沟通场景"
        },
        "goal": {
          "type": "string",
          "description": "用户希望在当前场景中完成的沟通目标"
        },
        "targetLanguage": {
          "type": "string",
          "enum": ["en-US"],
          "description": "建议与对话识别使用的目标语言"
        },
        "transcript": {
          "type": "array",
          "description": "已发生的双语对话记录",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "对话条目标识"
              },
              "speaker": {
                "type": "string",
                "enum": ["我", "对方"],
                "description": "说话方"
              },
              "original": {
                "type": "string",
                "description": "识别到的原文"
              },
              "translation": {
                "type": "string",
                "description": "原文对应的中文翻译"
              }
            },
            "required": ["id", "speaker", "original", "translation"]
          }
        }
      }
    }
  }
}
</script>

<script setup>
import wx from 'wx';
import { LanguageModel } from 'language-model';
import {
  buildBackendHttpUrl,
  buildBackendWebSocketUrl,
  isBackendConfigured
} from '../../lib/backend-config.js';

const SCENES = [
  {
    title: '酒店前台',
    detail: '办理入住，并询问能否延迟退房',
    suggestion: 'Here is my passport. Could I also request a late check-out?',
    intent: '递交护照，同时礼貌询问延迟退房',
    pronunciation: 'heer iz my PAS-port · kuh-dai REE-kwest a layt chek-out'
  },
  {
    title: '餐厅点餐',
    detail: '确认菜品不含花生，并请求推荐',
    suggestion: 'I have a peanut allergy. Could you recommend a safe dish?',
    intent: '说明过敏情况，请对方推荐安全菜品',
    pronunciation: 'ai hav a PEE-nut AL-er-jee · kud yoo reh-kuh-MEND'
  },
  {
    title: '医院接待处',
    detail: '说明头痛症状，并询问如何挂号',
    suggestion: 'I have had a headache since this morning. How can I register?',
    intent: '说明症状持续时间，并询问挂号方式',
    pronunciation: 'ai hav had a HED-ayk · how kan ai REJ-uh-ster'
  }
];

const DEMO_STEPS = [
  {
    outgoingTranslation: '给您护照。我还可以申请延迟退房吗？',
    incoming: 'Thank you. Late check-out is available until two p.m. for an extra fee.',
    incomingTranslation: '谢谢。支付额外费用后，可以延迟到下午两点退房。',
    nextSuggestion: 'How much is the extra fee for checking out at two p.m.?',
    nextIntent: '确认延迟到下午两点需要支付多少费用',
    nextPronunciation: 'how much iz thee EK-struh fee · for chek-ing out at too'
  },
  {
    outgoingTranslation: '延迟到下午两点退房需要支付多少额外费用？',
    incoming: 'It is twenty dollars. Would you like me to add it to your booking?',
    incomingTranslation: '费用是二十美元。需要我把它加到您的预订里吗？',
    nextSuggestion: 'Yes, please add it to my booking. Thank you.',
    nextIntent: '确认接受费用，并请对方加入预订',
    nextPronunciation: 'yes pleez ad it to my BOOK-ing · thank yoo'
  },
  {
    outgoingTranslation: '好的，请把它加到我的预订里，谢谢。',
    incoming: 'All set. Your room is on the eighth floor, and breakfast starts at seven.',
    incomingTranslation: '已经办好了。您的房间在八楼，早餐七点开始。',
    nextSuggestion: 'Great. Where can I find the elevators?',
    nextIntent: '确认已了解，并询问电梯位置',
    nextPronunciation: 'grayt · wair kan ai find thee EL-uh-vay-ters'
  },
  {
    outgoingTranslation: '太好了。请问电梯在哪里？',
    incoming: 'They are just around the corner on your left.',
    incomingTranslation: '就在拐角处，您的左手边。',
    nextSuggestion: 'Got it. Thank you for your help.',
    nextIntent: '确认路线并结束本次沟通',
    nextPronunciation: 'got it · thank yoo for yor help'
  }
];

const SCENE_DEMO_STEPS = [
  DEMO_STEPS,
  [
    {
      outgoingTranslation: '我对花生过敏。您可以推荐一道安全的菜吗？',
      incoming: 'Of course. The grilled salmon is peanut-free and prepared separately.',
      incomingTranslation: '当然。烤三文鱼不含花生，并且会单独制作。',
      nextSuggestion: 'That sounds good. Does it come with any side dishes?',
      nextIntent: '表示感兴趣，并询问是否搭配配菜',
      nextPronunciation: 'that sounds gud · duz it kum with EN-ee side dish-iz'
    },
    {
      outgoingTranslation: '听起来不错。它有搭配的配菜吗？',
      incoming: 'Yes, it comes with rice and seasonal vegetables.',
      incomingTranslation: '有，配米饭和时令蔬菜。',
      nextSuggestion: 'Perfect. I will have the grilled salmon, please.',
      nextIntent: '确认选择烤三文鱼并完成点餐',
      nextPronunciation: 'PER-fekt · ai wil hav the grild SAM-un pleez'
    }
  ],
  [
    {
      outgoingTranslation: '我从今天早上开始头痛。请问该怎么挂号？',
      incoming: 'Please fill out this form. A nurse will see you in about fifteen minutes.',
      incomingTranslation: '请填写这张表。大约十五分钟后会有护士接诊。',
      nextSuggestion: 'Thank you. Do I need to provide my insurance information?',
      nextIntent: '表示感谢，并确认是否需要提供保险信息',
      nextPronunciation: 'thank yoo · doo ai need to pro-VIDE my in-SHUR-ens'
    },
    {
      outgoingTranslation: '谢谢。我需要提供保险信息吗？',
      incoming: 'Yes, please show your insurance card at the counter.',
      incomingTranslation: '需要，请在柜台出示您的保险卡。',
      nextSuggestion: 'Understood. I have it with me.',
      nextIntent: '确认已经理解，并说明随身带有保险卡',
      nextPronunciation: 'un-der-STOOD · ai hav it with mee'
    }
  ]
];

function createInitialTranscript() {
  return [
    {
      id: 'turn-initial-user',
      speaker: '我',
      speakerLabel: 'YOU',
      sideClass: 'message-mine',
      original: 'Hi, I have a reservation under the name Chen.',
      translation: '你好，我有一个姓陈的预订。'
    },
    {
      id: 'turn-initial-partner',
      speaker: '对方',
      speakerLabel: 'STAFF',
      sideClass: 'message-partner',
      original: 'Welcome. May I see your passport, please?',
      translation: '欢迎。可以请您出示护照吗？'
    }
  ];
}

export default {
  data: {
    sceneIndex: 0,
    sceneTitle: SCENES[0].title,
    sceneDetail: SCENES[0].detail,
    targetLanguage: '中文 → EN',
    assistantState: '等待开启同传',
    runtimeMode: 'LOCAL 1.2',
    listening: false,
    listeningLabel: 'READY',
    listeningClass: 'status-idle',
    suggestion: SCENES[0].suggestion,
    intent: SCENES[0].intent,
    pronunciation: SCENES[0].pronunciation,
    transcript: [],
    activeTranscriptId: '',
    demoStep: 0,
    footerHint: '唤醒描述场景 · 说“开始同传”或按镜腿键',
    aiBusy: false,
    recognitionAvailable: false,
    recognitionState: 'idle',
    backendReady: false,
    realtimeAvailable: false,
    diagnosticText: 'RT 初始化',
    diagnosticVisible: false,
    audioFrameCount: 0,
    socketEventCount: 0
  },

  onLoad() {
    this.coachSession = null;
    this.backendReady = false;
    this.realtimeAvailable = false;
    this.recognition = null;
    this.recognitionMode = 'conversation';
    this.fallbackConversationActive = false;
    this.recognitionRestartTimer = null;
    this.fallbackQueueTimer = null;
    this.fallbackUtteranceQueue = [];
    this.processingFallbackUtterance = false;
    this.lastRecognitionText = '';
    this.lastRecognitionAt = 0;
    this.recognitionNeedsRenewal = false;
    this.recognitionRestartAttempt = 0;
    this.recognitionCycleCount = 0;
    this.recorder = null;
    this.realtimeSocket = null;
    this.realtimeSocketOpen = false;
    this.realtimeFinishing = false;
    this.realtimeFinishEventSent = false;
    this.realtimeFinishTimer = null;
    this.realtimeRecorderStarting = false;
    this.realtimeSessionReady = false;
    this.realtimeAutoRestartTimer = null;
    this.autoRealtimeEnabled = true;
    this.autoRealtimeSuspended = false;
    this.dialogExpecting = 'user';
    this.currentLiveSpeaker = null;
    this.audioFrameCount = 0;
    this.socketEventCount = 0;
    this.pendingAudioFrames = [];
    this.liveMessageId = '';
    this.liveOriginal = '';
    this.liveTranslation = '';
    this.bindRecognition();
    this.bindRecorder();
    this.initializeCoach();
  },

  onUnload() {
    if (this.realtimeAutoRestartTimer) {
      clearTimeout(this.realtimeAutoRestartTimer);
      this.realtimeAutoRestartTimer = null;
    }
    if (this.recognitionRestartTimer) {
      clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }
    if (this.fallbackQueueTimer) {
      clearTimeout(this.fallbackQueueTimer);
      this.fallbackQueueTimer = null;
    }
    this.fallbackConversationActive = false;
    this.fallbackUtteranceQueue = [];
    this.closeRealtimeTranslation();
    this.disposeRecognition();
    if (this.coachSession) {
      this.coachSession.destroy();
      this.coachSession = null;
    }
  },

  bindRecognition() {
    if (typeof SpeechRecognition === 'undefined') {
      this.setData({
        recognitionAvailable: false,
        assistantState: '当前宿主不支持语音识别'
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      const isConversation = this.recognitionMode === 'conversation';
      this.recognitionNeedsRenewal = false;
      this.recognitionRestartAttempt = 0;
      this.recognitionCycleCount = (this.recognitionCycleCount || 0) + 1;
      this.setData({
        recognitionState: 'listening',
        listening: true,
        listeningLabel: isConversation ? 'AUTO LIVE' : 'SCENE',
        listeningClass: 'status-live',
        assistantState: isConversation ? '持续监听双方英文' : '正在听取中文场景',
        footerHint: isConversation
          ? '自动按对话轮次区分 YOU / STAFF'
          : '请说出地点、对象和沟通目的'
      });
    };

    recognition.onresult = (event) => {
      const results = event && event.results ? event.results : null;
      const resultCount = results && typeof results.length === 'number'
        ? results.length
        : 0;
      const resultIndex =
        event && typeof event.resultIndex === 'number'
          ? event.resultIndex
          : Math.max(0, resultCount - 1);
      const result =
        results && (results[resultIndex] || results[resultCount - 1]);
      const transcript =
        result && result[0] && result[0].transcript
          ? String(result[0].transcript).trim()
          : '';

      if (!transcript) {
        this.setData({
          assistantState: '没有识别到清晰语音'
        });
        return;
      }

      const now = Date.now();
      if (
        transcript === this.lastRecognitionText &&
        now - this.lastRecognitionAt < 1500
      ) {
        try {
          recognition.stop();
        } catch (error) {
          console.log('Duplicate recognition finalize skipped:', error);
        }
        return;
      }
      this.lastRecognitionText = transcript;
      this.lastRecognitionAt = now;

      if (this.recognitionMode === 'scene') {
        this.handleSceneVoiceResult(transcript);
      } else {
        this.applyConversationTranscript(transcript);
      }

      try {
        recognition.stop();
      } catch (error) {
        console.log('Recognition finalize skipped:', error);
      }
    };

    recognition.onnomatch = () => {
      this.setData({
        assistantState: '没有识别到清晰语音'
      });
      try {
        recognition.stop();
      } catch (error) {
        console.log('No-match recognition finalize skipped:', error);
      }
    };

    recognition.onerror = (event) => {
      const message =
        event && event.message
          ? event.message
          : '语音识别发生错误';
      console.log('Speech recognition error:', event && event.error, message);
      const willRetry =
        this.fallbackConversationActive &&
        this.recognitionMode === 'conversation' &&
        this.autoRealtimeEnabled &&
        !this.autoRealtimeSuspended;
      this.setData({
        recognitionState: 'error',
        assistantState: willRetry ? '语音监听短暂中断' : '语音识别失败',
        footerHint: willRetry ? '正在自动恢复持续监听' : message,
        listening: willRetry,
        listeningLabel: willRetry ? 'RESTART' : 'AUTO OFF',
        listeningClass: willRetry ? 'status-live' : 'status-idle'
      });
    };

    recognition.onend = () => {
      this.recognitionNeedsRenewal = true;
      if (this.realtimeRecording || this.realtimeRecorderStarting) {
        this.setData({
          recognitionState: 'idle'
        });
        return;
      }

      if (
        this.fallbackConversationActive &&
        this.recognitionMode === 'conversation' &&
        this.autoRealtimeEnabled &&
        !this.autoRealtimeSuspended
      ) {
        this.setData({
          recognitionState: 'idle',
          listening: true,
          listeningLabel: 'RESTART',
          listeningClass: 'status-live',
          footerHint: '正在自动继续监听下一句话'
        });
        this.scheduleFallbackRecognitionRestart(220);
        return;
      }

      this.setData({
        recognitionState: 'idle',
        listening: false,
        listeningLabel: this.canUseRealtimeTranslation() ? 'READY' : 'AUTO OFF',
        listeningClass: 'status-idle'
      });
    };

    this.recognition = recognition;
    this.setData({
      recognitionAvailable: true
    });
  },

  disposeRecognition() {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.abort();
    } catch (error) {
      console.log('Recognition dispose skipped:', error);
    }
    this.recognition = null;
  },

  scheduleFallbackRecognitionRestart(delay = 220) {
    if (this.recognitionRestartTimer) {
      clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }

    if (
      !this.fallbackConversationActive ||
      !this.autoRealtimeEnabled ||
      this.autoRealtimeSuspended ||
      this.realtimeRecording ||
      this.realtimeRecorderStarting
    ) {
      return;
    }

    const restart = () => {
      this.recognitionRestartTimer = null;
      if (
        this.fallbackConversationActive &&
        this.autoRealtimeEnabled &&
        !this.autoRealtimeSuspended &&
        this.data.recognitionState !== 'listening'
      ) {
        if (this.recognitionNeedsRenewal || !this.recognition) {
          this.bindRecognition();
        }
        this.beginRecognition('conversation');
      }
    };

    if (typeof setTimeout !== 'function' || delay <= 0) {
      restart();
      return;
    }
    this.recognitionRestartTimer = setTimeout(restart, delay);
  },

  startFallbackConversation() {
    if (!this.recognition || !this.data.recognitionAvailable) {
      this.setData({
        assistantState: '持续语音能力不可用',
        footerHint: '请确认页面在全屏 Interactive InkView 中运行'
      });
      return;
    }

    this.fallbackConversationActive = true;
    this.autoRealtimeEnabled = true;
    this.autoRealtimeSuspended = false;
    if (
      this.data.recognitionState === 'listening' &&
      this.recognitionMode === 'scene'
    ) {
      this.recognitionMode = 'conversation';
      this.setData({
        listeningLabel: 'STARTING',
        footerHint: '场景识别完成后自动持续监听双方英文'
      });
      return;
    }
    if (this.data.recognitionState !== 'listening') {
      this.beginRecognition('conversation');
    }
  },

  updateRealtimeDiagnostic(message, extra = null) {
    const payload = extra || {};
    payload.diagnosticText = message;
    payload.diagnosticVisible =
      message.indexOf('error') >= 0 ||
      message.indexOf('failed') >= 0 ||
      message.indexOf('失败') >= 0 ||
      message.indexOf('不可') >= 0 ||
      message.indexOf('异常') >= 0;
    this.setData(payload);
  },

  buildDialogueContext() {
    return this.data.transcript
      .slice(-8)
      .map((item) => {
        const label = item.speakerLabel || item.speaker || 'LIVE';
        const original = item.original || '';
        const translation = item.translation || '';
        return label + ': ' + original + (translation ? ' / ' + translation : '');
      })
      .join('\n');
  },

  canUseRealtimeTranslation() {
    return !!(
      this.backendReady &&
      (this.realtimeAvailable || this.data.realtimeAvailable) &&
      this.recorder
    );
  },

  requestBackend(path, method, data) {
    const url = buildBackendHttpUrl(path);
    if (!url) {
      return Promise.reject(new Error('Backend URL is not configured'));
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method,
        data,
        dataType: 'json',
        timeout: 30000,
        success(response) {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(response.data);
            return;
          }
          reject(new Error('Backend returned ' + response.statusCode));
        },
        fail(error) {
          reject(new Error(error && error.errMsg ? error.errMsg : 'Backend request failed'));
        }
      });
    });
  },

  async requestCoach(payload, fallbackPrompt) {
    if (this.backendReady) {
      return this.requestBackend('/api/coach', 'POST', payload);
    }
    if (!this.coachSession) {
      throw new Error('No coach model is available');
    }
    const response = await this.coachSession.prompt(fallbackPrompt);
    return this.parseSuggestion(response);
  },

  async initializeCoach() {
    if (isBackendConfigured()) {
      try {
        this.updateRealtimeDiagnostic('RT 检查后端');
        const health = await this.requestBackend('/health', 'GET', undefined);
        if (health && health.text_configured) {
          this.backendReady = true;
          const realtimeAvailable = !!health.realtime_configured;
          this.realtimeAvailable = realtimeAvailable;
          this.setData({
            backendReady: true,
            realtimeAvailable,
            runtimeMode: realtimeAvailable ? 'QWEN LIVE 1.2' : 'QWEN 1.2',
            footerHint: realtimeAvailable
              ? '实时服务已就绪 · 说“开始同传”或按镜腿键'
              : '文本建议已连接 · 实时同传未配置'
          });
          this.updateRealtimeDiagnostic(
            realtimeAvailable ? 'RT 后端OK 同传OK' : 'RT 后端OK 同传未配置'
          );
          return;
        }
      } catch (error) {
        console.log('Backend proxy unavailable, using host fallback:', error);
        this.updateRealtimeDiagnostic('RT 后端不可达');
      }
    }

    try {
      const availability = await LanguageModel.availability();
      if (availability !== 'available') {
        return;
      }

      this.coachSession = await LanguageModel.create({
        initialPrompts: [
          {
            role: 'system',
            content: '你是 Rokid AI 眼镜中的跨语言沟通教练。根据中文场景和最新对话，给用户一句自然、礼貌、简短且可以直接说出口的英文。只返回 JSON，不要输出代码块。字段为 suggestion、intent、pronunciation、translation；intent 使用中文，pronunciation 使用便于中文用户理解的英文分节提示，translation 在收到对方原文时提供中文翻译。'
          }
        ]
      });

      this.setData({
        runtimeMode: 'HOST LIVE 1.2',
        footerHint: '宿主连续识别已就绪 · 唤醒后描述场景'
      });
    } catch (error) {
      console.log('Language model fallback enabled:', error);
    }
  },

  bindRecorder() {
    try {
      const recorder = wx.media.getRecorderManager();
      if (!recorder) {
        this.updateRealtimeDiagnostic('RT 录音器不可用');
        return;
      }

      this.recorder = recorder;
      this.eventCounter = 0;
      this.updateRealtimeDiagnostic('RT 录音器OK');

      recorder.onStart(() => {
        this.realtimeRecording = true;
        this.realtimeFinishEventSent = false;
        this.realtimeRecorderStarting = false;
        this.setData({
          listening: true,
          listeningLabel: 'AUTO LIVE',
          listeningClass: 'status-live',
          assistantState: '自动监听英文中',
          footerHint: '你和对方说英文都会自动进入右侧'
        });
        this.updateRealtimeDiagnostic('RT REC start');
      });

      recorder.onFrameRecorded((payload) => {
        if (!payload || !payload.frameBuffer) {
          return;
        }

        try {
          this.audioFrameCount = (this.audioFrameCount || 0) + 1;
          if (this.audioFrameCount === 1 || this.audioFrameCount % 20 === 0) {
            this.updateRealtimeDiagnostic(
              'RT audio#' + String(this.audioFrameCount),
              { audioFrameCount: this.audioFrameCount }
            );
          }
          const audio = wx.arrayBufferToBase64(payload.frameBuffer);
          if (
            !this.realtimeSocket ||
            !this.realtimeSocketOpen ||
            !this.realtimeSessionReady
          ) {
            this.pendingAudioFrames.push(audio);
            if (this.pendingAudioFrames.length > 40) {
              this.pendingAudioFrames.shift();
            }
            return;
          }
          this.sendRealtimeAudio(audio);
        } catch (error) {
          console.log('Audio frame send failed:', error);
        }
      });

      recorder.onStop(() => {
        this.realtimeRecording = false;
        this.realtimeRecorderStarting = false;
        this.pendingAudioFrames = [];
        this.sendRealtimeFinishOnce();
      });

      recorder.onError((payload) => {
        const message =
          payload && payload.errMsg
            ? payload.errMsg
            : 'RecorderManager error';
        console.log('Realtime recorder error:', message);
        this.setData({
          listening: false,
          listeningLabel: 'AUTO OFF',
          listeningClass: 'status-idle',
          assistantState: '实时录音失败',
          footerHint: '已回退到系统语音识别'
        });
        this.updateRealtimeDiagnostic('RT REC error');
        this.closeRealtimeTranslation();
      });
    } catch (error) {
      console.log('RecorderManager unavailable:', error);
      this.updateRealtimeDiagnostic('RT 录音器异常');
    }
  },

  nextEventId(prefix) {
    this.eventCounter = (this.eventCounter || 0) + 1;
    return prefix + '_' + String(Date.now()) + '_' + String(this.eventCounter);
  },

  sendRealtimeEvent(payload) {
    if (!this.realtimeSocket || !this.realtimeSocketOpen) {
      return;
    }
    this.realtimeSocket.send(JSON.stringify(payload));
  },

  sendRealtimeFinishOnce() {
    if (
      this.realtimeFinishEventSent ||
      !this.realtimeSocket ||
      !this.realtimeSocketOpen
    ) {
      return false;
    }
    this.realtimeFinishEventSent = true;
    this.sendRealtimeEvent({
      event_id: this.nextEventId('finish'),
      type: 'session.finish'
    });
    return true;
  },

  clearRealtimeFinishTimer() {
    if (this.realtimeFinishTimer) {
      clearTimeout(this.realtimeFinishTimer);
      this.realtimeFinishTimer = null;
    }
  },

  sendRealtimeAudio(audio) {
    this.sendRealtimeEvent({
      event_id: this.nextEventId('audio'),
      type: 'input_audio_buffer.append',
      audio
    });
  },

  flushPendingAudioFrames() {
    if (
      !this.realtimeSessionReady ||
      !this.realtimeSocket ||
      !this.realtimeSocketOpen ||
      !this.pendingAudioFrames.length
    ) {
      return;
    }

    const frames = this.pendingAudioFrames.slice();
    this.pendingAudioFrames = [];
    frames.forEach((audio) => this.sendRealtimeAudio(audio));
    this.updateRealtimeDiagnostic('RT audio flush ' + String(frames.length));
  },

  armRealtimeFromInteraction() {
    if (
      !this.recorder ||
      this.realtimeRecording ||
      this.realtimeRecorderStarting
    ) {
      if ((this.realtimeRecording || this.realtimeRecorderStarting) && !this.realtimeSocket) {
        this.startRealtimeTranslation();
      }
      return;
    }

    if (!this.canUseRealtimeTranslation()) {
      this.setData({
        assistantState: '实时服务尚未就绪',
        footerHint: '确认后端可访问后，再说“开始同传”或按镜腿键'
      });
      return;
    }

    this.autoRealtimeEnabled = true;
    this.autoRealtimeSuspended = false;
    this.pendingAudioFrames = [];
    this.realtimeRecorderStarting = true;
    this.setData({
      listening: true,
      listeningLabel: 'STARTING',
      listeningClass: 'status-live',
      assistantState: '正在开启持续同传',
      footerHint: '首次开启需要麦克风授权'
    });

    let startTask;
    try {
      // RecorderManager.start 必须直接发生在语音唤醒或硬件键事件的调用栈内。
      startTask = this.recorder.start({
        sampleRate: 16000,
        numberOfChannels: 1,
        format: 'pcm'
      });
      this.startRealtimeTranslation();
      this.updateRealtimeDiagnostic('RT recorder.start requested');
    } catch (error) {
      console.log('Realtime recorder start failed:', error);
      this.updateRealtimeDiagnostic('RT recorder.start failed');
      this.realtimeRecorderStarting = false;
      this.closeRealtimeSocket();
      this.setData({
        listening: false,
        listeningLabel: 'READY',
        listeningClass: 'status-idle',
        assistantState: '麦克风未能开启',
        footerHint: '请在全屏页按一次镜腿键重试'
      });
      return;
    }

    if (startTask && startTask.catch) {
      startTask.catch((error) => {
        console.log('Realtime recorder start rejected:', error);
        this.updateRealtimeDiagnostic('RT recorder.start failed');
        this.realtimeRecorderStarting = false;
        this.closeRealtimeSocket();
        this.setData({
          listening: false,
          listeningLabel: 'READY',
          listeningClass: 'status-idle',
          assistantState: '麦克风交互授权失败',
          footerHint: '请在全屏页按一次镜腿键重试'
        });
      });
    }
  },

  scheduleRealtimeReconnect(delay = 800) {
    if (this.realtimeAutoRestartTimer) {
      clearTimeout(this.realtimeAutoRestartTimer);
      this.realtimeAutoRestartTimer = null;
    }

    if (
      !this.autoRealtimeEnabled ||
      this.autoRealtimeSuspended ||
      !this.canUseRealtimeTranslation() ||
      this.realtimeSocket ||
      !this.realtimeRecording
    ) {
      return;
    }

    this.updateRealtimeDiagnostic('RT 自动重连排队');
    if (typeof setTimeout !== 'function' || delay <= 0) {
      this.startRealtimeTranslation();
      return;
    }

    this.realtimeAutoRestartTimer = setTimeout(() => {
      this.realtimeAutoRestartTimer = null;
      if (
        this.autoRealtimeEnabled &&
        !this.autoRealtimeSuspended &&
        !this.realtimeSocket &&
        this.realtimeRecording
      ) {
        this.startRealtimeTranslation();
      }
    }, delay);
  },

  normalizeEnglishText(value) {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  tokenizeEnglish(value) {
    const normalized = this.normalizeEnglishText(value);
    if (!normalized) {
      return [];
    }
    return normalized
      .split(' ')
      .filter((token) => token.length > 1);
  },

  scoreSuggestionSimilarity(utterance, suggestion) {
    const spoken = this.normalizeEnglishText(utterance);
    const target = this.normalizeEnglishText(suggestion);
    if (!spoken || !target) {
      return 0;
    }

    if (target.indexOf(spoken) >= 0 || spoken.indexOf(target) >= 0) {
      return 1;
    }

    const spokenTokens = this.tokenizeEnglish(spoken);
    const targetTokens = this.tokenizeEnglish(target);
    if (!spokenTokens.length || !targetTokens.length) {
      return 0;
    }

    const targetSet = {};
    targetTokens.forEach((token) => {
      targetSet[token] = true;
    });

    let overlap = 0;
    spokenTokens.forEach((token) => {
      if (targetSet[token]) {
        overlap += 1;
      }
    });

    return overlap / Math.max(3, Math.min(spokenTokens.length, targetTokens.length));
  },

  hasPartnerCue(utterance) {
    const normalized = this.normalizeEnglishText(utterance);
    const cues = [
      'welcome',
      'how can i',
      'sure',
      'okay',
      'of course',
      'certainly',
      'no problem',
      'let me',
      'your passport',
      'reservation'
    ];
    return cues.some((cue) => normalized.indexOf(cue) >= 0);
  },

  classifyLiveSpeaker(utterance) {
    const similarity = this.scoreSuggestionSimilarity(
      utterance,
      this.data.suggestion
    );

    if (this.hasPartnerCue(utterance) && similarity < 0.55) {
      return {
        role: 'partner',
        speaker: '对方',
        speakerLabel: 'STAFF',
        sideClass: 'message-partner'
      };
    }

    if (similarity >= 0.42) {
      return {
        role: 'user',
        speaker: '我',
        speakerLabel: 'YOU',
        sideClass: 'message-mine'
      };
    }

    if (this.dialogExpecting === 'user' && similarity >= 0.22) {
      return {
        role: 'user',
        speaker: '我',
        speakerLabel: 'YOU',
        sideClass: 'message-mine'
      };
    }

    if (this.dialogExpecting === 'user' && !this.hasPartnerCue(utterance)) {
      return {
        role: 'user',
        speaker: '我',
        speakerLabel: 'YOU',
        sideClass: 'message-mine'
      };
    }

    return {
      role: 'partner',
      speaker: '对方',
      speakerLabel: 'STAFF',
      sideClass: 'message-partner'
    };
  },

  ensureLiveMessage() {
    if (this.liveMessageId) {
      return this.liveMessageId;
    }

    this.liveMessageId = 'turn-realtime-' + String(Date.now());
    const nextTranscript = this.data.transcript.concat([
      {
        id: this.liveMessageId,
        speaker: '识别中',
        speakerLabel: 'LIVE',
        sideClass: 'message-live',
        original: '正在听英文',
        translation: '实时翻译中'
      }
    ]).slice(-6);

    this.setData({
      transcript: nextTranscript,
      activeTranscriptId: this.liveMessageId
    });
    return this.liveMessageId;
  },

  updateLiveMessage(original, translation, speakerInfo = null) {
    const messageId = this.ensureLiveMessage();
    const nextTranscript = this.data.transcript.map((item) => {
      if (item.id !== messageId) {
        return item;
      }
      return {
        id: item.id,
        speaker: speakerInfo ? speakerInfo.speaker : item.speaker,
        speakerLabel: speakerInfo ? speakerInfo.speakerLabel : item.speakerLabel,
        sideClass: speakerInfo ? speakerInfo.sideClass : item.sideClass,
        original: original || item.original,
        translation: translation || item.translation
      };
    });

    this.setData({
      transcript: nextTranscript,
      activeTranscriptId: messageId
    });
  },

  resetLiveSegment() {
    this.liveMessageId = '';
    this.liveOriginal = '';
    this.liveTranslation = '';
    this.currentLiveSpeaker = null;
    this.realtimeCoachRequested = false;
  },

  finalizeRealtimeTurn() {
    const original = (this.liveOriginal || '').trim();
    const translation = (this.liveTranslation || '').trim();
    if (!original && !translation) {
      this.resetLiveSegment();
      return;
    }

    const speakerInfo = this.classifyLiveSpeaker(original);
    const messageId = this.ensureLiveMessage();
    this.currentLiveSpeaker = speakerInfo;
    this.updateLiveMessage(original, translation, speakerInfo);

    if (speakerInfo.role === 'user') {
      this.dialogExpecting = 'partner';
      this.setData({
        assistantState: '已记录你说的话',
        footerHint: '自动同传中 · 等对方回复'
      });
      this.resetLiveSegment();
      return;
    }

    this.dialogExpecting = 'user';
    if (!this.realtimeCoachRequested && original) {
      this.realtimeCoachRequested = true;
      this.requestPartnerCoaching(original, messageId, translation);
    }
    this.resetLiveSegment();
  },

  handleRealtimeMessage(message) {
    const rawMessage =
      message && typeof message === 'object' && message.data !== undefined
        ? message.data
        : message;

    if (typeof rawMessage !== 'string') {
      return;
    }

    let event;
    try {
      event = JSON.parse(rawMessage);
    } catch (error) {
      console.log('Ignored non-JSON realtime event');
      return;
    }

    this.socketEventCount = (this.socketEventCount || 0) + 1;
    this.updateRealtimeDiagnostic(
      'RT event ' + event.type,
      { socketEventCount: this.socketEventCount }
    );

    if (event.type === 'session.created') {
      this.setData({
        assistantState: '实时翻译会话已创建',
        footerHint: '正在初始化自动同传'
      });
      return;
    }

    if (event.type === 'session.updated') {
      this.realtimeSessionReady = true;
      this.setData({
        assistantState: '自动实时翻译已连接',
        footerHint: '直接英文对话 · 自动区分 YOU/STAFF'
      });
      this.flushPendingAudioFrames();
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.text') {
      this.liveOriginal = (event.text || '') + (event.stash || '');
      this.updateLiveMessage(this.liveOriginal, this.liveTranslation);
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      this.liveOriginal = event.transcript || this.liveOriginal;
      this.updateLiveMessage(this.liveOriginal, this.liveTranslation);
      return;
    }

    if (event.type === 'response.text.text') {
      this.liveTranslation = (event.text || '') + (event.stash || '');
      this.updateLiveMessage(this.liveOriginal, this.liveTranslation);
      return;
    }

    if (event.type === 'response.text.done') {
      this.liveTranslation = event.text || this.liveTranslation;
      this.updateLiveMessage(this.liveOriginal, this.liveTranslation);
      this.finalizeRealtimeTurn();
      return;
    }

    if (event.type === 'response.audio_transcript.text') {
      this.liveTranslation = (event.text || '') + (event.stash || '');
      this.updateLiveMessage(this.liveOriginal, this.liveTranslation);
      return;
    }

    if (event.type === 'response.audio_transcript.done') {
      this.liveTranslation = event.transcript || this.liveTranslation;
      this.updateLiveMessage(this.liveOriginal, this.liveTranslation);
      this.finalizeRealtimeTurn();
      return;
    }

    if (event.type === 'session.finished') {
      this.clearRealtimeFinishTimer();
      this.closeRealtimeSocket();
      this.realtimeFinishing = false;
      return;
    }

    if (event.type === 'error' || event.type === 'proxy.error') {
      const errorMessage =
        event.error && event.error.message
          ? event.error.message
          : '实时翻译服务错误';
      console.log('Realtime translation error:', errorMessage);
      this.setData({
        assistantState: '实时翻译失败',
        footerHint: errorMessage
      });
      this.updateRealtimeDiagnostic('RT error ' + errorMessage);
      this.closeRealtimeTranslation();
    }
  },

  startRealtimeTranslation() {
    if (this.realtimeSocket) {
      return;
    }

    const socketUrl = buildBackendWebSocketUrl();
    if (!socketUrl || !this.recorder) {
      this.setData({
        assistantState: '实时同传不可用',
        footerHint: '请检查麦克风权限与后端配置'
      });
      return;
    }

    this.liveMessageId = '';
    this.liveOriginal = '';
    this.liveTranslation = '';
    this.realtimeCoachRequested = false;
    this.clearRealtimeFinishTimer();
    this.realtimeFinishEventSent = false;
    this.realtimeFinishing = false;
    this.realtimeSessionReady = false;

    this.setData({
      assistantState: '正在连接自动同传',
      footerHint: '连接成功后会自动听英文'
    });
    this.updateRealtimeDiagnostic('RT WS connecting');

    const socket = wx.connectSocket({
      url: socketUrl
    });
    this.realtimeSocket = socket;

    socket.onOpen(() => {
      this.realtimeSocketOpen = true;
      this.updateRealtimeDiagnostic('RT WS open');
      this.sendRealtimeEvent({
        event_id: this.nextEventId('session'),
        type: 'session.update',
        session: {
          modalities: ['text'],
          sample_rate: 16000,
          input_audio_format: 'pcm',
          input_audio_transcription: {
            model: 'qwen3-asr-flash-realtime',
            language: 'en'
          },
          translation: {
            language: 'zh'
          }
        }
      });
      this.updateRealtimeDiagnostic('RT session.update sent');
    });

    socket.onMessage((message) => {
      this.handleRealtimeMessage(message);
    });

    socket.onError((error) => {
      console.log('Realtime socket error:', error);
      this.updateRealtimeDiagnostic('RT WS error');
      this.setData({
        assistantState: '实时连接失败',
        footerHint: '检查网络后按镜腿键重新开启'
      });
      this.closeRealtimeTranslation();
    });

    socket.onClose(() => {
      this.clearRealtimeFinishTimer();
      this.realtimeSocket = null;
      this.realtimeSocketOpen = false;
      this.realtimeSessionReady = false;
      this.realtimeFinishEventSent = false;
      this.realtimeFinishing = false;
      this.updateRealtimeDiagnostic('RT WS close');
      this.setData({
        listening: this.realtimeRecording,
        listeningLabel: this.realtimeRecording ? 'RECONNECT' : 'READY',
        listeningClass: this.realtimeRecording ? 'status-live' : 'status-idle'
      });
      if (
        this.autoRealtimeEnabled &&
        !this.autoRealtimeSuspended &&
        this.realtimeRecording
      ) {
        this.scheduleRealtimeReconnect(800);
      }
    });
  },

  async finishRealtimeTranslation() {
    if (this.realtimeFinishing) {
      return;
    }
    this.realtimeFinishing = true;

    const wasRecording = this.recorder && this.realtimeRecording;
    this.realtimeRecording = false;
    this.realtimeRecorderStarting = false;
    this.pendingAudioFrames = [];

    if (wasRecording) {
      try {
        await this.recorder.stop();
      } catch (error) {
        console.log('Realtime recorder stop failed:', error);
      }
    }

    this.sendRealtimeFinishOnce();
    if (!this.realtimeSocket || !this.realtimeSocketOpen) {
      this.realtimeFinishing = false;
      return;
    }

    this.clearRealtimeFinishTimer();
    if (typeof setTimeout === 'function') {
      this.realtimeFinishTimer = setTimeout(() => {
        this.realtimeFinishTimer = null;
        this.closeRealtimeSocket();
        this.realtimeFinishing = false;
      }, 1800);
      return;
    }

    this.closeRealtimeSocket();
    this.realtimeFinishing = false;
  },

  closeRealtimeSocket() {
    if (this.realtimeSocket) {
      try {
        this.realtimeSocket.close();
      } catch (error) {
        console.log('Realtime socket close skipped:', error);
      }
    }
    this.realtimeSocket = null;
    this.realtimeSocketOpen = false;
    this.realtimeSessionReady = false;
    this.updateRealtimeDiagnostic('RT socket closed');
    this.setData({
      listening: this.realtimeRecording,
      listeningLabel: this.realtimeRecording ? 'RECONNECT' : 'READY',
      listeningClass: this.realtimeRecording ? 'status-live' : 'status-idle'
    });
  },

  closeRealtimeTranslation() {
    if (this.realtimeFinishing) {
      return;
    }
    this.realtimeFinishing = true;
    this.clearRealtimeFinishTimer();

    const shouldStopRecorder =
      this.recorder && (this.realtimeRecording || this.realtimeRecorderStarting);
    this.realtimeRecording = false;
    this.realtimeRecorderStarting = false;
    this.pendingAudioFrames = [];
    if (shouldStopRecorder) {
      try {
        const stopTask = this.recorder.stop();
        if (stopTask && stopTask.catch) {
          stopTask.catch(() => {});
        }
      } catch (error) {
        console.log('Realtime recorder close skipped:', error);
      }
    }
    this.sendRealtimeFinishOnce();
    this.closeRealtimeSocket();
    this.realtimeFinishing = false;
  },

  handleChangeScene() {
    const nextIndex = (this.data.sceneIndex + 1) % SCENES.length;
    const nextScene = SCENES[nextIndex];

    this.setData({
      sceneIndex: nextIndex,
      sceneTitle: nextScene.title,
      sceneDetail: nextScene.detail,
      suggestion: nextScene.suggestion,
      intent: nextScene.intent,
      pronunciation: nextScene.pronunciation,
      transcript: [],
      activeTranscriptId: '',
      demoStep: 0,
      assistantState: '新场景已理解',
      footerHint: '自动同传中 · 直接照着建议说'
    });
    this.dialogExpecting = 'user';

    this.requestAISuggestion(
      '用户刚刚切换到场景：' + nextScene.title +
      '。沟通目标：' + nextScene.detail
    );
    this.startFallbackConversation();
  },

  handleSceneVoice() {
    this.beginRecognition('scene');
  },

  handleSceneVoiceResult(transcript) {
    const command = transcript.replace(/[，。！？\s]/g, '');

    if (
      command.indexOf('开始同传') >= 0 ||
      command.indexOf('继续同传') >= 0 ||
      command.indexOf('恢复同传') >= 0 ||
      command.indexOf('开始翻译') >= 0
    ) {
      this.startFallbackConversation();
      return;
    }

    if (
      command.indexOf('暂停同传') >= 0 ||
      command.indexOf('停止同传') >= 0 ||
      command.indexOf('停止翻译') >= 0
    ) {
      this.stopListening();
      return;
    }

    if (command.indexOf('换一句') >= 0 || command.indexOf('换个说法') >= 0) {
      this.handleAlternative();
      return;
    }

    if (command.indexOf('读一下') >= 0 || command.indexOf('听发音') >= 0) {
      this.handlePlaySuggestion();
      return;
    }

    if (command.indexOf('切换场景') >= 0 || command.indexOf('下一个场景') >= 0) {
      this.handleChangeScene();
      return;
    }

    if (command.indexOf('下一轮') >= 0 || command.indexOf('继续演示') >= 0) {
      this.handleDemoNext();
      return;
    }

    this.applySceneTranscript(transcript);
  },

  handleListeningTap() {
    if (this.canUseRealtimeTranslation()) {
      if (
        this.realtimeSocket ||
        this.realtimeRecording ||
        this.realtimeRecorderStarting
      ) {
        this.autoRealtimeEnabled = false;
        this.closeRealtimeTranslation();
        this.setData({
          assistantState: '自动同传已暂停',
          footerHint: '再按一次镜腿键恢复自动监听',
          listening: false,
          listeningLabel: 'PAUSED',
          listeningClass: 'status-idle'
        });
        return;
      }

      if (this.fallbackConversationActive) {
        this.fallbackConversationActive = false;
        if (this.recognitionRestartTimer) {
          clearTimeout(this.recognitionRestartTimer);
          this.recognitionRestartTimer = null;
        }
        try {
          this.recognition.abort();
        } catch (error) {
          console.log('Fallback recognition abort skipped:', error);
        }
      }

      this.autoRealtimeEnabled = true;
      this.autoRealtimeSuspended = false;
      this.armRealtimeFromInteraction();
      return;
    }

    if (this.data.listening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  },

  startListening() {
    if (this.canUseRealtimeTranslation()) {
      this.autoRealtimeEnabled = true;
      this.autoRealtimeSuspended = false;
      this.armRealtimeFromInteraction();
      return;
    }

    this.startFallbackConversation();
  },

  beginRecognition(mode) {
    if (!this.recognition || !this.data.recognitionAvailable) {
      this.setData({
        assistantState: '语音能力暂不可用',
        footerHint: '请确认本页已在 Interactive InkView 中打开'
      });
      return;
    }

    try {
      if (mode === 'scene' && this.realtimeSocket) {
        this.autoRealtimeSuspended = true;
        this.closeRealtimeTranslation();
      }

      this.recognitionMode = mode;
      this.recognition.lang = mode === 'scene' ? 'zh-CN' : 'en-US';
      // 某些眼镜固件不会可靠维持 continuous 会话；每句话使用独立会话更稳定。
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.setData({
        assistantState: mode === 'scene'
          ? '正在听取中文场景'
          : '持续监听双方英文',
        footerHint: mode === 'scene'
          ? '请说出地点、对象和沟通目的'
          : '自动按建议相似度与对话轮次区分双方'
      });
      this.recognition.start();
    } catch (error) {
      console.log('Recognition start failed:', error);
      const shouldRetry =
        mode === 'conversation' &&
        this.fallbackConversationActive &&
        this.autoRealtimeEnabled &&
        !this.autoRealtimeSuspended;
      this.recognitionNeedsRenewal = true;
      this.recognitionRestartAttempt = (this.recognitionRestartAttempt || 0) + 1;
      this.setData({
        listening: shouldRetry,
        listeningLabel: shouldRetry ? 'RETRY' : 'AUTO OFF',
        listeningClass: shouldRetry ? 'status-live' : 'status-idle',
        assistantState: shouldRetry ? '正在重新建立监听' : '无法开始语音识别',
        footerHint: shouldRetry
          ? '语音会话启动失败，正在自动重试'
          : '请确认已进入全屏 Interactive InkView'
      });
      if (shouldRetry) {
        const retryDelay = Math.min(
          1800,
          450 + this.recognitionRestartAttempt * 250
        );
        this.scheduleFallbackRecognitionRestart(retryDelay);
      }
    }
  },

  stopListening() {
    this.fallbackConversationActive = false;
    if (this.recognitionRestartTimer) {
      clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }
    if (this.realtimeSocket || this.realtimeRecording) {
      this.autoRealtimeEnabled = false;
      this.finishRealtimeTranslation();
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.log('Recognition stop skipped:', error);
      }
    }

    this.setData({
      listening: false,
      listeningLabel: 'AUTO OFF',
      listeningClass: 'status-idle',
      assistantState: '监听已暂停',
      footerHint: '镜腿键可重新开始自动监听'
    });
  },

  applySceneTranscript(transcript) {
    this.setData({
      sceneTitle: '自定义场景',
      sceneDetail: transcript,
      assistantState: '场景语音已识别',
      footerHint: '即将自动持续监听双方英文'
    });
    this.dialogExpecting = 'user';
    this.startFallbackConversation();

    this.requestAISuggestion(
      '用户用中文描述了当前场景和目标：' + transcript +
      '。请给出第一句适合用户亲自说出的英文。'
    );
  },

  applyConversationTranscript(transcript) {
    const normalized = (transcript || '').trim();
    if (!normalized) {
      return;
    }

    const speakerInfo = this.classifyLiveSpeaker(normalized);
    const messageId =
      'turn-fallback-' + speakerInfo.role + '-' + String(Date.now());
    const nextTranscript = this.data.transcript.concat([
      {
        id: messageId,
        speaker: speakerInfo.speaker,
        speakerLabel: speakerInfo.speakerLabel,
        sideClass: speakerInfo.sideClass,
        original: normalized,
        translation: '正在生成中文翻译'
      }
    ]).slice(-6);

    if (speakerInfo.role === 'user') {
      this.dialogExpecting = 'partner';
    } else {
      this.dialogExpecting = 'user';
    }

    this.setData({
      transcript: nextTranscript,
      activeTranscriptId: messageId,
      assistantState: speakerInfo.role === 'user'
        ? '已识别为 YOU'
        : '已识别为 STAFF',
      footerHint: speakerInfo.role === 'user'
        ? '持续监听中 · 等对方回复'
        : '持续监听中 · 正在生成下一句建议'
    });

    this.enqueueFallbackUtterance({
      transcript: normalized,
      messageId,
      speakerInfo
    });
  },

  enqueueFallbackUtterance(item) {
    this.fallbackUtteranceQueue.push(item);
    this.processFallbackUtteranceQueue();
  },

  processFallbackUtteranceQueue() {
    if (this.processingFallbackUtterance || !this.fallbackUtteranceQueue.length) {
      return;
    }

    if (this.data.aiBusy) {
      if (!this.fallbackQueueTimer && typeof setTimeout === 'function') {
        this.fallbackQueueTimer = setTimeout(() => {
          this.fallbackQueueTimer = null;
          this.processFallbackUtteranceQueue();
        }, 180);
      }
      return;
    }

    const item = this.fallbackUtteranceQueue.shift();
    this.processingFallbackUtterance = true;
    const task = item.speakerInfo.role === 'user'
      ? this.requestUserTranslation(item.transcript, item.messageId)
      : this.requestPartnerCoaching(item.transcript, item.messageId);

    Promise.resolve(task)
      .catch((error) => {
        console.log('Fallback utterance processing failed:', error);
      })
      .then(() => {
        this.processingFallbackUtterance = false;
        this.processFallbackUtteranceQueue();
      });
  },

  async requestUserTranslation(transcript, messageId) {
    if (!this.backendReady && !this.coachSession) {
      const unavailableTranscript = this.data.transcript.map((item) => {
        if (item.id !== messageId) {
          return item;
        }
        return {
          id: item.id,
          speaker: item.speaker,
          speakerLabel: item.speakerLabel,
          sideClass: item.sideClass,
          original: item.original,
          translation: '已记录；当前 AI 暂不可翻译'
        };
      });
      this.setData({
        transcript: unavailableTranscript,
        footerHint: '持续监听中 · 等对方回复'
      });
      return;
    }

    this.setData({
      aiBusy: true,
      assistantState: '正在翻译你说的话',
      footerHint: '持续监听保持开启'
    });

    try {
      const result = await this.requestCoach(
        {
          task: 'user',
          scene_title: this.data.sceneTitle,
          scene_detail: this.data.sceneDetail,
          context: this.buildDialogueContext(),
          user_text: transcript,
          current_suggestion: this.data.suggestion
        },
        '当前场景：' + this.data.sceneTitle + '，目标：' + this.data.sceneDetail +
          '。用户本人刚才说：' + transcript +
          '。只返回 JSON；translation 为准确中文翻译；suggestion 保持当前建议；intent 表示已记录用户发言；pronunciation 返回空字符串。'
      );
      const translatedTranscript = this.data.transcript.map((item) => {
        if (item.id !== messageId) {
          return item;
        }
        return {
          id: item.id,
          speaker: item.speaker,
          speakerLabel: item.speakerLabel,
          sideClass: item.sideClass,
          original: item.original,
          translation: result.translation || '已记录用户英文'
        };
      });
      this.setData({
        transcript: translatedTranscript,
        assistantState: '已记录你说的话',
        footerHint: '持续监听中 · 等对方回复',
        aiBusy: false
      });
    } catch (error) {
      console.log('User translation failed:', error);
      this.setData({
        assistantState: '已记录你说的话',
        footerHint: '持续监听中 · 翻译暂不可用',
        aiBusy: false
      });
    }
  },

  async requestPartnerCoaching(transcript, messageId, preferredTranslation = '') {
    if ((!this.backendReady && !this.coachSession) || this.data.aiBusy) {
      const unavailableTranscript = this.data.transcript.map((item) => {
        if (item.id !== messageId) {
          return item;
        }
        return {
          id: item.id,
          speaker: item.speaker,
          speakerLabel: item.speakerLabel,
          sideClass: item.sideClass,
          original: item.original,
          translation: preferredTranslation || 'AI 未连接，暂未生成翻译'
        };
      });
      this.setData({
        transcript: unavailableTranscript,
        assistantState: '对方回复已记录',
        footerHint: 'AI 连接后可生成翻译与建议'
      });
      return;
    }

    this.setData({
      aiBusy: true,
      assistantState: '正在翻译并生成下一句'
    });

    try {
      const result = await this.requestCoach(
        {
          task: 'partner',
          scene_title: this.data.sceneTitle,
          scene_detail: this.data.sceneDetail,
          context: this.buildDialogueContext(),
          partner_text: transcript,
          current_suggestion: this.data.suggestion
        },
        '当前场景：' + this.data.sceneTitle + '，目标：' + this.data.sceneDetail +
          '。对方刚才说：' + transcript +
          '。请返回 JSON：translation 为中文翻译；suggestion 为用户下一句自然简短的英文；intent 为该句中文目的；pronunciation 为英文分节发音提示。'
      );
      const translatedTranscript = this.data.transcript.map((item) => {
        if (item.id !== messageId) {
          return item;
        }
        return {
          id: item.id,
          speaker: item.speaker,
          speakerLabel: item.speakerLabel,
          sideClass: item.sideClass,
          original: item.original,
          translation: result.translation || preferredTranslation || '暂未生成中文翻译'
        };
      });

      this.setData({
        transcript: translatedTranscript,
        suggestion: result.suggestion,
        intent: result.intent,
        pronunciation: result.pronunciation,
        assistantState: '翻译与建议已更新',
        footerHint: '自动同传中 · 继续照着建议说',
        aiBusy: false
      });
      this.dialogExpecting = 'user';
    } catch (error) {
      console.log('Partner coaching failed:', error);
      this.setData({
        assistantState: '对方回复已记录',
        footerHint: '翻译服务暂不可用',
        aiBusy: false
      });
    }
  },

  handlePlaySuggestion() {
    try {
      const requestId = wx.speech.playTTS(this.data.suggestion);
      this.setData({
        assistantState: requestId ? '正在播放发音参考' : '发音参考暂不可用'
      });
    } catch (error) {
      this.setData({
        assistantState: '发音参考暂不可用'
      });
    }
  },

  handleAlternative() {
    if (!this.backendReady && !this.coachSession) {
      this.setData({
        assistantState: 'AI 未连接，保留本地建议',
        footerHint: '本地演示仍可继续推进对话'
      });
      return;
    }

    const scene = SCENES[this.data.sceneIndex];
    this.requestAISuggestion(
      '当前场景：' + scene.title +
      '。沟通目标：' + scene.detail +
      '。请提供与当前建议不同但含义相同的英文说法。',
      'alternative'
    );
  },

  async requestAISuggestion(context, task = 'suggestion') {
    if ((!this.backendReady && !this.coachSession) || this.data.aiBusy) {
      return;
    }

    this.setData({
      aiBusy: true,
      assistantState: '正在生成下一句'
    });

    try {
      const result = await this.requestCoach(
        {
          task,
          scene_title: this.data.sceneTitle,
          scene_detail: this.data.sceneDetail,
          context,
          current_suggestion: this.data.suggestion
        },
        context
      );
      this.setData({
        suggestion: result.suggestion,
        intent: result.intent,
        pronunciation: result.pronunciation,
        assistantState: '建议已更新',
        aiBusy: false
      });
      this.dialogExpecting = 'user';
    } catch (error) {
      console.log('Suggestion fallback retained:', error);
      this.setData({
        assistantState: '已保留本地建议',
        aiBusy: false
      });
    }
  },

  parseSuggestion(response) {
    try {
      const normalized = response
        .replace('```json', '')
        .replace('```', '')
        .trim();
      const parsed = JSON.parse(normalized);

      return {
        translation: parsed.translation || '',
        suggestion: parsed.suggestion || this.data.suggestion,
        intent: parsed.intent || this.data.intent,
        pronunciation: parsed.pronunciation || this.data.pronunciation
      };
    } catch (error) {
      return {
        translation: '',
        suggestion: response || this.data.suggestion,
        intent: this.data.intent,
        pronunciation: this.data.pronunciation
      };
    }
  },

  handleDemoNext() {
    const sceneSteps = SCENE_DEMO_STEPS[this.data.sceneIndex];
    const step = sceneSteps[this.data.demoStep % sceneSteps.length];
    const nextIndex = (this.data.demoStep + 1) % sceneSteps.length;
    const timestamp = String(Date.now());
    const updatedTranscript = this.data.transcript.concat([
      {
        id: 'turn-user-' + timestamp,
        speaker: '我',
        speakerLabel: 'YOU',
        sideClass: 'message-mine',
        original: this.data.suggestion,
        translation: step.outgoingTranslation
      },
      {
        id: 'turn-partner-' + timestamp,
        speaker: '对方',
        speakerLabel: 'STAFF',
        sideClass: 'message-partner',
        original: step.incoming,
        translation: step.incomingTranslation
      }
    ]).slice(-6);

    this.setData({
      transcript: updatedTranscript,
      activeTranscriptId: 'turn-partner-' + timestamp,
      demoStep: nextIndex,
      suggestion: step.nextSuggestion,
      intent: step.nextIntent,
      pronunciation: step.nextPronunciation,
      assistantState: '已根据回复更新建议',
      footerHint: '建议已更新，可以直接开口'
    });
    this.dialogExpecting = 'user';
  },

  onKeyUp(event) {
    if (event.code === 'GlobalHook') {
      event.preventDefault();
      this.handleListeningTap();
    }
  },

  onVoiceWakeup(event) {
    const keyword = event && event.keyword ? String(event.keyword) : '';
    const command = keyword.replace(/[，。！？\s]/g, '');

    if (
      command.indexOf('开始同传') >= 0 ||
      command.indexOf('继续同传') >= 0 ||
      command.indexOf('恢复同传') >= 0 ||
      command.indexOf('开始翻译') >= 0
    ) {
      this.startListening();
      return;
    }

    if (
      command.indexOf('暂停同传') >= 0 ||
      command.indexOf('停止同传') >= 0 ||
      command.indexOf('停止翻译') >= 0
    ) {
      this.stopListening();
      return;
    }

    this.fallbackConversationActive = false;
    if (this.recognitionRestartTimer) {
      clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }
    this.autoRealtimeSuspended = true;
    this.closeRealtimeTranslation();
    this.setData({
      assistantState: '请说中文场景或指令',
      footerHint: '自动同传已临时暂停 · 请说场景或指令'
    });

    if (
      this.recognition &&
      this.data.recognitionState === 'listening'
    ) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.log('Conversation recognition abort skipped:', error);
      }
      if (typeof setTimeout === 'function') {
        setTimeout(() => this.beginRecognition('scene'), 120);
        return;
      }
    }
    this.beginRecognition('scene');
  }
};
</script>

<page>
  <view class="app-shell">
    <view class="topbar">
      <view class="brand">
        <text class="brand-name">COMM CO-PILOT</text>
        <text class="brand-subtitle">跨语言沟通助手</text>
      </view>
      <view class="runtime">
        <text class="runtime-mode">{{ runtimeMode }}</text>
        <text class="language">AUTO COACH</text>
      </view>
    </view>

    <view class="scene-bar">
      <view class="scene-copy">
        <text class="scene-label">SCENE · 中文描述意图</text>
        <text class="scene-title">{{ sceneTitle }} · {{ sceneDetail }}</text>
      </view>
      <view class="voice-guide">
        <text class="voice-guide-key">WAKE</text>
        <text class="voice-guide-copy">改场景</text>
      </view>
    </view>

    <view class="workspace">
      <view class="suggestion-panel">
        <view class="panel-heading">
          <text class="panel-kicker">AI SUGGESTS</text>
          <text class="panel-title">下一句回答</text>
        </view>
        <view class="suggestion-card">
          <text class="suggestion-text">{{ suggestion }}</text>
          <view class="divider"></view>
          <text class="intent-label">表达目的</text>
          <text class="intent-text">{{ intent }}</text>
        </view>
      </view>

      <view class="transcript-panel">
        <view class="panel-heading transcript-heading">
          <view>
            <text class="panel-kicker">LIVE DIALOGUE</text>
            <text class="panel-title">双方对话</text>
          </view>
          <view class="listening-status {{ listeningClass }}">
            <text>{{ listeningLabel }}</text>
          </view>
        </view>
        <scroll-view
          class="transcript-list"
          scroll-y="true"
          scroll-into-view="{{ activeTranscriptId }}"
        >
          <view
            id="{{ item.id }}"
            class="message {{ item.sideClass }}"
            ink:for="{{ transcript }}"
            ink:key="id"
          >
            <text class="speaker">{{ item.speakerLabel }}</text>
            <text class="original">{{ item.original }}</text>
            <text class="translation">{{ item.translation }}</text>
          </view>
          <view class="empty-transcript" ink:if="{{ transcript.length === 0 }}">
            <text class="empty-title">等待对话</text>
            <text class="empty-copy">你和对方说英文后，原文与中文会自动显示。</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="footer">
      <text class="assistant-state">{{ assistantState }}</text>
      <text class="footer-hint">{{ footerHint }}</text>
      <text class="diagnostic-line" ink:if="{{ diagnosticVisible }}">{{ diagnosticText }}</text>
    </view>
  </view>
</page>

<style>
.app-shell {
  --spacing-compact: 4px;
  width: var(--app-width);
  height: var(--app-height-max);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-compact);
  color: var(--color-text-primary);
  background-color: var(--color-background);
  font-family: sans-serif;
}

.topbar {
  height: 28px;
  margin: var(--spacing-sm) var(--spacing-sm) 0 var(--spacing-sm);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.brand {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
}

.brand-name {
  font-family: monospace;
  font-size: 17px;
  line-height: 1.3;
  font-weight: 700;
}

.brand-subtitle {
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.runtime {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.runtime-mode,
.language {
  font-family: monospace;
  font-size: 11px;
  line-height: 1.4;
}

.runtime-mode {
  color: var(--color-text-secondary);
}

.scene-bar {
  height: 28px;
  margin: 0 var(--spacing-sm);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-width: var(--border-width-thin);
  border-style: solid;
  border-color: var(--border-color-muted);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  flex-shrink: 0;
}

.scene-copy {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
  flex-grow: 1;
  flex-shrink: 1;
}

.scene-label {
  font-size: 10px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.scene-title {
  font-size: 12px;
  line-height: 1.3;
  font-weight: 600;
  flex-shrink: 1;
}

.voice-guide,
.listening-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-compact);
  padding: var(--spacing-compact) var(--spacing-sm);
  border-width: 0;
  border-style: solid;
  border-color: transparent;
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-text-primary);
  font-size: 11px;
  line-height: 1.3;
  flex-shrink: 0;
}

.voice-guide-key {
  font-weight: 700;
}

.voice-guide-copy {
  color: var(--color-text-secondary);
}

.workspace {
  height: 232px;
  margin: 0 var(--spacing-sm);
  display: flex;
  flex-direction: row;
  gap: var(--spacing-sm);
  flex-grow: 1;
  flex-shrink: 1;
}

.suggestion-panel,
.transcript-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-width: var(--border-width-thin);
  border-style: solid;
  border-color: var(--border-color-muted);
  border-radius: var(--radius-md);
  background-color: transparent;
}

.suggestion-panel {
  width: 170px;
  flex-shrink: 0;
}

.transcript-panel {
  flex-grow: 1;
  flex-shrink: 1;
}

.panel-heading {
  height: 30px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.transcript-heading {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.panel-kicker {
  font-family: monospace;
  font-size: 11px;
  line-height: 1.2;
  color: var(--color-text-secondary);
}

.panel-title {
  font-family: monospace;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 700;
}

.suggestion-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-compact);
  padding: var(--spacing-md);
  border-width: var(--border-width-default);
  border-style: solid;
  border-color: var(--border-color-accent);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-highlight);
}

.suggestion-text {
  font-family: monospace;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
}

.divider {
  height: var(--border-width-thin);
  background-color: var(--border-color-muted);
}

.intent-label,
.speaker {
  font-size: 11px;
  line-height: 1.3;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.intent-text {
  font-size: 11px;
  line-height: 1.35;
}

.status-live {
  color: var(--color-text-primary);
  background-color: transparent;
}

.status-idle {
  color: var(--color-text-secondary);
}

.transcript-list {
  height: 174px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-compact) 0 var(--spacing-sm) 0;
  border-width: 0;
  border-style: solid;
  border-color: transparent;
  border-radius: 0;
  background-color: transparent;
  margin: 0 0 var(--spacing-compact) 0;
}

.message-mine {
  background-color: transparent;
}

.message-partner {
  background-color: transparent;
}

.message-live {
  background-color: transparent;
}

.original {
  font-size: 12px;
  line-height: 1.35;
  font-weight: 600;
}

.translation {
  font-size: 10px;
  line-height: 1.35;
  color: var(--color-text-secondary);
}

.empty-transcript {
  height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  text-align: center;
}

.empty-title {
  font-family: monospace;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 700;
}

.empty-copy {
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.footer {
  height: 22px;
  margin: 0 var(--spacing-sm) var(--spacing-sm) var(--spacing-sm);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.assistant-state {
  font-size: 11px;
  line-height: 1.4;
  font-weight: 600;
}

.footer-hint {
  flex-grow: 1;
  flex-shrink: 1;
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.diagnostic-line {
  flex-shrink: 0;
  font-family: monospace;
  font-size: 9px;
  line-height: 1.3;
  color: var(--color-text-secondary);
}

</style>
