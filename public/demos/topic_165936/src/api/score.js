import request from './request'

export function getScoreRecordList(params) {
  return request({
    url: '/score/record/list',
    method: 'get',
    params
  })
}

export function getScoreRecord(id) {
  return request({
    url: `/score/record/${id}`,
    method: 'get'
  })
}

export function createScoreRecord(data) {
  return request({
    url: '/score/record',
    method: 'post',
    data
  })
}

export function updateScoreRecord(id, data) {
  return request({
    url: `/score/record/${id}`,
    method: 'put',
    data
  })
}

export function deleteScoreRecord(id) {
  return request({
    url: `/score/record/${id}`,
    method: 'delete'
  })
}

export function batchCreateScoreRecord(data) {
  return request({
    url: '/score/record/batch',
    method: 'post',
    data
  })
}

export function getStudentScore(studentId) {
  return request({
    url: `/score/student/${studentId}`,
    method: 'get'
  })
}

export function getScoreRuleList(params) {
  return request({
    url: '/score/rule/list',
    method: 'get',
    params
  })
}

export function getAllScoreRules() {
  return request({
    url: '/score/rule/all',
    method: 'get'
  })
}

export function createScoreRule(data) {
  return request({
    url: '/score/rule',
    method: 'post',
    data
  })
}

export function updateScoreRule(id, data) {
  return request({
    url: `/score/rule/${id}`,
    method: 'put',
    data
  })
}

export function deleteScoreRule(id) {
  return request({
    url: `/score/rule/${id}`,
    method: 'delete'
  })
}

export function toggleScoreRule(id, status) {
  return request({
    url: `/score/rule/${id}/status`,
    method: 'put',
    data: { enabled: status }
  })
}

export function getAuditList(params) {
  return request({
    url: '/score/audit/list',
    method: 'get',
    params
  })
}

export function approveScore(id, data) {
  return request({
    url: `/score/audit/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectScore(id, data) {
  return request({
    url: `/score/audit/${id}/reject`,
    method: 'post',
    data
  })
}

export function getScoreRecycleList(params) {
  return request({
    url: '/score/recycle',
    method: 'get',
    params
  })
}

export function restoreScoreRecord(id) {
  return request({
    url: `/score/restore/${id}`,
    method: 'post'
  })
}

export function permanentDeleteScoreRecord(id) {
  return request({
    url: `/score/permanentDelete/${id}`,
    method: 'delete'
  })
}
