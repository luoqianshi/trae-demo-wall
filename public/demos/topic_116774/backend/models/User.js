/**
 * 用户模型
 * 创建日期: 2026-07-10
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true, allowNull: false, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  real_name: { type: DataTypes.STRING(50) },
  phone: { type: DataTypes.STRING(20), unique: true },
  avatar: { type: DataTypes.TEXT },
  role: { type: DataTypes.ENUM('admin', 'expert', 'employee'), allowNull: false, defaultValue: 'employee' },
  department: { type: DataTypes.STRING(100) },
  position: { type: DataTypes.STRING(50) },
  expertise_tags: { type: DataTypes.TEXT },
  bio: { type: DataTypes.TEXT },
  contribution_points: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW }
}, { tableName: 'users', timestamps: false });

module.exports = User;