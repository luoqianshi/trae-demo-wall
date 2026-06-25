import { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  GitBranch,
  ListTodo,
} from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { RightPanelTab } from '@/types';
import { Badge } from '@/components/ui/badge';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('status');
  const { currentAgent } = useAgentStore();
  const {
    currentPath,
    files,
    memories,
    todos,
    gitStatus,
    fetchFiles,
    fetchAgentMemory,
    fetchAgentTodo,
    fetchGitStatus,
  } = useWorkspaceStore();

  // Fetch data when tab or agent changes
  useEffect(() => {
    if (currentAgent) {
      fetchAgentMemory(currentAgent);
      fetchAgentTodo(currentAgent);
    }
  }, [currentAgent, activeTab]);

  useEffect(() => {
    if (currentPath) {
      fetchFiles(currentPath);
      fetchGitStatus();
    }
  }, [currentPath]);

  const tabs: { key: RightPanelTab; icon: typeof ListTodo; label: string }[] = [
    { key: 'status', icon: ListTodo, label: '状态' },
    { key: 'files', icon: Folder, label: '文件' },
    { key: 'memory', icon: BookOpen, label: '记忆' },
  ];

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col bg-[#13131f]/80">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-white/5">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition ${
              activeTab === key
                ? 'border-b-2 border-[#89b4fa] text-[#cdd6f4]'
                : 'text-[#6c7086] hover:text-[#a6adc8]'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'status' && <StatusTab todos={todos} gitStatus={gitStatus} />}
        {activeTab === 'files' && (
          <FilesTab
            files={files}
            currentPath={currentPath}
            onFolderClick={(p) => {
              fetchFiles(p);
            }}
          />
        )}
        {activeTab === 'memory' && <MemoryTab memories={memories} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Tab: TODO + Git status
// ---------------------------------------------------------------------------
function StatusTab({
  todos,
  gitStatus,
}: {
  todos: { text: string; done: boolean; source: string }[];
  gitStatus: { branch: string | null; files: { path: string; status: string; staged: boolean }[]; isRepo: boolean } | null;
}) {
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="flex flex-col">
      {/* TODO */}
      <div className="border-b border-white/5 p-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[#6c7086]">
          <ListTodo className="h-3 w-3" />
          TODO
          {todos.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[9px] bg-[#313244] text-[#a6adc8]">
              {doneCount}/{todos.length}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          {todos.length === 0 && (
            <p className="py-2 text-center text-[11px] text-[#6c7086]">暂无 TODO</p>
          )}
          {todos.map((todo, i) => (
            <div key={i} className="flex items-start gap-2 rounded bg-[#1e1e2e]/60 px-2.5 py-1.5 text-xs text-[#a6adc8]">
              <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded border ${todo.done ? 'border-[#a6e3a1] bg-[#a6e3a1]' : 'border-[#6c7086]/30'}`}>
                {todo.done && (
                  <svg className="h-full w-full text-[#1e1e2e]" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={todo.done ? 'text-[#6c7086] line-through' : ''}>{todo.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Git status */}
      <div className="p-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[#6c7086]">
          <GitBranch className="h-3 w-3" />
          Git
        </div>
        {gitStatus && gitStatus.isRepo ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#cdd6f4]">
              <GitBranch className="h-3 w-3 text-[#89b4fa]" />
              <span className="font-medium">{gitStatus.branch || 'HEAD'}</span>
              <Badge variant="secondary" className="ml-auto text-[9px] bg-[#313244] text-[#a6adc8]">
                {gitStatus.files.length}
              </Badge>
            </div>
            {gitStatus.files.slice(0, 10).map((file) => (
              <div key={file.path} className="truncate rounded bg-[#1e1e2e]/60 px-2.5 py-1 text-[11px] text-[#a6adc8]">
                {file.path}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-[11px] text-[#6c7086]">不是 Git 仓库</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Files Tab
// ---------------------------------------------------------------------------
function FilesTab({
  files,
  currentPath,
  onFolderClick,
}: {
  files: { name: string; path: string; type: string; size?: number }[];
  currentPath: string;
  onFolderClick: (path: string) => void;
}) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  };

  return (
    <div className="flex flex-col">
      <div className="border-b border-white/5 p-3">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[#6c7086]">
          {currentPath.split(/[\\/]/).pop() || 'Files'}
        </div>
        <div className="truncate text-[10px] text-[#6c7086]">{currentPath}</div>
      </div>
      <div className="p-2">
        {/* Parent */}
        {currentPath && (
          <button
            onClick={() => {
              const parent = currentPath.replace(/[\\/][^\\/]+$/, '');
              if (parent) onFolderClick(parent);
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-[#6c7086] hover:bg-[#1e1e2e]/60"
          >
            <Folder className="h-3.5 w-3.5" />
            ..
          </button>
        )}
        {files.map((file) =>
          file.type === 'directory' ? (
            <button
              key={file.path}
              onClick={() => onFolderClick(file.path)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-[#a6adc8] hover:bg-[#1e1e2e]/60"
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#89b4fa]" />
              <span className="truncate">{file.name}</span>
            </button>
          ) : (
            <div key={file.path} className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-[#a6adc8]">
              <File className="h-3.5 w-3.5 shrink-0 text-[#6c7086]" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              {file.size != null && (
                <span className="shrink-0 text-[10px] text-[#6c7086]">{formatSize(file.size)}</span>
              )}
            </div>
          ),
        )}
        {files.length === 0 && (
          <p className="py-4 text-center text-[11px] text-[#6c7086]">空目录</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Memory Tab
// ---------------------------------------------------------------------------
function MemoryTab({ memories }: { memories: { name: string; path: string; scope: string; content: string }[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col">
      <div className="border-b border-white/5 p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#6c7086]">
          Agent Memory
        </div>
      </div>
      <div className="p-2">
        {memories.length === 0 && (
          <p className="py-4 text-center text-[11px] text-[#6c7086]">暂无记忆文件</p>
        )}
        {memories.map((mem, i) => (
          <div key={mem.path} className="border-b border-white/5 last:border-0">
            <button
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              className="flex w-full items-center gap-2 px-2 py-2 text-xs text-[#a6adc8] hover:bg-[#1e1e2e]/60"
            >
              {expandedIdx === i ? (
                <ChevronDown className="h-3 w-3 shrink-0 text-[#6c7086]" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0 text-[#6c7086]" />
              )}
              <BookOpen className="h-3 w-3 shrink-0 text-[#89b4fa]" />
              <span className="min-w-0 flex-1 truncate font-medium">{mem.name}</span>
              <Badge variant="secondary" className="text-[9px] bg-[#313244] text-[#a6adc8]">
                {mem.scope === 'project' ? '项目' : '全局'}
              </Badge>
            </button>
            {expandedIdx === i && (
              <div className="border-t border-white/5 px-3 py-2">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-[#6c7086]">
                  {mem.content.slice(0, 3000)}
                  {mem.content.length > 3000 && '\n... (truncated)'}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
