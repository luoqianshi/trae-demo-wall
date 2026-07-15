import request from './request'

export function getLeaveList(params) {
  return request({
    url: '/leave/list',
    method: 'get',
    params
  })
}

export function getLeave(id) {
  return request({
    url: `/leave/${id}`,
    method: 'get'
  })
}

export function createLeave(data) {
  return request({
    url: '/leave',
    method: 'post',
    data
  })
}

export function updateLeave(id, data) {
  return request({
    url: `/leave/${id}`,
    method: 'put',
    data
  })
}

export function deleteLeave(id) {
  return request({
    url: `/leave/${id}`,
    method: 'delete'
  })
}

export function approveLeave(id, data) {
  return request({
    url: `/leave/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectLeave(id, data) {
  return request({
    url: `/leave/${id}/reject`,
    method: 'post',
    data
  })
}

export function getLeaveStatistics(params) {
  return request({
    url: '/leave/statistics',
    method: 'get',
    params
  })
}

export function getMyLeaveList(params) {
  return request({
    url: '/leave/my',
    method: 'get',
    params
  })
}
