import request from './request'

export function getStudentList(params) {
  return request({
    url: '/student/list',
    method: 'get',
    params
  })
}

export function getStudent(id) {
  return request({
    url: `/student/${id}`,
    method: 'get'
  })
}

export function createStudent(data) {
  return request({
    url: '/student',
    method: 'post',
    data
  })
}

export function updateStudent(id, data) {
  return request({
    url: `/student/${id}`,
    method: 'put',
    data
  })
}

export function deleteStudent(id) {
  return request({
    url: `/student/${id}`,
    method: 'delete'
  })
}

export function getRecycleList(params) {
  return request({
    url: '/student/recycle',
    method: 'get',
    params
  })
}

export function restoreStudent(id) {
  return request({
    url: `/student/restore/${id}`,
    method: 'post'
  })
}

export function permanentDeleteStudent(id) {
  return request({
    url: `/student/permanentDelete/${id}`,
    method: 'delete'
  })
}

export function importStudents(data) {
  return request({
    url: '/student/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function exportStudents(params) {
  return request({
    url: '/student/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function uploadAvatar(data) {
  return request({
    url: '/student/uploadAvatar',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getStudentByStudentNo(studentNo) {
  return request({
    url: `/student/studentNo/${studentNo}`,
    method: 'get'
  })
}
