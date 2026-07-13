import { useState, useEffect, useCallback, useRef } from 'react';
import type { Goal, Submission } from './types';
import { initDB, getGoals, getSubmissionsByGoal, addSubmission, updateGoal } from './lib/db';
import { generateResponse, setAIProvider, type AIMessage, type AIResponse } from './lib/ai';
import { createSiliconFlowProvider, recognizeImage } from './lib/siliconflow';
import { useSpeechRecognition, useSpeechSynthesis } from './lib/speech';
import ChatPanel, { type Message } from './components/ChatPanel';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import GoalDetailPage from './components/GoalDetailPage';

/** 应用视图状态 */
type AppView = 'home' | 'chat' | 'profile' | 'goalDetail';

/** 生成唯一 ID */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function App(): React.ReactElement {
  // ---- 视图状态 ----
  const [view, setView] = useState<AppView>('home');

  // ---- 数据状态 ----
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // ---- 语音状态 ----
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: recognitionError,
  } = useSpeechRecognition();

  const { speak, isSpeaking } = useSpeechSynthesis();

  // ---- 初始化标记 ----
  const initializedRef = useRef(false);
  const isProcessingRef = useRef(false);

  // ---- 初始化：加载数据 ----
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async (): Promise<void> => {
      try {
        // 接入硅基流动大模型
        setAIProvider(createSiliconFlowProvider());

        await initDB();
        const allGoals = await getGoals();
        setGoals(allGoals);
      } catch (err) {
        console.error('初始化失败:', err);
      }
    };

    init();
  }, []);

  // ---- 从首页或个人中心进入对话 ----
  const handleStartChat = useCallback(async (goal?: Goal): Promise<void> => {
    if (goal) {
      setCurrentGoal(goal);
      if (goal.id) {
        const subs = await getSubmissionsByGoal(goal.id);
        setSubmissions(subs);
      }
    }

    setView('chat');

    // 如果没有已有消息，触发问候
    if (messages.length === 0) {
      try {
        const activeGoal = goal ?? goals.find((g) => g.status === 'active');
        const subs = activeGoal?.id ? await getSubmissionsByGoal(activeGoal.id) : [];

        if (activeGoal) {
          setCurrentGoal(activeGoal);
          setSubmissions(subs);

          const aiResponse: AIResponse = await generateResponse([], {
            currentGoal: activeGoal,
            isNewSession: true,
            previousSubmissions: subs.length > 0 ? subs : undefined,
          });

          const msg: Message = {
            id: generateId(),
            role: 'ai',
            content: aiResponse.text,
            type: 'system',
            timestamp: Date.now(),
          };
          setMessages([msg]);
          speak(aiResponse.text);
        } else {
          const aiResponse: AIResponse = await generateResponse([], {
            isNewSession: true,
          });

          const msg: Message = {
            id: generateId(),
            role: 'ai',
            content: aiResponse.text,
            type: 'system',
            timestamp: Date.now(),
          };
          setMessages([msg]);
          speak(aiResponse.text);
        }
      } catch (err) {
        console.error('问候失败:', err);
      }
    }
  }, [messages.length, goals, speak]);

  // ---- 监听语音识别结果 ----
  useEffect(() => {
    if (!isListening && transcript && !isProcessingRef.current && view === 'chat') {
      handleUserMessage(transcript, 'voice');
    }
  }, [isListening]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- 处理用户消息 ----
  const handleUserMessage = useCallback(async (text: string, type: 'voice' | 'text'): Promise<void> => {
    if (isProcessingRef.current || !text.trim()) return;
    isProcessingRef.current = true;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      type,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const aiMessages: AIMessage[] = messages
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
      aiMessages.push({ role: 'user', content: text.trim() });

      const response: AIResponse = await generateResponse(aiMessages, {
        currentGoal: currentGoal ?? undefined,
        isNewSession: false,
      });

      const aiMsg: Message = {
        id: generateId(),
        role: 'ai',
        content: response.text,
        type: 'system',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speak(response.text);
    } catch (err) {
      console.error('AI 回复失败:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [messages, currentGoal, speak]);

  // ---- 处理图片上传 ----
  const handleUploadImage = useCallback(async (file: File): Promise<void> => {
    if (!currentGoal?.id) return;

    try {
      const reader = new FileReader();
      reader.onload = async (): Promise<void> => {
        const base64Full = reader.result as string;
        const base64Data = base64Full.replace(/^data:[^;]+;base64,/, '');
        const mimeType = file.type || 'image/jpeg';

        const imgMsg: Message = {
          id: generateId(),
          role: 'user',
          content: '提交了我的练习成果',
          type: 'image',
          imageUrl: base64Full,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, imgMsg]);

        let ocrResult = '';
        try {
          ocrResult = await recognizeImage(base64Data, mimeType);
        } catch {
          // OCR 失败不影响主流程
        }

        const userContent = ocrResult
          ? `我提交了一张练习成果图片。图片内容识别如下：${ocrResult}`
          : '我提交了一张练习成果图片';

        const submission = await addSubmission({
          goalId: currentGoal.id!,
          type: 'image',
          content: base64Full,
          aiFeedback: '',
          createdAt: Date.now(),
        });

        const response: AIResponse = await generateResponse(
          [{ role: 'user', content: userContent }],
          {
            currentGoal,
            latestSubmission: submission,
            isNewSession: false,
          }
        );

        submission.aiFeedback = response.text;
        if (response.hint) {
          submission.improvementHint = response.hint;
        }

        const aiMsg: Message = {
          id: generateId(),
          role: 'ai',
          content: response.text,
          type: 'system',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setSubmissions((prev) => [...prev, submission]);
        speak(response.text);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('上传失败:', err);
    }
  }, [currentGoal, speak]);

  // ---- 处理目标选择（从个人中心进入） ----
  const handleSelectGoal = useCallback(async (goal: Goal): Promise<void> => {
    setCurrentGoal(goal);
    if (goal.id) {
      const subs = await getSubmissionsByGoal(goal.id);
      setSubmissions(subs);
    }
    setView('goalDetail');
  }, []);

  // ---- 创建新目标 ----
  const handleCreateGoal = useCallback((): void => {
    setMessages([]);
    setView('chat');
    const promptMsg: Message = {
      id: generateId(),
      role: 'ai',
      content: '好的！告诉我你想开始做什么？比如"我想练字"、"我要学画画"之类的，我来帮你记录下来～',
      type: 'system',
      timestamp: Date.now(),
    };
    setMessages([promptMsg]);
    speak(promptMsg.content);
  }, [speak]);

  // ---- 暂停/恢复目标 ----
  const handlePauseGoal = useCallback(async (): Promise<void> => {
    if (!currentGoal) return;

    const newStatus = currentGoal.status === 'active' ? 'paused' : 'active';
    const updatedGoal: Goal = {
      ...currentGoal,
      status: newStatus,
      updatedAt: Date.now(),
    };

    await updateGoal(updatedGoal);
    setCurrentGoal(updatedGoal);
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  }, [currentGoal]);

  // ---- 从目标详情继续练习 ----
  const handleResumePractice = useCallback((): void => {
    setView('chat');
  }, []);

  // ---- 返回首页 ----
  const handleBackToHome = useCallback((): void => {
    setView('home');
  }, []);

  // ---- 语音识别错误提示 ----
  useEffect(() => {
    if (recognitionError && view === 'chat') {
      const errorMsg: Message = {
        id: generateId(),
        role: 'system',
        content: recognitionError,
        type: 'system',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  }, [recognitionError, view]);

  // ---- 渲染 ----
  return (
    <div className="h-screen flex flex-col bg-[#faf8f5]">
      {view === 'home' && (
        <HomePage
          onStartChat={() => handleStartChat()}
          onOpenProfile={() => setView('profile')}
        />
      )}

      {view === 'chat' && (
        <>
          {/* 简化的顶部栏 */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-[#ddd5c8] bg-white/80 backdrop-blur-sm flex-shrink-0">
            <button
              onClick={handleBackToHome}
              className="text-[#8a7e6e] hover:text-[#e07a3a] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-[#2c2418]">{currentGoal?.title ?? '溯光'}</span>
            <button
              onClick={() => setView('profile')}
              className="text-[#8a7e6e] hover:text-[#e07a3a] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              onSendMessage={handleUserMessage}
              onUploadImage={handleUploadImage}
              isListening={isListening}
              isSpeaking={isSpeaking}
              interimText={isListening ? transcript : undefined}
              onStartListening={startListening}
              onStopListening={stopListening}
              onSpeak={speak}
              currentGoal={currentGoal}
            />
          </div>
        </>
      )}

      {view === 'profile' && (
        <ProfilePage
          goals={goals}
          onSelectGoal={handleSelectGoal}
          onCreateGoal={handleCreateGoal}
          onBack={handleBackToHome}
        />
      )}

      {view === 'goalDetail' && currentGoal && (
        <GoalDetailPage
          goal={currentGoal}
          submissions={submissions}
          onStartPractice={handleResumePractice}
          onPause={handlePauseGoal}
          onBack={() => setView('profile')}
        />
      )}
    </div>
  );
}

export default App;
