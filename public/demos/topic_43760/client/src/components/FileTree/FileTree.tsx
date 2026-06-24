import { useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import type { FileNode } from '../../types';

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

  const icon = node.type === 'directory' 
    ? (isExpanded ? '📂' : '📁')
    : getFileIcon(node.name);

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-2 px-3 py-1.5 cursor-pointer
          hover:bg-bg-secondary transition-colors
          ${isSelected ? 'bg-accent/20 text-accent' : 'text-text-primary'}
        `}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <span className="text-sm">{icon}</span>
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
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

function getFileIcon(filename: string): string {
  if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return '📘';
  if (filename.endsWith('.jsx') || filename.endsWith('.js')) return '📒';
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return '🎨';
  if (filename.endsWith('.json')) return '📋';
  if (filename.endsWith('.md')) return '📝';
  if (filename.endsWith('.py')) return '🐍';
  return '📄';
}

export function FileTree() {
  const { fileTree, fetchFileTree, isLoading } = useFileStore();

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  return (
    <div className="w-64 h-full bg-bg-secondary border-r border-border flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">文件</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-4 py-2 text-text-secondary text-sm">加载中...</div>
        ) : (
          fileTree.map((node) => (
            <FileTreeNode key={node.path} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
