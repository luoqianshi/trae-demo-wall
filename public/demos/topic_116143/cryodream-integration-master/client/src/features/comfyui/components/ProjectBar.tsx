import { useState } from 'react'
import { Check, ChevronDown, FolderOpen, Image as ImageIcon, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { type ComfyProject } from '../api/project-api'
import { getProjectThumbnail } from '../utils/thumbnail'

interface ProjectBarProps {
  projects: ComfyProject[]
  currentProjectId: string | null
  currentProjectName: string
  saving: boolean
  onCreate: (name: string) => void
  onOpen: (id: string) => void
  onSave: () => void
  onDelete: (id: string) => void
  onRenameCurrent: (name: string) => void
}

/**
 * 顶部项目管理栏：新建/打开/切换/保存/删除项目，编辑当前项目名。
 */
export function ProjectBar({
  projects,
  currentProjectId,
  currentProjectName,
  saving,
  onCreate,
  onOpen,
  onSave,
  onDelete,
  onRenameCurrent,
}: ProjectBarProps) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const commitCreate = () => {
    onCreate(newName.trim() || '未命名项目')
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <SidebarTrigger variant="outline" className="size-7" />
      <Separator orientation="vertical" className="h-5" />
      <FolderOpen size={15} className="shrink-0 text-neutral-700" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-200/60">
            项目
            <ChevronDown size={13} className="text-neutral-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="text-xs text-neutral-400">我的项目</DropdownMenuLabel>
          {projects.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-neutral-400">暂无项目</div>
          )}
          {projects.map((p) => {
            const thumb = getProjectThumbnail(p)
            const isActive = p.id === currentProjectId
            return (
              <DropdownMenuItem
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="flex items-center gap-2 py-2 text-xs"
              >
                {/* 缩略图（32x32） */}
                <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className="size-full object-cover"
                      onError={(e) => {
                        // 缩略图加载失败：隐藏 img，展示占位图标
                        const img = e.currentTarget
                        img.style.display = 'none'
                        const fallback = img.nextElementSibling as HTMLElement | null
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-neutral-300"
                    style={{ display: thumb ? 'none' : 'flex' }}
                  >
                    <ImageIcon size={16} />
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    {isActive && <Check size={12} className="shrink-0 text-neutral-900" />}
                    <span className={cn('truncate', isActive ? 'font-semibold text-neutral-900' : 'text-neutral-700')}>
                      {p.name}
                    </span>
                  </div>
                  {p.updateTime && (
                    <span className="truncate text-[10px] text-neutral-400">
                      {new Date(p.updateTime).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(p.id)
                  }}
                  className="text-neutral-300 hover:text-red-500"
                  title="删除项目"
                >
                  <Trash2 size={12} />
                </button>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-neutral-300">/</span>

      {currentProjectId ? (
        editingName ? (
          <Input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              onRenameCurrent(nameDraft.trim() || currentProjectName)
              setEditingName(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRenameCurrent(nameDraft.trim() || currentProjectName)
                setEditingName(false)
              }
            }}
            className="h-7 w-44 text-xs"
          />
        ) : (
          <button
            onClick={() => {
              setNameDraft(currentProjectName)
              setEditingName(true)
            }}
            className="truncate rounded px-1.5 py-0.5 text-[13px] text-neutral-700 hover:bg-neutral-200/60"
            title="点击重命名（保存后生效）"
          >
            {currentProjectName}
          </button>
        )
      ) : (
        <span className="text-[13px] text-neutral-400">未选择项目</span>
      )}

      <div className="ms-auto flex items-center gap-2">
        {creating ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCreate()
                if (e.key === 'Escape') setCreating(false)
              }}
              placeholder="项目名称"
              className="h-7 w-40 text-xs"
            />
            <Button onClick={commitCreate} size="sm" className="h-7 bg-neutral-900 text-xs hover:bg-black">
              创建
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setCreating(true)}
            size="sm"
            variant="outline"
            className="h-7 border-neutral-200 text-xs text-neutral-600"
          >
            <Plus size={13} className="mr-1" /> 新建项目
          </Button>
        )}
        <Button
          onClick={onSave}
          disabled={saving || !currentProjectId}
          size="sm"
          className={cn('h-7 bg-neutral-900 text-xs hover:bg-black')}
        >
          {saving ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Save size={13} className="mr-1" />}
          保存
        </Button>
      </div>
    </div>
  )
}
