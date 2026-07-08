import { useStore } from './index'

export const useGeoActivities = () =>
  useStore(s => s.activities.filter(a => a.type === 'geo' && a.status === 'published'))

export const useCertActivities = () =>
  useStore(s => s.activities.filter(a => a.type === 'cert' && a.status === 'published'))

export const useContestActivities = () =>
  useStore(s => s.activities.filter(a => a.type === 'contest' && a.status === 'published'))

export const useActivityById = (id: string | undefined) =>
  useStore(s => (id ? s.activities.find(a => a.id === id) : undefined))

export const usePendingUploads = () =>
  useStore(s => s.uploads.filter(u => u.status === 'pending'))
