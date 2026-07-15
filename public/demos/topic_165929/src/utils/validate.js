export function validatePhone(rule, value, callback) {
  const reg = /^1[3-9]\d{9}$/
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!reg.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

export function validateEmail(rule, value, callback) {
  const reg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!value) {
    callback()
  } else if (!reg.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

export function validateIdCard(rule, value, callback) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!value) {
    callback()
  } else if (!reg.test(value)) {
    callback(new Error('请输入正确的身份证号'))
  } else {
    callback()
  }
}

export function validateStudentId(rule, value, callback) {
  const reg = /^[a-zA-Z0-9]+$/
  if (!value) {
    callback(new Error('请输入学号'))
  } else if (!reg.test(value)) {
    callback(new Error('学号只能包含字母和数字'))
  } else {
    callback()
  }
}

export function validatePositiveNumber(rule, value, callback) {
  if (value === null || value === undefined || value === '') {
    callback()
  } else if (isNaN(value) || Number(value) <= 0) {
    callback(new Error('请输入正数'))
  } else {
    callback()
  }
}

export function validateInteger(rule, value, callback) {
  if (value === null || value === undefined || value === '') {
    callback()
  } else if (!Number.isInteger(Number(value))) {
    callback(new Error('请输入整数'))
  } else {
    callback()
  }
}
