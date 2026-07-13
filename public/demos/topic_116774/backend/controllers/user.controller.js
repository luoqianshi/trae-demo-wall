/**
 * 用户控制器
 * 创建日期: 2026-07-10
 */

const User = require('../models/User');
const response = require('../utils/response');

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'real_name', 'phone', 'avatar', 'role', 'department', 'position', 'expertise_tags', 'bio', 'contribution_points'] });
    if (!user) return res.status(404).json(response.notFound('用户不存在'));
    res.json(response.success(user, '获取成功'));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json(response.internalError('获取用户信息失败', err.message));
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const { real_name, email, phone, avatar, department, position, expertise_tags, bio } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json(response.notFound('用户不存在'));
    await user.update({
      real_name: real_name || user.real_name,
      email: email || user.email,
      phone: phone || user.phone,
      avatar: avatar || user.avatar,
      department: department || user.department,
      position: position || user.position,
      expertise_tags: expertise_tags || user.expertise_tags,
      bio: bio || user.bio
    });
    const updatedUser = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'real_name', 'phone', 'avatar', 'role', 'department', 'position', 'expertise_tags', 'bio', 'contribution_points'] });
    res.json(response.success(updatedUser, '更新成功'));
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json(response.internalError('更新用户信息失败', err.message));
  }
};

const getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, role, department } = req.query;
    const where = {};
    if (role) where.role = role;
    if (department) where.department = department;
    const { count, rows } = await User.findAndCountAll({ where, attributes: ['id', 'username', 'email', 'real_name', 'phone', 'role', 'department', 'position', 'status', 'created_at'], offset: (page - 1) * pageSize, limit: parseInt(pageSize) });
    res.json(response.success({ list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }, '获取成功'));
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json(response.internalError('获取用户列表失败', err.message));
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: ['id', 'username', 'email', 'real_name', 'phone', 'role', 'department', 'position', 'expertise_tags', 'bio', 'contribution_points', 'status', 'created_at'] });
    if (!user) return res.status(404).json(response.notFound('用户不存在'));
    res.json(response.success(user, '获取成功'));
  } catch (err) {
    console.error('获取用户详情失败:', err);
    res.status(500).json(response.internalError('获取用户详情失败', err.message));
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { real_name, phone, role, department, position, status, expertise_tags, bio } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json(response.notFound('用户不存在'));
    await user.update({
      real_name: real_name || user.real_name,
      phone: phone || user.phone,
      role: role || user.role,
      department: department || user.department,
      position: position || user.position,
      status: status || user.status,
      expertise_tags: expertise_tags || user.expertise_tags,
      bio: bio || user.bio
    });
    const updatedUser = await User.findByPk(id, { attributes: ['id', 'username', 'email', 'real_name', 'phone', 'role', 'department', 'position', 'status', 'created_at'] });
    res.json(response.success(updatedUser, '更新成功'));
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json(response.internalError('更新用户信息失败', err.message));
  }
};

module.exports = { getCurrentUser, updateCurrentUser, getUserList, getUserById, updateUser };