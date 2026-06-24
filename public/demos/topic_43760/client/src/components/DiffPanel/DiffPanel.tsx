import { useCallback, useEffect, useState } from 'react';
import { GitCompare, Maximize2, Minimize2, X } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';

interface DiffPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiffPanel({ isOpen, onClose }: DiffPanelProps) {
  const { diffContent, diffFile, fetchDiff, fetchStagedDiff } = useWorkspaceStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStaged, setShowStaged] = useState(false);

  const refresh = useCallback(() => {
    if (showStaged) {
      fetchStagedDiff();
    } else {
      fetchDiff(diffFile ?? undefined);
    }
  }, [showStaged, diffFile, fetchDiff, fetchStagedDiff]);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, showStaged, diffFile]);

  if (!isOpen) return null;

  const lines = diffContent.split('\n');

  return (
    <div
      className={`flex flex-col border-l bg-background ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-[480px] shrink-0'
      }`}
    >
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <GitCompare className="h-3.5 w-3.5" />
          {diffFile ? diffFile.split(/[\\/]/).pop() : showStaged ? 'Staged Changes' : 'Working Diff'}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowStaged(!showStaged)}
            className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {showStaged ? 'Staged' : 'Unstaged'}
          </button>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Diff content */}
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {diffContent ? (
          <pre className="text-[11px] leading-5">
            {lines.map((line, i) => {
              let bg = 'transparent';
              let color = 'text-foreground';
              if (line.startsWith('@@')) {
                bg = 'bg-blue-500/10';
                color = 'text-blue-400';
              } else if (line.startsWith('+')) {
                bg = 'bg-emerald-500/10';
                color = 'text-emerald-400';
              } else if (line.startsWith('-')) {
                bg = 'bg-red-500/10';
                color = 'text-red-400';
              } else if (line.startsWith('diff --git')) {
                bg = 'bg-muted';
                color = 'text-muted-foreground font-medium';
              }

              return (
                <div key={i} className={`${bg} ${color} whitespace-pre-wrap break-all`}>
                  {line || ' '}
                </div>
              );
            })}
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No changes
          </div>
        )}
      </div>
    </div>
  );
}
