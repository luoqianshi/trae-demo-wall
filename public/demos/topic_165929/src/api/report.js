import request from './request'

export function getScoreReport(params) {
  return request({
    url: '/report/score',
    method: 'get',
    params
  })
}

export function getScoreRank(params) {
  return request({
    url: '/report/score/rank',
    method: 'get',
    params
  })
}

export function getScoreTrend(params) {
  return request({
    url: '/report/score/trend',
    method: 'get',
    params
  })
}

export function getScoreDistribution(params) {
  return request({
    url: '/report/score/distribution',
    method: 'get',
    params
  })
}

export function exportScoreReport(params) {
  return request({
    url: '/report/score/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getPhoneReport(params) {
  return request({
    url: '/report/phone',
    method: 'get',
    params
  })
}

export function getPhoneTrend(params) {
  return request({
    url: '/report/phone/trend',
    method: 'get',
    params
  })
}

export function getPhoneDistribution(params) {
  return request({
    url: '/report/phone/distribution',
    method: 'get',
    params
  })
}

export function exportPhoneReport(params) {
  return request({
    url: '/report/phone/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getAttendanceReport(params) {
  return request({
    url: '/report/attendance',
    method: 'get',
    params
  })
}

export function getAttendanceTrend(params) {
  return request({
    url: '/report/attendance/trend',
    method: 'get',
    params
  })
}

export function getAttendanceDistribution(params) {
  return request({
    url: '/report/attendance/distribution',
    method: 'get',
    params
  })
}

export function getAttendanceRank(params) {
  return request({
    url: '/report/attendance/rank',
    method: 'get',
    params
  })
}

export function exportAttendanceReport(params) {
  return request({
    url: '/report/attendance/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getBasicReport(params) {
  return request({
    url: '/report/basic',
    method: 'get',
    params
  })
}

export function getAiReport(params) {
  return request({
    url: '/report/ai',
    method: 'get',
    params
  })
}

export function getAiTrend(params) {
  return request({
    url: '/report/ai/trend',
    method: 'get',
    params
  })
}

export function getAiTypeDistribution(params) {
  return request({
    url: '/report/ai/types',
    method: 'get',
    params
  })
}

export function getAiFeedbackDistribution(params) {
  return request({
    url: '/report/ai/feedback',
    method: 'get',
    params
  })
}

export function exportAiReport(params) {
  return request({
    url: '/report/ai/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
