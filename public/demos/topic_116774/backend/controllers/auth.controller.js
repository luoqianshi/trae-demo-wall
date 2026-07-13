/**
 * 认证控制器
 * 创建日期: 2026-07-10
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const response = require('../utils/response');
const { secret, accessTokenExpiresIn, refreshTokenExpiresIn } = require('../config/jwt');

const generateTokens = (user) => {
  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, secret, { expiresIn: accessTokenExpiresIn });
  const refreshToken = jwt.sign(payload, secret, { expiresIn: refreshTokenExpiresIn });
  return { accessToken, refreshToken };
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json(response.badRequest('用户名和密码不能为空'));
    }
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json(response.unauthorized('用户名或密码错误'));
    if (user.status !== 'active') return res.status(401).json(response.unauthorized('账号已被禁用'));
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) return res.status(401).json(response.unauthorized('用户名或密码错误'));
    const { accessToken, refreshToken } = generateTokens(user);
    const userInfo = { id: user.id, username: user.username, email: user.email, real_name: user.real_name, phone: user.phone, role: user.role, department: user.department, position: user.position, expertise_tags: user.expertise_tags, bio: user.bio, contribution_points: user.contribution_points };
    res.json(response.success({ user: userInfo, accessToken, refreshToken }, '登录成功'));
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json(response.internalError('登录失败', err.message));
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, real_name, department, position } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json(response.badRequest('用户名、邮箱和密码不能为空'));
    }
    const existingUser = await User.findOne({ where: { [User.sequelize.Op.or]: [{ username }, { email }] } });
    if (existingUser) return res.status(400).json(response.badRequest('用户名或邮箱已被使用'));
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password_hash: passwordHash, real_name, department, position, role: 'employee' });
    const userInfo = { id: user.id, username: user.username, email: user.email, real_name: user.real_name, role: user.role };
    res.status(201).json(response.created(userInfo, '注册成功'));
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json(response.internalError('注册失败', err.message));
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json(response.badRequest('Refresh Token不能为空'));
    const decoded = jwt.verify(refreshToken, secret);
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') return res.status(401).json(response.unauthorized('用户不存在或已禁用'));
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    res.json(response.success({ accessToken, refreshToken: newRefreshToken }, 'Token刷新成功'));
  } catch (err) {
    console.error('Token刷新失败:', err);
    res.status(401).json(response.unauthorized('Refresh Token无效'));
  }
};

const logout = async (req, res) => {
  try {
    res.json(response.success(null, '登出成功'));
  } catch (err) {
    console.error('登出失败:', err);
    res.status(500).json(response.internalError('登出失败', err.message));
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json(response.badRequest('原密码和新密码不能为空'));
    }
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json(response.notFound('用户不存在'));
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) return res.status(401).json(response.unauthorized('原密码不正确'));
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: passwordHash });
    res.json(response.success(null, '密码修改成功'));
  } catch (err) {
    console.error('修改密码失败:', err);
    res.status(500).json(response.internalError('修改密码失败', err.message));
  }
};

module.exports = { login, register, refreshToken, logout, changePassword };