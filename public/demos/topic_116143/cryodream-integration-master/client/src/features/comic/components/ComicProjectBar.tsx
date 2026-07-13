import { useState } from 'react'
import { Check, ChevronDown, FolderOpen, ImageIcon, Loader2, Plus, Save, Trash2 } from 'lucide-react'
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
import { type ComicProject } from '../types'

interface ComicProjectBarProps {
  projects: ComicProject[]
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
 * 漫画项目顶部管理栏：新建/打开/切换/保存/删除项目，编辑当前项目名。
 * 参照 features/comfyui/components/ProjectBar.tsx 的风格。
 */
export function ComicProjectBar({
  projects,
  currentProjectId,
  currentProjectName,
  saving,
  onCreate,
  onOpen,
  onSave,
  onDelete,
  onRenameCurrent,
}: ComicProjectBarProps) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const commitCreate = () => {
    onCreate(newName.trim() || '未命名漫画')
    setNewName('')
    setCreating(false)
  }

  const commitRename = () => {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== currentProjectName) {
      onRenameCurrent(trimmed)
    }
    setEditingName(false)
  }

  return (
    <div className='flex h-12 items-center gap-2 border-b border-neutral-200 bg-white px-3'>
      <SidebarTrigger />
      <Separator orientation='vertical' className='mx-1 h-6' />

      <div className='flex items-center gap-1.5 text-neutral-800'>
        <ImageIcon size={16} className='text-fuchsia-500' />
        <span className='text-sm font-semibold tracking-tight'>漫画制作</span>
      </div>

      <Separator orientation='vertical' className='mx-2 h-6' />

      {/* 项目切换下拉 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='gap-1.5'>
            <FolderOpen size={14} />
            <span className='max-w-[160px] truncate'>
              {currentProjectId ? currentProjectName || '未命名漫画' : '未选择项目'}
            </span>
            <ChevronDown size={12} className='opacity-60' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-64'>
          <DropdownMenuLabel>漫画项目 ({projects.length})</DropdownMenuLabel>
          {projects.length === 0 && (
            <div className='px-2 py-4 text-center text-xs text-neutral-400'>暂无项目</div>
          )}
          {projects.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => onOpen(p.id)}
              className={cn('flex items-center justify-between gap-2')}
            >
              <span className='flex-1 truncate'>{p.name}</span>
              {p.id === currentProjectId && <Check size={14} className='text-emerald-500' />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 新建按钮 / 输入 */}
      {creating ? (
        <div className='flex items-center gap-1'>
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCreate()
              if (e.key === 'Escape') {
                setNewName('')
                setCreating(false)
              }
            }}
            onBlur={commitCreate}
            placeholder='新漫画名称'
            className='h-8 w-40 text-xs'
          />
        </div>
      ) : (
        <Button variant='ghost' size='sm' onClick={() => setCreating(true)} className='gap-1'>
          <Plus size={14} /> 新建
        </Button>
      )}

      <Separator orientation='vertical' className='mx-2 h-6' />

      {/* 当前项目名编辑 */}
      {currentProjectId && (
        <>
          {editingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setEditingName(false)
              }}
              className='h-8 w-48 text-xs'
            />
          ) : (
            <button
              onClick={() => {
                setNameDraft(currentProjectName)
                setEditingName(true)
              }}
              className='rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100'
              title='点击重命名'
            >
              {currentProjectName || '未命名漫画'}
            </button>
          )}
        </>
      )}

      <div className='ml-auto flex items-center gap-2'>
        {currentProjectId && (
          <>
            <Button variant='outline' size='sm' onClick={onSave} disabled={saving} className='gap-1'>
              {saving ? <Loader2 size={14} className='animate-spin' /> : <Save size={14} />}
              保存
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (window.confirm('确认删除当前漫画项目？此操作不可恢复。')) {
                  onDelete(currentProjectId)
                }
              }}
              className='gap-1 text-rose-500 hover:text-rose-600'
            >
              <Trash2 size={14} /> 删除
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
