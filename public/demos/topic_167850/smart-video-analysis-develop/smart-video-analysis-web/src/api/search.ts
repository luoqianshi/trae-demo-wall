import request from '@/utils/request'

export interface ImageSearchResult {
  videoId: string
  videoFilename: string
  thumbnailUrl?: string
  similarity: number
  matchStartTimeMs: number
  matchEndTimeMs: number
  matchStartTime: string
  matchEndTime: string
  sceneDescription: string
  sceneTags: string[]
  videoDuration?: number
}

export const searchByImage = (imageFile: File, searchMode?: string, projectId?: string) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  if (searchMode) {
    formData.append('searchMode', searchMode)
  }
  if (projectId) {
    formData.append('projectId', projectId)
  }
  return request.post('/search/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getSearchDetail = (id: string) => {
  return request.get(`/search/${id}`)
}
