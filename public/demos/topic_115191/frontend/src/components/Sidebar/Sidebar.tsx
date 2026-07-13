/** 侧边栏：项目列表 + 新建项目。 */
import { useEffect, useState, useRef } from 'react'
import { useStore } from '../../store'

export function Sidebar() {
  const projects = useStore(s => s.projects)
  const currentProject = useStore(s => s.currentProject)
  const loadProjects = useStore(s => s.loadProjects)
  const selectProject = useStore(s => s.selectProject)
  const createProject = useStore(s => s.createProject)
  const deleteProject = useStore(s => s.deleteProject)
  const renameProject = useStore(s => s.renameProject)
  const pinProject = useStore(s => s.pinProject)
  const [newName, setNewName] = useState('')
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 点击外部关闭项目菜单
  useEffect(() => {
    if (!menuFor) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFor(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuFor])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await createProject(newName.trim())
      setNewName('')
    } catch (e) {
      console.error('项目创建失败:', e)
    }
  }

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id)
    setRenameValue(currentName)
    setMenuFor(null)
  }

  const confirmRename = async () => {
    if (!renamingId) return
    const name = renameValue.trim()
    if (name) {
      try {
        await renameProject(renamingId, name)
      } catch (e) {
        console.error('重命名失败:', e)
      }
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleDelete = async (id: string) => {
    setMenuFor(null)
    if (confirm('确定删除该项目？所有角色、场景、故事板数据将一并删除。')) {
      try {
        await deleteProject(id)
      } catch (e) {
        console.error('删除失败:', e)
      }
    }
  }

  const handlePin = async (id: string, pinned: boolean) => {
    setMenuFor(null)
    try {
      await pinProject(id, !pinned)
    } catch (e) {
      console.error('置顶失败:', e)
    }
  }

  return (
    <div className="w-60 bg-[#141414] text-gray-100 h-full flex flex-col border-r border-gray-800">
      <div className="p-3 border-b border-gray-800">
        <label className="block text-xs text-gray-400 mb-1">新建项目</label>
        <input
          type="text"
          className="w-full bg-[#1f1f1f] text-gray-100 text-sm px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="输入名称后回车"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button
          type="button"
          className={`w-full mt-2 py-2 rounded text-sm font-medium transition-colors ${
            newName.trim()
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
              : 'bg-[#252525] text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleCreate}
          disabled={!newName.trim()}
        >
          + 新建项目
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs text-gray-500 uppercase">项目列表</div>
        {projects.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500">暂无项目</div>
        )}
        {projects.map(p => (
          <div
            key={p.id}
            className={`relative border-b border-gray-800 transition-colors hover:bg-[#1f1f1f] ${
              currentProject?.id === p.id ? 'bg-[#1f1f1f] border-l-4 border-l-indigo-500' : ''
            }`}
          >
            {renamingId === p.id ? (
              /* 重命名输入框 */
              <div className="px-3 py-2.5">
                <input
                  type="text"
                  autoFocus
                  className="w-full bg-[#0a0a0a] text-gray-100 text-sm px-2 py-1 rounded border border-indigo-500 focus:outline-none"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmRename()
                    if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                  }}
                  onBlur={confirmRename}
                />
              </div>
            ) : (
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                onClick={() => selectProject(p.id)}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {p.pinned && <span className="text-amber-400 text-xs shrink-0">📌</span>}
                    <span className="font-medium truncate text-gray-200">{p.name}</span>
                  </div>
                  {/* "..." 按钮 */}
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-gray-500 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-[#2a2a2a] cursor-pointer shrink-0"
                    onClick={e => {
                      e.stopPropagation()
                      setMenuFor(menuFor === p.id ? null : p.id)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        setMenuFor(menuFor === p.id ? null : p.id)
                      }
                    }}
                  >
                    ⋮
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>{p.status}</span>
                </div>
              </button>
            )}

            {/* 下拉菜单 */}
            {menuFor === p.id && (
              <div
                ref={menuRef}
                className="absolute right-2 top-10 z-50 w-36 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-2xl overflow-hidden py-1"
              >
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-[#252525] transition-colors text-left"
                  onClick={() => handlePin(p.id, p.pinned)}
                >
                  <span className="text-base">{p.pinned ? '📌' : '📍'}</span>
                  <span>{p.pinned ? '取消置顶' : '置顶'}</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-[#252525] transition-colors text-left"
                  onClick={() => startRename(p.id, p.name)}
                >
                  <span className="text-base">✏️</span>
                  <span>重命名</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#252525] transition-colors text-left"
                  onClick={() => handleDelete(p.id)}
                >
                  <span className="text-base">🗑️</span>
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
