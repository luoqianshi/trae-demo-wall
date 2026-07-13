/**
 * 标签模型
 * 创建日期: 2026-07-10
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  category: { type: DataTypes.STRING(50) },
  color: { type: DataTypes.STRING(20) }
}, { tableName: 'tags', timestamps: false });

module.exports = Tag;