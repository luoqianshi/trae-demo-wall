import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FolderOpen,
  Monitor,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useConsoleStore } from '@/stores/consoleStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LeftPanelProps {
  onCreateTerminal: (cwd?: string) => void;
}

export function LeftPanel({ onCreateTerminal }: LeftPanelProps) {
  const { agents, currentAgent, setCurrentAgent } = useAgentStore();
  const { workspaces } = useConsoleStore();
  const { currentPath, agentSessions, setCurrentPath, fetchAgentSessions } = useWorkspaceStore();
  const [showCwdPicker, setShowCwdPicker] = useState(false);
  const [customCwd, setCustomCwd] = useState('');

  // Set initial workspace
  useEffect(() => {
    if (!currentPath && workspaces.length > 0) {
      setCurrentPath(workspaces[0].path);
    }
  }, [currentPath, workspaces, setCurrentPath]);

  // Fetch agent sessions when agent changes
  useEffect(() => {
    if (currentAgent) {
      fetchAgentSessions(currentAgent);
    }
  }, [currentAgent]);

  const filteredSessions = agentSessions.filter((s) => s.agent === currentAgent);

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col bg-[#13131f]/80">
      {/* Agent selector */}
      <div className="border-b border-white/5 p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#6c7086]">Agent</div>
        <div className="space-y-1">
          {agents.map((agent) => (
            <button
              key={agent.name}
              onClick={() => agent.available && setCurrentAgent(agent.name)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                currentAgent === agent.name
                  ? 'bg-[#313244] text-[#cdd6f4] shadow-sm'
                  : agent.available
                    ? 'hover:bg-[#1e1e2e] text-[#a6adc8]'
                    : 'cursor-not-allowed opacity-40'
              }`}
            >
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{agent.displayName}</div>
                {agent.version && (
                  <div className={`text-[10px] ${currentAgent === agent.name ? 'text-[#a6adc8]' : 'text-[#6c7086]'}`}>
                    v{agent.version}
                  </div>
                )}
              </div>
              {!agent.available && <Badge variant="secondary" className="text-[9px] bg-[#313244]">N/A</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* New terminal with cwd picker */}
      <div className="border-b border-white/5 p-3">
        <Button
          className="w-full justify-center gap-1.5 bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#74c7ec]"
          size="sm"
          onClick={() => onCreateTerminal(currentPath || undefined)}
        >
          <Plus className="h-3.5 w-3.5" />
          新终端
        </Button>

        {/* CWD picker toggle */}
        <button
          onClick={() => setShowCwdPicker(!showCwdPicker)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-[#6c7086] hover:bg-[#1e1e2e]/60"
        >
          <FolderOpen className="h-3 w-3" />
          <span className="min-w-0 flex-1 truncate">{currentPath || '选择工作目录'}</span>
          {showCwdPicker ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {showCwdPicker && (
          <div className="mt-1 space-y-1">
            {/* Workspace presets */}
            {workspaces.map((ws) => (
              <button
                key={ws.path}
                onClick={() => {
                  setCurrentPath(ws.path);
                  setShowCwdPicker(false);
                }}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] transition ${
                  currentPath === ws.path
                    ? 'bg-[#313244] text-[#cdd6f4]'
                    : 'text-[#a6adc8] hover:bg-[#1e1e2e]/60'
                }`}
              >
                <FolderOpen className="h-3 w-3 shrink-0 text-[#89b4fa]" />
                <span className="min-w-0 flex-1 truncate">{ws.name}</span>
              </button>
            ))}
            {/* Custom path input */}
            <div className="flex gap-1 pt-1">
              <input
                value={customCwd}
                onChange={(e) => setCustomCwd(e.target.value)}
                placeholder="自定义路径..."
                className="h-7 min-w-0 flex-1 rounded border border-[#313244] bg-[#1e1e2e] px-2 text-[11px] text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCwd.trim()) {
                    setCurrentPath(customCwd.trim());
                    setCustomCwd('');
                    setShowCwdPicker(false);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 shrink-0 text-[#6c7086] hover:text-[#cdd6f4]"
                onClick={() => {
                  if (customCwd.trim()) {
                    setCurrentPath(customCwd.trim());
                    setCustomCwd('');
                    setShowCwdPicker(false);
                  }
                }}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#6c7086]">
          <Clock className="h-3 w-3" />
          历史会话
          <button
            onClick={() => currentAgent && fetchAgentSessions(currentAgent)}
            className="ml-auto text-[#6c7086] hover:text-[#cdd6f4]"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-1">
          {filteredSessions.length === 0 && (
            <p className="py-4 text-center text-[11px] text-[#6c7086]">暂无会话记录</p>
          )}
          {filteredSessions.map((session) => (
            <div key={session.id} className="rounded-lg bg-[#1e1e2e]/60 px-2.5 py-2 text-xs text-[#a6adc8] hover:bg-[#1e1e2e]">
              <div className="truncate font-medium">{session.title}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#6c7086]">
                <span className="truncate">{session.project.split(/[\\/]/).pop()}</span>
                <span className="shrink-0">{formatTime(session.lastActive)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
