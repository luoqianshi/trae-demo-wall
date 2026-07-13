/**
 * 知识条目模型
 * 创建日期: 2026-07-10
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Knowledge = sequelize.define('Knowledge', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  interview_id: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  type: { type: DataTypes.ENUM('sop', 'checklist', 'decision_tree', 'article'), allowNull: false, defaultValue: 'article' },
  category: { type: DataTypes.STRING(50), defaultValue: '未分类' },
  tags: { type: DataTypes.TEXT },
  confidence_score: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.8 },
  status: { type: DataTypes.ENUM('draft', 'pending', 'verified', 'rejected'), defaultValue: 'draft' },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW }
}, { tableName: 'knowledge_items', timestamps: false });

module.exports = Knowledge;