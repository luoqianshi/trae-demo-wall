'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TreePine,
  ChevronRight,
  User,
  Calendar,
  MapPin,
  Sparkles,
  Plus,
  Folder,
  Link2,
  BookOpen,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import useSWR from 'swr';
import { PageTransition } from '@/components/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FullScreenLoader } from '@/components/ui/loading';
import { apiClient, swrFetcher, ApiError } from '@/lib/api-client';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { lifeTreeNodeTypeLabels } from '@/lib/labels';
import {
  LifeTreeNodeType,
  type LifeTreeNode,
  type Memory,
  type PaginatedResponse,
} from '@echolife/shared';

/** Icon + color for each node type. */
const nodeTypeMeta: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  [LifeTreeNodeType.ROOT]: { icon: TreePine, color: '#0071e3' },
  [LifeTreeNodeType.CATEGORY]: { icon: Folder, color: '#86868b' },
  [LifeTreeNodeType.EVENT]: { icon: Calendar, color: '#ff9f0a' },
  [LifeTreeNodeType.PERSON]: { icon: User, color: '#30d158' },
  [LifeTreeNodeType.PLACE]: { icon: MapPin, color: '#5e5ce6' },
  [LifeTreeNodeType.THEME]: { icon: Sparkles, color: '#af52de' },
};

export default function LifeTreePage() {
  const { data, isLoading, mutate } = useSWR<LifeTreeNode[]>(
    '/life-tree',
    swrFetcher,
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createParentId, setCreateParentId] = React.useState<string | null>(null);

  const nodes = data ?? [];

  // Recursively find a node by id within the nested tree.
  const findNode = React.useCallback(
    (list: LifeTreeNode[], id: string): LifeTreeNode | null => {
      for (const n of list) {
        if (n.id === id) return n;
        if (n.children?.length) {
          const found = findNode(n.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const selectedNode = selectedId ? findNode(nodes, selectedId) : null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenCreate = (parentId: string | null) => {
    setCreateParentId(parentId);
    setCreateOpen(true);
  };

  if (isLoading && !data) {
    return <FullScreenLoader label="加载生命树中..." />;
  }

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="liquid-glass-strong flex h-10 w-10 items-center justify-center rounded-xl animate-float">
            <TreePine className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text">生命树</h1>
            <p className="text-sm text-text-muted">将你的记忆编织成一棵生命之树</p>
          </div>
        </div>
        <Button onClick={() => handleOpenCreate(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          添加节点
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Tree panel */}
        <div className="liquid-glass-strong lg:col-span-2 p-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl liquid-glass-strong animate-breathe">
                <TreePine className="h-7 w-7 text-text-muted" />
              </span>
              <p className="mt-3 text-sm font-medium text-text">生命树还是空的</p>
              <p className="mt-1 text-xs text-text-muted">添加第一个节点开始构建你的生命树</p>
              <Button size="sm" className="mt-4" onClick={() => handleOpenCreate(null)}>
                <Plus className="h-4 w-4" />
                添加节点
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {nodes.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  selectedId={selectedId}
                  onToggle={toggleExpand}
                  onSelect={setSelectedId}
                  onAddChild={handleOpenCreate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedNode ? (
            <NodeDetail
              node={selectedNode}
              onAddChild={() => handleOpenCreate(selectedNode.id)}
              onDeleted={() => {
                setSelectedId(null);
                void mutate();
              }}
            />
          ) : (
            <div className="liquid-glass-strong flex h-full min-h-[300px] flex-col items-center justify-center py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl liquid-glass">
                <Link2 className="h-7 w-7 text-text-muted" />
              </span>
              <p className="mt-3 text-sm font-medium text-text">选择一个节点</p>
              <p className="mt-1 text-xs text-text-muted">在左侧树中选择节点查看详情与关联记忆</p>
            </div>
          )}
        </div>
      </div>

      <CreateNodeModal
        open={createOpen}
        parentId={createParentId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void mutate();
        }}
      />
    </PageTransition>
  );
}

/** Recursive tree node renderer. */
function TreeNode({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
  onAddChild,
}: {
  node: LifeTreeNode;
  depth: number;
  expanded: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const meta = nodeTypeMeta[node.type] ?? nodeTypeMeta[LifeTreeNodeType.CATEGORY];
  const Icon = meta.icon;

  return (
    <div>
      <motion.div
        className={cn(
          'group flex items-center gap-1.5 rounded-xl py-1.5 pr-2 border transition-colors duration-300',
          isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]',
        )}
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          borderColor: isSelected ? `${meta.color}40` : 'transparent',
        }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:text-text"
            aria-label={isExpanded ? '收起' : '展开'}
          >
            <ChevronRight
              className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        <button
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
          </span>
          <span
            className={cn(
              'truncate text-sm',
              isSelected ? 'font-medium text-accent' : 'text-text',
            )}
          >
            {node.title}
          </span>
          {hasChildren && (
            <span className="shrink-0 text-[10px] text-text-muted">{children.length}</span>
          )}
        </button>

        <button
          onClick={() => onAddChild(node.id)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
          aria-label="添加子节点"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </motion.div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                selectedId={selectedId}
                onToggle={onToggle}
                onSelect={onSelect}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Right-side detail panel for a selected node. */
function NodeDetail({
  node,
  onAddChild,
  onDeleted,
}: {
  node: LifeTreeNode;
  onAddChild: () => void;
  onDeleted: () => void;
}) {
  const meta = nodeTypeMeta[node.type] ?? nodeTypeMeta[LifeTreeNodeType.CATEGORY];
  const Icon = meta.icon;

  const { data: memoriesData, isLoading } = useSWR<PaginatedResponse<Memory>>(
    `/memories?lifeTreeNodeId=${node.id}&pageSize=10`,
    swrFetcher,
  );
  const linkedMemories = memoriesData?.items ?? [];

  const handleDelete = async () => {
    if (!confirm('确定删除该节点吗？子节点也会被一并删除。')) return;
    try {
      await apiClient.delete(`/life-tree/${node.id}`);
      onDeleted();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '删除失败');
    }
  };

  return (
    <div className="liquid-glass-strong p-6 relative overflow-hidden">
      {/* Glow accent based on node type */}
      <div
        className="absolute -top-24 -right-24 h-48 w-48 rounded-full blur-[80px] opacity-[0.15] pointer-events-none"
        style={{ backgroundColor: meta.color }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
              <Icon className="h-6 w-6" style={{ color: meta.color }} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text">{node.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  {lifeTreeNodeTypeLabels[node.type] ?? node.type}
                </Badge>
                <span className="text-xs text-text-muted">
                  创建于 {formatRelativeTime(node.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onAddChild} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              子节点
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-9 w-9">
              <Trash2 className="h-4 w-4 text-error" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {node.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
            {node.description}
          </p>
        )}

        {/* Metadata */}
        {(node.metadata as Record<string, unknown> | null) &&
          Object.keys(node.metadata as Record<string, unknown>).length > 0 && (
            <div className="mt-4 liquid-glass p-4">
              <p className="mb-2 text-xs font-medium text-text-muted">元数据</p>
              <div className="space-y-1">
                {Object.entries(node.metadata as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-text-muted">{k}</span>
                    <span className="text-text">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Linked memories */}
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text">关联记忆</h3>
            <Badge variant="outline">{linkedMemories.length}</Badge>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : linkedMemories.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">
              暂无关联记忆
            </p>
          ) : (
            <div className="space-y-2">
              {linkedMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="liquid-glass p-4 cursor-pointer"
                >
                  <p className="truncate text-sm font-medium text-text">{memory.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{memory.content}</p>
                  <p className="mt-1 text-[10px] text-text-muted">
                    {formatDate(memory.createdAt)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Modal for creating a new tree node. */
function CreateNodeModal({
  open,
  parentId,
  onClose,
  onCreated,
}: {
  open: boolean;
  parentId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<LifeTreeNodeType>(LifeTreeNodeType.CATEGORY);
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName('');
      setType(LifeTreeNodeType.CATEGORY);
      setDescription('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('请输入节点名称');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/life-tree', {
        title: name.trim(),
        type,
        description: description.trim() || undefined,
        parentId: parentId ?? undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: LifeTreeNodeType.CATEGORY, label: '分类', icon: Folder, color: '#86868b' },
    { value: LifeTreeNodeType.EVENT, label: '事件', icon: Calendar, color: '#ff9f0a' },
    { value: LifeTreeNodeType.PERSON, label: '人物', icon: User, color: '#30d158' },
    { value: LifeTreeNodeType.PLACE, label: '地点', icon: MapPin, color: '#5e5ce6' },
    { value: LifeTreeNodeType.THEME, label: '主题', icon: Sparkles, color: '#af52de' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="添加节点"
      description={parentId ? '为当前节点添加子节点' : '添加新的根节点'}
      className="!bg-white/[0.06] !backdrop-blur-[60px] !backdrop-saturate-[1.6] !border-white/[0.14] !shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            创建
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="节点名称"
          placeholder="例如：童年、母亲、故乡..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error ?? undefined}
          className="liquid-glass-input border-0 focus:border-0"
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text">节点类型</label>
          <div className="grid grid-cols-5 gap-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = type === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  onClick={() => setType(opt.value as LifeTreeNodeType)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={cn(
                    'liquid-glass flex flex-col items-center gap-1.5 p-3 transition-colors',
                    active && 'bg-white/[0.08]',
                  )}
                  style={active ? { borderColor: `${opt.color}50` } : undefined}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
                    <Icon className="h-4 w-4" style={{ color: opt.color }} />
                  </span>
                  <span className={cn('text-xs', active ? 'text-text font-medium' : 'text-text-muted')}>
                    {opt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <Textarea
          label="描述（可选）"
          placeholder="描述这个节点..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="liquid-glass-input border-0 focus:border-0"
        />
      </div>
    </Modal>
  );
}
