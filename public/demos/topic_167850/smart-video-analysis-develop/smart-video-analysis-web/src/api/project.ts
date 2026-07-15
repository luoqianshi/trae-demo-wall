import request from '@/utils/request'

export const createProject = (data: { name: string; description: string }) => {
  return request.post('/api/projects', data)
}

export const updateProject = (id: string, data: { name: string; description: string }) => {
  return request.put(`/api/projects/${id}`, data)
}

export const getProjectList = () => {
  return request.get('/api/projects')
}

export const deleteProject = (id: string) => {
  return request.delete(`/api/projects/${id}`)
}