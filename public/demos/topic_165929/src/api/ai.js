import request from './request'

export function getConversationList(params) {
  return request({
    url: '/ai/chat/conversations',
    method: 'get',
    params
  })
}

export function createConversation(data) {
  return request({
    url: '/ai/chat/conversation',
    method: 'post',
    data
  })
}

export function deleteConversation(id) {
  return request({
    url: `/ai/chat/conversation/${id}`,
    method: 'delete'
  })
}

export function getConversationMessages(id, params) {
  return request({
    url: `/ai/chat/conversation/${id}/messages`,
    method: 'get',
    params
  })
}

export function sendChatMessage(data) {
  return request({
    url: '/ai/chat',
    method: 'post',
    data
  })
}

export function sendChatMessageStream(data) {
  return request({
    url: '/ai/chat/stream',
    method: 'post',
    data,
    responseType: 'stream'
  })
}

export function getChatHistory(params) {
  return request({
    url: '/ai/chat/history',
    method: 'get',
    params
  })
}

export function clearChatHistory() {
  return request({
    url: '/ai/chat/clear',
    method: 'post'
  })
}

export function getJudgmentList(params) {
  return request({
    url: '/ai/judgment/list',
    method: 'get',
    params
  })
}

export function createJudgment(data) {
  return request({
    url: '/ai/judgment',
    method: 'post',
    data
  })
}

export function createStudentJudgment(data) {
  return request({
    url: '/ai/judgment/student',
    method: 'post',
    data
  })
}

export function createClassAnalysis(data) {
  return request({
    url: '/ai/judgment/class',
    method: 'post',
    data
  })
}

export function getJudgment(id) {
  return request({
    url: `/ai/judgment/${id}`,
    method: 'get'
  })
}

export function feedbackJudgment(id, data) {
  return request({
    url: `/ai/judgment/${id}/feedback`,
    method: 'post',
    data
  })
}

export function favoriteJudgment(id) {
  return request({
    url: `/ai/judgment/${id}/favorite`,
    method: 'post'
  })
}

export function exportJudgment(id, type) {
  return request({
    url: `/ai/judgment/${id}/export`,
    method: 'get',
    params: { type },
    responseType: 'blob'
  })
}

export function getWarningList(params) {
  return request({
    url: '/ai/warning/list',
    method: 'get',
    params
  })
}

export function getWarningDetail(id) {
  return request({
    url: `/ai/warning/${id}`,
    method: 'get'
  })
}

export function handleWarning(id, data) {
  return request({
    url: `/ai/warning/${id}/handle`,
    method: 'post',
    data
  })
}

export function getWarningStats(params) {
  return request({
    url: '/ai/warning/stats',
    method: 'get',
    params
  })
}

export function getStudentProfile(id) {
  return request({
    url: `/ai/warning/student/${id}/profile`,
    method: 'get'
  })
}

export function exportWarningList(params) {
  return request({
    url: '/ai/warning/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getKnowledgeList(params) {
  return request({
    url: '/ai/knowledge/list',
    method: 'get',
    params
  })
}

export function getKnowledgeCategories() {
  return request({
    url: '/ai/knowledge/categories',
    method: 'get'
  })
}

export function createKnowledge(data) {
  return request({
    url: '/ai/knowledge',
    method: 'post',
    data
  })
}

export function updateKnowledge(id, data) {
  return request({
    url: `/ai/knowledge/${id}`,
    method: 'put',
    data
  })
}

export function deleteKnowledge(id) {
  return request({
    url: `/ai/knowledge/${id}`,
    method: 'delete'
  })
}

export function restoreKnowledge(id) {
  return request({
    url: `/ai/knowledge/${id}/restore`,
    method: 'post'
  })
}

export function syncKnowledge() {
  return request({
    url: '/ai/knowledge/sync',
    method: 'post'
  })
}

export function getSyncStatus() {
  return request({
    url: '/ai/knowledge/sync/status',
    method: 'get'
  })
}

export function getSyncLogs(params) {
  return request({
    url: '/ai/knowledge/sync/logs',
    method: 'get',
    params
  })
}

export function importKnowledge(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/ai/knowledge/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getModelConfigList(params) {
  return request({
    url: '/ai/modelConfig/list',
    method: 'get',
    params
  })
}

export function getCurrentModelConfig() {
  return request({
    url: '/ai/modelConfig/current',
    method: 'get'
  })
}

export function createModelConfig(data) {
  return request({
    url: '/ai/modelConfig',
    method: 'post',
    data
  })
}

export function updateModelConfig(id, data) {
  return request({
    url: `/ai/modelConfig/${id}`,
    method: 'put',
    data
  })
}

export function updateModelParams(data) {
  return request({
    url: '/ai/modelConfig/params',
    method: 'put',
    data
  })
}

export function deleteModelConfig(id) {
  return request({
    url: `/ai/modelConfig/${id}`,
    method: 'delete'
  })
}

export function setDefaultModel(id) {
  return request({
    url: `/ai/modelConfig/${id}/default`,
    method: 'post'
  })
}

export function testModelConnection(id) {
  return request({
    url: `/ai/modelConfig/${id}/test`,
    method: 'post'
  })
}
