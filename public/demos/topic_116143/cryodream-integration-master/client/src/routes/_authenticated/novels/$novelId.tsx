import { createFileRoute } from '@tanstack/react-router'
import { NovelWorkspacePage } from '@/features/novels/novel-workspace-page'

export type NovelWorkspaceTab =
  | 'outline'
  | 'characters'
  | 'relations'
  | 'timeline'
  | 'settings'

export interface NovelWorkspaceSearch {
  tab: NovelWorkspaceTab
  nodeId?: string
  characterId?: string
  eventId?: string
  settingId?: string
}

const ALLOWED_TABS: NovelWorkspaceTab[] = [
  'outline',
  'characters',
  'relations',
  'timeline',
  'settings',
]

export const Route = createFileRoute('/_authenticated/novels/$novelId')({
  component: NovelWorkspacePage,
  validateSearch: (search: Record<string, unknown>): NovelWorkspaceSearch => {
    const rawTab = typeof search.tab === 'string' ? (search.tab as NovelWorkspaceTab) : 'outline'
    return {
      tab: ALLOWED_TABS.includes(rawTab) ? rawTab : 'outline',
      nodeId: typeof search.nodeId === 'string' ? search.nodeId : undefined,
      characterId:
        typeof search.characterId === 'string' ? search.characterId : undefined,
      eventId: typeof search.eventId === 'string' ? search.eventId : undefined,
      settingId: typeof search.settingId === 'string' ? search.settingId : undefined,
    }
  },
})
