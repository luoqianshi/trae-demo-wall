const TOKEN_KEY = 'smart_class_token'
const USER_KEY = 'smart_class_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser() {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr || userStr === 'undefined') return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function setUser(user) {
  if (user === null || user === undefined) {
    localStorage.removeItem(USER_KEY)
  } else {
    try {
      const json = JSON.stringify(user)
      if (json === 'undefined') {
        localStorage.removeItem(USER_KEY)
      } else {
        localStorage.setItem(USER_KEY, json)
      }
    } catch {
      localStorage.removeItem(USER_KEY)
    }
  }
}

export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth() {
  removeToken()
  removeUser()
}
