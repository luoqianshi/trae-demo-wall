import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, Check, X, Tag as TagIcon, FolderOpen, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { tagCategoryApi, tagApi, type TagCategory, type Tag, type TagColorKey } from '../api/tag-api'
import { colorPalette, colorKeys } from '../constants'
import { TagPill } from '../components'

export function TagsManager() {
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 分类编辑状态
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryColor, setEditCategoryColor] = useState<TagColorKey>('gray')
  const [newCategoryName, setNewCategoryName] = useState('')

  // 标签编辑状态
  const [newTagName, setNewTagName] = useState('')
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editTagName, setEditTagName] = useState('')

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'tag'; id: string; name: string } | null>(null)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await tagCategoryApi.list()
      setCategories(data)
    } catch (err) {
      toast.error('加载分类失败')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedTags = selectedCategory?.tags || []

  // === 分类操作 ===
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.warning('请输入分类名称')
      return
    }
    try {
      await tagCategoryApi.add({ name: newCategoryName.trim(), color: 'blue' })
      setNewCategoryName('')
      toast.success('分类创建成功')
      loadCategories()
    } catch {
      toast.error('创建分类失败')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await tagCategoryApi.delete(id)
      if (selectedCategoryId === id) setSelectedCategoryId(null)
      toast.success('分类已删除')
      loadCategories()
    } catch {
      toast.error('删除分类失败')
    }
  }

  const startEditCategory = (cat: TagCategory) => {
    setEditingCategoryId(cat.id)
    setEditCategoryName(cat.name)
    setEditCategoryColor(cat.color || 'gray')
  }

  const saveEditCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return
    try {
      await tagCategoryApi.update({
        id: editingCategoryId,
        name: editCategoryName.trim(),
        color: editCategoryColor,
      })
      setEditingCategoryId(null)
      toast.success('分类已更新')
      loadCategories()
    } catch {
      toast.error('更新分类失败')
    }
  }

  // === 标签操作 ===
  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast.warning('请输入标签名称')
      return
    }
    if (!selectedCategoryId) {
      toast.warning('请先选择分类')
      return
    }
    try {
      await tagApi.add({
        categoryId: selectedCategoryId,
        name: newTagName.trim(),
      })
      setNewTagName('')
      toast.success('标签添加成功')
      loadCategories()
    } catch {
      toast.error('添加标签失败')
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      await tagApi.delete(id)
      toast.success('标签已删除')
      loadCategories()
    } catch {
      toast.error('删除标签失败')
    }
  }

  const startEditTag = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditTagName(tag.name)
  }

  const saveEditTag = async () => {
    if (!editingTagId || !editTagName.trim()) return
    try {
      await tagApi.update({
        id: editingTagId,
        name: editTagName.trim(),
      })
      setEditingTagId(null)
      toast.success('标签已更新')
      loadCategories()
    } catch {
      toast.error('更新标签失败')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'category') {
      await handleDeleteCategory(deleteTarget.id)
    } else {
      await handleDeleteTag(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  return (
    <div className="flex h-full">
      {/* 左侧：分类列表 */}
      <div className="w-[280px] flex-shrink-0 border-r bg-muted/20">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <FolderOpen className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">标签分类</h3>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
            {categories.length}
          </Badge>
        </div>

        {/* 新建分类 */}
        <div className="border-b px-3 py-2.5">
          <div className="flex gap-1.5">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入分类名称..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button size="sm" className="h-8 px-2.5" onClick={handleAddCategory}>
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* 分类列表 */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="px-4 py-6 text-xs text-muted-foreground text-center">加载中...</div>
          ) : categories.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FolderOpen className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">暂无分类</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">在上方输入名称创建</p>
            </div>
          ) : (
            <div className="py-1">
              {categories.map((cat) => {
                const catColor = colorPalette[cat.color || 'gray'] || colorPalette.gray
                const isEditing = editingCategoryId === cat.id
                const isSelected = selectedCategoryId === cat.id
                return (
                  <div
                    key={cat.id}
                    className={`group flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => {
                      if (!isEditing) setSelectedCategoryId(cat.id)
                    }}
                  >
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-1">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="h-6 flex-1 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditCategory()
                            if (e.key === 'Escape') setEditingCategoryId(null)
                          }}
                        />
                        <Button size="icon" variant="ghost" className="size-5" onClick={saveEditCategory}>
                          <Check className="size-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-5" onClick={() => setEditingCategoryId(null)}>
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span
                          className="size-3 rounded-full flex-shrink-0 ring-1 ring-inset"
                          style={{ backgroundColor: catColor.bg, ringColor: catColor.border }}
                        />
                        <span className="flex-1 truncate text-sm">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                          {cat.tags?.length || 0}
                        </Badge>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-5"
                            onClick={(e) => { e.stopPropagation(); startEditCategory(cat) }}
                          >
                            <Pencil className="size-2.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-5 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })
                            }}
                          >
                            <Trash2 className="size-2.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 右侧：标签列表 */}
      <div className="flex-1 flex flex-col">
        {selectedCategory ? (
          <>
            {/* 头部信息 */}
            <div className="border-b px-5 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full ring-1 ring-inset"
                  style={{
                    backgroundColor: colorPalette[selectedCategory.color || 'gray']?.bg,
                    ringColor: colorPalette[selectedCategory.color || 'gray']?.border,
                  }}
                />
                <h3 className="text-sm font-semibold">{selectedCategory.name}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {selectedTags.length} 个标签
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                {/* 分类主色选择 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Palette className="size-3.5 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground">分类主色</label>
                    <span className="text-[10px] text-muted-foreground/60">— 同分类下标签统一颜色</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colorKeys.map((key) => {
                      const c = colorPalette[key]
                      const isActive = (selectedCategory.color || 'gray') === key
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`size-7 rounded-lg transition-all ${
                            isActive
                              ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                              : 'ring-1 ring-border hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.bg }}
                          onClick={async () => {
                            try {
                              await tagCategoryApi.update({ id: selectedCategory.id, color: key })
                              toast.success('颜色已更新')
                              loadCategories()
                            } catch {
                              toast.error('更新颜色失败')
                            }
                          }}
                          title={key}
                        />
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* 新建标签 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TagIcon className="size-3.5 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground">添加标签</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="输入标签名称后回车..."
                      className="h-8 flex-1 text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button size="sm" className="h-8" onClick={handleAddTag}>
                      <Plus className="size-3.5 mr-1" />
                      添加
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* 标签列表 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <TagIcon className="size-3.5 text-muted-foreground" />
                    <label className="text-xs font-medium text-muted-foreground">标签列表</label>
                  </div>
                  {selectedTags.length === 0 ? (
                    <div className="py-10 text-center">
                      <TagIcon className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">该分类下暂无标签</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">在上方输入名称添加</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {selectedTags.map((tag) => {
                        const isEditing = editingTagId === tag.id
                        if (isEditing) {
                          return (
                            <div key={tag.id} className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 shadow-sm">
                              <Input
                                value={editTagName}
                                onChange={(e) => setEditTagName(e.target.value)}
                                className="h-5 w-[120px] border-0 bg-transparent text-xs p-0 focus-visible:ring-0"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditTag()
                                  if (e.key === 'Escape') setEditingTagId(null)
                                }}
                              />
                              <Button size="icon" variant="ghost" className="size-4" onClick={saveEditTag}>
                                <Check className="size-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="size-4" onClick={() => setEditingTagId(null)}>
                                <X className="size-3" />
                              </Button>
                            </div>
                          )
                        }
                        return (
                          <div key={tag.id} className="group relative">
                            <TagPill tag={tag} size="md" />
                            <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="flex size-4 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-accent"
                                onClick={() => startEditTag(tag)}
                              >
                                <Pencil className="size-2" />
                              </button>
                              <button
                                type="button"
                                className="flex size-4 items-center justify-center rounded-full bg-background border shadow-sm hover:bg-destructive/10 hover:border-destructive/30"
                                onClick={() => setDeleteTarget({ type: 'tag', id: tag.id, name: tag.name })}
                              >
                                <Trash2 className="size-2" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <FolderOpen className="size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">请在左侧选择一个分类</p>
            <p className="text-xs text-muted-foreground/50">选择后可管理该分类下的标签</p>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'category'
                ? `确定要删除分类「${deleteTarget?.name}」吗？该分类下的标签将变为未分类。`
                : `确定要删除标签「${deleteTarget?.name}」吗？此操作不可撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
