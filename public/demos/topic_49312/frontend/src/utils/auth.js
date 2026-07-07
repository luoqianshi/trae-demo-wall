const USER_KEY = 'user';
const TOKEN_KEY = 'token';

// ==================== 用户信息 ====================

/**
 * 获取当前登录用户信息
 * @returns {object|null} 用户对象或null
 */
export function getUser() {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/**
 * 设置当前登录用户信息
 * @param {object} user - 用户对象
 */
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * 移除当前登录用户信息
 */
export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

// ==================== Token ====================

/**
 * 获取JWT Token
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 设置JWT Token
 * @param {string} token
 */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 移除JWT Token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ==================== 角色判断 ====================

/**
 * 判断当前用户是否拥有指定角色（支持传入多个角色，满足其一即可）
 * @param  {...string} roles - 角色名称列表
 * @returns {boolean}
 */
export function hasRole(...roles) {
  const user = getUser();
  if (!user) return false;
  return roles.includes(user.role);
}

/** 是否为管理员 */
export const isAdmin = () => hasRole('admin');

/** 是否为HR */
export const isHR = () => hasRole('hr');

/** 是否为部门经理 */
export const isManager = () => hasRole('manager');

/** 是否为普通员工 */
export const isEmployee = () => hasRole('employee');

/**
 * 退出登录 - 清除所有认证信息
 */
export function logout() {
  removeUser();
  removeToken();
}
