import { useEffect } from 'react';
import { useFileStore } from '@/stores/fileStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FileNode } from '@/types';
import { Folder, FolderOpen, FileText, FileCode, FileJson, FileType } from 'lucide-react';

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const { expandedDirs, toggleDir, selectFile, selectedFile } = useFileStore();
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.type === 'directory') {
      toggleDir(node.path);
    } else {
      selectFile(node.path);
    }
  };

  const Icon = node.type === 'directory'
    ? (isExpanded ? FolderOpen : Folder)
    : getFileIcon(node.name);

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left
          transition-colors text-sm
          ${isSelected
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(filename: string): React.ComponentType<{ className?: string }> {
  if (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.js')) return FileCode;
  if (filename.endsWith('.json')) return FileJson;
  if (filename.endsWith('.md') || filename.endsWith('.txt')) return FileType;
  return FileText;
}

interface FileDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileDrawer({ isOpen, onOpenChange }: FileDrawerProps) {
  const { fileTree, fetchFileTree, isLoading } = useFileStore();

  useEffect(() => {
    if (isOpen) {
      fetchFileTree();
    }
  }, [isOpen, fetchFileTree]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-sm font-semibold">文件</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              加载中...
            </div>
          ) : (
            <div className="p-2">
              {fileTree.map((node) => (
                <FileTreeNode key={node.path} node={node} depth={0} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// 触发按钮组件
export function FileDrawerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-24 left-4 z-30 rounded-full shadow-lg"
      onClick={onClick}
    >
      <Folder className="w-4 h-4" />
    </Button>
  );
}
