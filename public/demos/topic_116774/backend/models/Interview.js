/**
 * 访谈记录模型
 * 创建日期: 2026-07-10
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  expert_id: { type: DataTypes.INTEGER, allowNull: false },
  employee_id: { type: DataTypes.INTEGER, allowNull: true },
  topic: { type: DataTypes.STRING(200), allowNull: false },
  status: { type: DataTypes.ENUM('draft', 'in_progress', 'completed'), allowNull: false, defaultValue: 'draft' },
  mode: { type: DataTypes.ENUM('text', 'voice', 'video'), allowNull: false, defaultValue: 'text' },
  duration: { type: DataTypes.INTEGER },
  transcript: { type: DataTypes.TEXT('long') },
  summary: { type: DataTypes.TEXT },
  confidence_score: { type: DataTypes.DECIMAL(3, 2) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  completed_at: { type: DataTypes.DATE }
}, { tableName: 'interview_records', timestamps: false });

module.exports = Interview;