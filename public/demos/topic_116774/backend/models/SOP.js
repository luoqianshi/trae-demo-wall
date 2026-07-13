/**
 * SOP文档模型
 * 创建日期: 2026-07-10
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SOP = sequelize.define('SOP', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  knowledge_id: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING(200), allowNull: false },
  category: { type: DataTypes.STRING(50), defaultValue: '标准流程' },
  steps: { type: DataTypes.TEXT, allowNull: false },
  flowchart_data: { type: DataTypes.TEXT },
  version: { type: DataTypes.STRING(20), defaultValue: 'v1.0' },
  usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'sop_documents', timestamps: false });

module.exports = SOP;