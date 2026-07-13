/**
 * 贡献记录模型
 * 创建日期: 2026-07-10
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contribution = sequelize.define('Contribution', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('interview', 'verify', 'use'), allowNull: false },
  target_id: { type: DataTypes.INTEGER },
  points: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING(200) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'contributions', timestamps: false });

module.exports = Contribution;