import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Bot, PanelRight, Send, Sparkles, User, Wifi, WifiOff } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { fetchSessionMessages, useConsoleStore } from '@/stores/consoleStore';
import { useChatStore } from '@/stores/chatStore';
import { ArtifactPanel } from '@/components/ArtifactPanel/ArtifactPanel';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { MessageActions } from '@/components/MessageActions/MessageActions';
import { VoiceInput } from '@/components/VoiceInput/VoiceInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@/types';

export function Chat() {
  const { agents, currentAgent, setCurrentAgent } = useAgentStore();
  const {
    currentSessionId,
    sessions,
    workspaces,
    token,
    connectionStatus,
    setConnectionStatus,
    upsertSession,
    upsertTask,
  } = useConsoleStore();
  const {
    messages,
    isStreaming,
    artifacts,
    addMessage,
    setMessages,
    setStreaming,
    updateLastMessage,
  } = useChatStore();
  const [input, setInput] = useState('');
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const currentSession = sessions.find((session) => session.id === currentSessionId) ?? null;
  const currentWorkspace = workspaces.find((workspace) => workspace.path === currentSession?.cwd);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    fetchSessionMessages(currentSessionId, token)
      .then(setMessages)
      .catch(() => {
        addMessage({
          id: crypto.randomUUID(),
          role: 'system',
          content: '无法加载会话历史',
          timestamp: Date.now(),
        });
      });
  }, [addMessage, currentSessionId, setMessages, token]);

  useEffect(() => {
    if (!currentSessionId) return;

    let closedByEffect = false;
    const connect = () => {
      setConnectionStatus(connectionStatus === 'offline' ? 'connecting' : 'reconnecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const query = token ? `?token=${encodeURIComponent(token)}` : '';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/${currentSessionId}${query}`);
      wsRef.current = ws;

      ws.onopen = () => setConnectionStatus('online');
      ws.onmessage = (event) => handleWSMessage(JSON.parse(event.data));
      ws.onclose = () => {
        if (closedByEffect) return;
        setConnectionStatus('reconnecting');
        reconnectTimer.current = window.setTimeout(connect, 1500);
      };
      ws.onerror = () => setConnectionStatus('offline');
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [currentSessionId, token]);

  const handleWSMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        if (data.session) upsertSession(data.session);
        if (data.messages) setMessages(data.messages);
        setCurrentAgent(data.agent);
        break;
      case 'start':
        setStreaming(true);
        if (data.task) upsertTask(data.task);
        addMessage({
          id: crypto.randomUUID(),
          role: 'user',
          content: data.prompt,
          timestamp: Date.now(),
        });
        addMessage({
          id: crypto.randomUUID(),
          role: 'agent',
          content: '',
          timestamp: Date.now(),
        });
        break;
      case 'output':
        updateLastMessage(data.content);
        break;
      case 'done':
        setStreaming(false);
        if (data.task) upsertTask(data.task);
        break;
      case 'error':
        setStreaming(false);
        if (data.task) upsertTask(data.task);
        addMessage({
          id: crypto.randomUUID(),
          role: 'system',
          content: `错误: ${data.message}`,
          timestamp: Date.now(),
        });
        break;
      case 'stopped':
        setStreaming(false);
        break;
    }
  };

  const handleSend = () => {
    if (!input.trim() || !currentAgent || !currentSession || !wsRef.current) return;
    const content = attachedFile
      ? `${input}\n\n---\n附件 ${attachedFile.name}:\n${attachedFile.content}`
      : input;
    wsRef.current.send(JSON.stringify({
      type: 'execute',
      prompt: content,
      agent: currentAgent,
      cwd: currentSession.cwd,
    }));
    setInput('');
    setAttachedFile(null);
  };

  const handleStop = () => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const handleFileUpload = useCallback((content: string, filename: string) => {
    setAttachedFile({ name: filename, content });
    setInput((prev) => (prev ? `${prev}\n\n[文件: ${filename}]\n` : `[文件: ${filename}]\n`));
  }, []);

  const handleRegenerate = useCallback(() => {
    if (!wsRef.current || !currentSession) return;
    const lastUserMsg = [...messages].reverse().find((message) => message.role === 'user');
    if (lastUserMsg) {
      wsRef.current.send(JSON.stringify({
        type: 'execute',
        prompt: lastUserMsg.content,
        agent: currentAgent,
        cwd: currentSession.cwd,
      }));
    }
  }, [currentAgent, currentSession, messages]);

  return (
    <div className="flex h-full min-w-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 md:px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 shrink-0" />
            <span className="truncate font-semibold">{currentSession?.title ?? 'Agent Console'}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {currentWorkspace?.name ?? currentSession?.cwd ?? '选择工作目录'} · {connectionLabel(connectionStatus)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {connectionStatus === 'online' ? (
            <Wifi className="h-4 w-4 text-emerald-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          {artifacts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowArtifacts(true)}>
              <PanelRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">产物</span>
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-5 md:px-4">
        {messages.length === 0 && (
          <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 text-center text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">从任意设备遥控你的 Agent</p>
              <p className="mt-1 text-xs">选择 Agent 和工作目录，发送任务后可断线重连继续看结果。</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRegenerate={handleRegenerate}
              isStreaming={isStreaming && message === messages[messages.length - 1]}
            />
          ))}
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Agent 正在远端执行
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="safe-bottom shrink-0 border-t bg-background px-3 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {agents.map((agent) => (
              <Badge
                key={agent.name}
                variant={currentAgent === agent.name ? 'default' : 'secondary'}
                className={`cursor-pointer whitespace-nowrap ${!agent.available ? 'opacity-50' : ''}`}
                onClick={() => agent.available && setCurrentAgent(agent.name)}
              >
                {agent.displayName}
              </Badge>
            ))}
          </div>

          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
              <span className="min-w-0 flex-1 truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
                移除
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-lg bg-muted px-2 py-2">
            <div className="flex items-center gap-0.5 pb-0.5">
              <FileUpload onFile={handleFileUpload} disabled={!currentAgent || isStreaming} />
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={!currentAgent || isStreaming} />
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentSession ? '给 Agent 发任务...' : '先新建或选择会话'}
              disabled={!currentSession || !currentAgent || isStreaming}
              className="max-h-40 min-h-6 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              rows={1}
            />
            {isStreaming ? (
              <Button onClick={handleStop} size="icon" variant="ghost" className="h-8 w-8">
                <AlertCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim() || !currentAgent || !currentSession}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ArtifactPanel open={showArtifacts} onOpenChange={setShowArtifacts} artifacts={artifacts} />
    </div>
  );
}

function MessageBubble({
  message,
  onRegenerate,
  isStreaming,
}: {
  message: Message;
  onRegenerate: () => void;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="group max-w-[86%] min-w-0">
        <div className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <pre className="m-0 whitespace-pre-wrap bg-transparent p-0 font-sans">{message.content || '\u00A0'}</pre>
        </div>
        {!isUser && message.content && !isStreaming && (
          <div className="mt-1 opacity-0 transition-opacity group-hover:opacity-100">
            <MessageActions content={message.content} onRegenerate={onRegenerate} />
          </div>
        )}
      </div>
    </div>
  );
}

function connectionLabel(status: 'offline' | 'connecting' | 'online' | 'reconnecting') {
  if (status === 'online') return '已连接';
  if (status === 'connecting') return '连接中';
  if (status === 'reconnecting') return '重连中';
  return '离线';
}
