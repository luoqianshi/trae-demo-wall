import request from './request'

export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

export function getUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/user',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

export function resetPassword(id, data) {
  return request({
    url: `/user/${id}/resetPassword`,
    method: 'post',
    data
  })
}

export function assignRoles(id, data) {
  return request({
    url: `/user/${id}/roles`,
    method: 'post',
    data
  })
}

export function importUsers(data) {
  return request({
    url: '/user/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function exportUsers(params) {
  return request({
    url: '/user/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getPendingRegistrations(params) {
  return request({
    url: '/user/pendingRegistrations',
    method: 'get',
    params
  })
}

export function approveRegistration(id) {
  return request({
    url: `/user/approveRegistration/${id}`,
    method: 'post'
  })
}

export function rejectRegistration(id, data) {
  return request({
    url: `/user/rejectRegistration/${id}`,
    method: 'post',
    data
  })
}
