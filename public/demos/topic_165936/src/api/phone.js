import request from './request'

export function getPhoneOverview(params) {
  return request({
    url: '/phone/overview',
    method: 'get',
    params
  })
}

export function getClassPhoneStatus(classId) {
  return request({
    url: `/phone/class/${classId}`,
    method: 'get'
  })
}

export function getStudentPhoneStatus(studentId) {
  return request({
    url: `/phone/student/${studentId}`,
    method: 'get'
  })
}

export function collectPhone(data) {
  return request({
    url: '/phone/collect',
    method: 'post',
    data
  })
}

export function returnPhone(data) {
  return request({
    url: '/phone/return',
    method: 'post',
    data
  })
}

export function batchCollectPhone(data) {
  return request({
    url: '/phone/batchCollect',
    method: 'post',
    data
  })
}

export function batchReturnPhone(data) {
  return request({
    url: '/phone/batchReturn',
    method: 'post',
    data
  })
}

export function adjustDays(data) {
  return request({
    url: '/phone/adjustDays',
    method: 'post',
    data
  })
}

export function getPhoneRecordList(params) {
  return request({
    url: '/phone/records',
    method: 'get',
    params
  })
}

export function getMyPhoneStatus() {
  return request({
    url: '/phone/my',
    method: 'get'
  })
}
