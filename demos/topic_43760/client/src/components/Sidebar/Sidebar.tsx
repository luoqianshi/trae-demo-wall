import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  File,
  Folder,
  FolderOpen,
  GitBranch,
  Monitor,
  Plus,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useConsoleStore } from '@/stores/consoleStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { SidebarPanel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activePanel: SidebarPanel;
  onPanelChange: (panel: SidebarPanel) => void;
  onCreateTerminal: () => void;
  onOpenSettings: () => void;
  onOpenDiff: (file?: string) => void;
  onClose?: () => void;
}

export function Sidebar({
  activePanel,
  onPanelChange,
  onCreateTerminal,
  onOpenSettings,
  onOpenDiff,
  onClose,
}: SidebarProps) {
  const { agents, currentAgent, setCurrentAgent } = useAgentStore();
  const { workspaces } = useConsoleStore();
  const {
    currentPath,
    files,
    gitStatus,
    gitCommits,
    agentSessions,
    setCurrentPath,
    fetchFiles,
    fetchGitStatus,
    fetchGitLog,
    fetchAgentSessions,
  } = useWorkspaceStore();

  // Set initial workspace
  useEffect(() => {
    if (!currentPath && workspaces.length > 0) {
      setCurrentPath(workspaces[0].path);
    }
  }, [currentPath, workspaces, setCurrentPath]);

  // Fetch data when path changes
  useEffect(() => {
    if (currentPath) {
      fetchFiles(currentPath);
      fetchGitStatus();
      fetchGitLog();
    }
  }, [currentPath]);

  // Fetch agent sessions when agent changes
  useEffect(() => {
    if (currentAgent) {
      fetchAgentSessions(currentAgent);
    }
  }, [currentAgent]);

  const handleFolderClick = useCallback(
    (path: string) => {
      setCurrentPath(path);
      fetchFiles(path);
    },
    [setCurrentPath, fetchFiles],
  );

  const refreshAll = useCallback(() => {
    fetchFiles(currentPath);
    fetchGitStatus();
    fetchGitLog();
    if (currentAgent) fetchAgentSessions(currentAgent);
  }, [currentPath, currentAgent]);

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4" />
          Agent Everywhere
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={refreshAll}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onOpenSettings}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Panel tabs */}
      <div className="flex shrink-0 border-b">
        {([
          ['agents', Bot, 'Agents'],
          ['files', Folder, 'Files'],
          ['git', GitBranch, 'Git'],
        ] as const).map(([panel, Icon, label]) => (
          <button
            key={panel}
            onClick={() => onPanelChange(panel)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition ${
              activePanel === panel
                ? 'border-b-2 border-foreground text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activePanel === 'agents' && (
          <AgentsPanel
            agents={agents}
            currentAgent={currentAgent}
            sessions={agentSessions}
            onSelectAgent={setCurrentAgent}
            onCreateTerminal={onCreateTerminal}
            formatTime={formatTime}
          />
        )}
        {activePanel === 'files' && (
          <FilesPanel
            files={files}
            currentPath={currentPath}
            workspaces={workspaces}
            onFolderClick={handleFolderClick}
            onOpenDiff={onOpenDiff}
          />
        )}
        {activePanel === 'git' && (
          <GitPanel
            gitStatus={gitStatus}
            gitCommits={gitCommits}
            onOpenDiff={onOpenDiff}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agents Panel
// ---------------------------------------------------------------------------
function AgentsPanel({
  agents,
  currentAgent,
  sessions,
  onSelectAgent,
  onCreateTerminal,
  formatTime,
}: {
  agents: { name: string; displayName: string; available: boolean; version?: string }[];
  currentAgent: string | null;
  sessions: { id: string; agent: string; project: string; title: string; lastActive: number }[];
  onSelectAgent: (name: string) => void;
  onCreateTerminal: () => void;
  formatTime: (ts: number) => string;
}) {
  const filteredSessions = sessions.filter((s) => s.agent === currentAgent);

  return (
    <div className="flex flex-col">
      {/* Agent selector */}
      <div className="border-b p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Agent</div>
        <div className="space-y-1">
          {agents.map((agent) => (
            <button
              key={agent.name}
              onClick={() => agent.available && onSelectAgent(agent.name)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                currentAgent === agent.name
                  ? 'bg-foreground text-background'
                  : agent.available
                    ? 'bg-background hover:bg-muted'
                    : 'cursor-not-allowed opacity-40'
              }`}
            >
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{agent.displayName}</div>
                {agent.version && (
                  <div className={`text-[10px] ${currentAgent === agent.name ? 'text-background/70' : 'text-muted-foreground'}`}>
                    v{agent.version}
                  </div>
                )}
              </div>
              {!agent.available && <Badge variant="secondary" className="text-[9px]">N/A</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* New terminal button */}
      <div className="border-b p-3">
        <Button className="w-full justify-center" size="sm" onClick={onCreateTerminal}>
          <Plus className="h-3.5 w-3.5" />
          新终端
        </Button>
      </div>

      {/* Native sessions */}
      <div className="p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3 w-3" />
          历史会话
        </div>
        <div className="space-y-1">
          {filteredSessions.length === 0 && (
            <p className="py-4 text-center text-[11px] text-muted-foreground">暂无会话记录</p>
          )}
          {filteredSessions.map((session) => (
            <div key={session.id} className="rounded-lg bg-background px-2.5 py-2 text-xs">
              <div className="truncate font-medium">{session.title}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
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

// ---------------------------------------------------------------------------
// Files Panel
// ---------------------------------------------------------------------------
function FilesPanel({
  files,
  currentPath,
  workspaces,
  onFolderClick,
  onOpenDiff,
}: {
  files: { name: string; path: string; type: string; size?: number }[];
  currentPath: string;
  workspaces: { name: string; path: string }[];
  onFolderClick: (path: string) => void;
  onOpenDiff: (file?: string) => void;
}) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  };

  return (
    <div className="flex flex-col">
      {/* Workspace selector */}
      <div className="border-b p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</div>
        <div className="space-y-1">
          {workspaces.map((ws) => (
            <button
              key={ws.path}
              onClick={() => onFolderClick(ws.path)}
              className={`w-full truncate rounded-lg px-2.5 py-1.5 text-left text-xs ${
                currentPath === ws.path ? 'bg-foreground text-background' : 'bg-background hover:bg-muted'
              }`}
            >
              {ws.name}
            </button>
          ))}
        </div>
      </div>

      {/* File tree */}
      <div className="p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {currentPath.split(/[\\/]/).pop() || 'Files'}
        </div>
        <div className="space-y-0.5">
          {/* Parent dir */}
          {currentPath && (
            <button
              onClick={() => {
                const parent = currentPath.replace(/[\\/][^\\/]+$/, '');
                if (parent) onFolderClick(parent);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-background"
            >
              <Folder className="h-3.5 w-3.5" />
              ..
            </button>
          )}
          {files.map((file) => (
            <div key={file.path}>
              {file.type === 'directory' ? (
                <button
                  onClick={() => {
                    toggleDir(file.path);
                    onFolderClick(file.path);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-background"
                >
                  {expandedDirs.has(file.path) ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="truncate">{file.name}</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenDiff(file.path)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-background"
                >
                  <span className="w-3" />
                  <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  {file.size != null && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
                  )}
                </button>
              )}
            </div>
          ))}
          {files.length === 0 && (
            <p className="py-4 text-center text-[11px] text-muted-foreground">空目录</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Git Panel
// ---------------------------------------------------------------------------
function GitPanel({
  gitStatus,
  gitCommits,
  onOpenDiff,
}: {
  gitStatus: { branch: string | null; files: { path: string; status: string; staged: boolean }[]; isRepo: boolean } | null;
  gitCommits: { hash: string; shortHash: string; message: string; author: string; date: string }[];
  onOpenDiff: (file?: string) => void;
}) {
  const { gitAdd, gitReset, gitCommit } = useWorkspaceStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [showCommitInput, setShowCommitInput] = useState(false);

  if (!gitStatus || !gitStatus.isRepo) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <GitBranch className="mb-2 h-8 w-8" />
        <p className="text-xs">不是 Git 仓库</p>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    modified: 'bg-yellow-500',
    untracked: 'bg-emerald-500',
    added: 'bg-green-500',
    deleted: 'bg-red-500',
    renamed: 'bg-blue-500',
  };

  const hasStaged = gitStatus.files.some((f) => f.staged);
  const hasUnstaged = gitStatus.files.some((f) => !f.staged);

  return (
    <div className="flex flex-col">
      {/* Branch */}
      <div className="border-b p-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{gitStatus.branch || 'HEAD'}</span>
          <Badge variant="secondary" className="ml-auto text-[9px]">
            {gitStatus.files.length} changes
          </Badge>
        </div>
      </div>

      {/* Git actions */}
      <div className="flex gap-1 border-b p-2">
        <Button
          variant="secondary"
          size="icon-sm"
          className="h-7 w-7"
          disabled={!hasUnstaged}
          onClick={() => {
            gitStatus.files.filter((f) => !f.staged).forEach((f) => gitAdd(f.path));
          }}
          title="Stage all"
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="icon-sm"
          className="h-7 w-7"
          disabled={!hasStaged}
          onClick={() => {
            gitStatus.files.filter((f) => f.staged).forEach((f) => gitReset(f.path));
          }}
          title="Unstage all"
        >
          <X className="h-3 w-3" />
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-7 flex-1 text-[10px]"
          disabled={!hasStaged}
          onClick={() => setShowCommitInput(!showCommitInput)}
        >
          Commit
        </Button>
      </div>

      {/* Commit input */}
      {showCommitInput && (
        <div className="border-b p-2">
          <input
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Commit message..."
            className="h-7 w-full rounded border bg-background px-2 text-[11px] outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commitMsg.trim()) {
                gitCommit(commitMsg.trim());
                setCommitMsg('');
                setShowCommitInput(false);
              }
            }}
          />
        </div>
      )}

      {/* Changed files */}
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Changes</span>
          <button
            onClick={() => onOpenDiff()}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            View Diff
          </button>
        </div>
        <div className="space-y-0.5">
          {gitStatus.files.length === 0 && (
            <p className="py-2 text-center text-[11px] text-muted-foreground">工作区干净</p>
          )}
          {gitStatus.files.map((file) => (
            <div
              key={file.path}
              className="group flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-background"
            >
              <button
                onClick={() => onOpenDiff(file.path)}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor[file.status] || 'bg-gray-400'}`} />
                <span className="truncate">{file.path}</span>
                {file.staged && <Badge variant="secondary" className="text-[9px]">S</Badge>}
              </button>
              <button
                onClick={() => (file.staged ? gitReset(file.path) : gitAdd(file.path))}
                className="shrink-0 rounded p-0.5 opacity-0 transition hover:bg-muted group-hover:opacity-100"
                title={file.staged ? 'Unstage' : 'Stage'}
              >
                {file.staged ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent commits */}
      <div className="p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Commits</div>
        <div className="space-y-1.5">
          {gitCommits.slice(0, 15).map((commit) => (
            <div key={commit.hash} className="rounded-lg bg-background px-2.5 py-2 text-xs">
              <div className="flex items-center gap-2">
                <code className="shrink-0 text-[10px] text-muted-foreground">{commit.shortHash}</code>
                <span className="min-w-0 flex-1 truncate">{commit.message}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {commit.author} · {commit.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
