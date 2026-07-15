import request from './request'

export function getClassList(params) {
  return request({
    url: '/class/list',
    method: 'get',
    params
  })
}

export function getAllClasses() {
  return request({
    url: '/class/all',
    method: 'get'
  })
}

export function getClass(id) {
  return request({
    url: `/class/${id}`,
    method: 'get'
  })
}

export function createClass(data) {
  return request({
    url: '/class',
    method: 'post',
    data
  })
}

export function updateClass(id, data) {
  return request({
    url: `/class/${id}`,
    method: 'put',
    data
  })
}

export function deleteClass(id) {
  return request({
    url: `/class/${id}`,
    method: 'delete'
  })
}
