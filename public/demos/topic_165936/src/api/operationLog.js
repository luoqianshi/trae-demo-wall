import request from './request'

export function getOperationLogList(params) {
  return request({
    url: '/operationLog/list',
    method: 'get',
    params
  })
}

export function getOperationLogDetail(id) {
  return request({
    url: `/operationLog/${id}`,
    method: 'get'
  })
}
