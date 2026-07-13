import { create } from 'zustand'
import type { NovelCharacterItem, NovelItem, NovelOutlineNode, NovelRelationItem } from '../api/novel-api'

interface NovelWorkspaceState {
  currentNovel: NovelItem | null
  outlineTree: NovelOutlineNode[]
  activeNodeId: string | null
  characters: NovelCharacterItem[]
  relations: NovelRelationItem[]

  setCurrentNovel: (novel: NovelItem | null) => void
  setOutlineTree: (tree: NovelOutlineNode[]) => void
  setActiveNodeId: (id: string | null) => void
  setCharacters: (list: NovelCharacterItem[]) => void
  setRelations: (list: NovelRelationItem[]) => void
  upsertCharacter: (c: NovelCharacterItem) => void
  removeCharacter: (id: string) => void
  upsertRelation: (r: NovelRelationItem) => void
  removeRelation: (id: string) => void
  reset: () => void
}

const initialState = {
  currentNovel: null,
  outlineTree: [],
  activeNodeId: null,
  characters: [],
  relations: [],
}

export const useNovelWorkspaceStore = create<NovelWorkspaceState>((set) => ({
  ...initialState,
  setCurrentNovel: (novel) => set({ currentNovel: novel }),
  setOutlineTree: (tree) => set({ outlineTree: tree }),
  setActiveNodeId: (id) => set({ activeNodeId: id }),
  setCharacters: (list) => set({ characters: list }),
  setRelations: (list) => set({ relations: list }),
  upsertCharacter: (c) =>
    set((s) => ({
      characters: s.characters.some((i) => i.id === c.id)
        ? s.characters.map((i) => (i.id === c.id ? c : i))
        : [...s.characters, c],
    })),
  removeCharacter: (id) => set((s) => ({ characters: s.characters.filter((i) => i.id !== id) })),
  upsertRelation: (r) =>
    set((s) => ({
      relations: s.relations.some((i) => i.id === r.id)
        ? s.relations.map((i) => (i.id === r.id ? r : i))
        : [...s.relations, r],
    })),
  removeRelation: (id) => set((s) => ({ relations: s.relations.filter((i) => i.id !== id) })),
  reset: () => set(initialState),
}))

/**
 * 深度查找大纲节点
 */
export function findOutlineNode(tree: NovelOutlineNode[], id: string): NovelOutlineNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children && node.children.length > 0) {
      const found = findOutlineNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 平铺大纲（用于计算面包屑）
 */
export function flattenOutline(tree: NovelOutlineNode[]): NovelOutlineNode[] {
  const result: NovelOutlineNode[] = []
  const walk = (nodes: NovelOutlineNode[]) => {
    for (const n of nodes) {
      result.push(n)
      if (n.children) walk(n.children)
    }
  }
  walk(tree)
  return result
}

/**
 * 找到从根到指定节点的路径
 */
export function findPath(tree: NovelOutlineNode[], id: string): NovelOutlineNode[] {
  const path: NovelOutlineNode[] = []
  const walk = (nodes: NovelOutlineNode[], stack: NovelOutlineNode[]): boolean => {
    for (const node of nodes) {
      stack.push(node)
      if (node.id === id) {
        path.push(...stack)
        return true
      }
      if (node.children && node.children.length > 0) {
        if (walk(node.children, stack)) return true
      }
      stack.pop()
    }
    return false
  }
  walk(tree, [])
  return path
}
