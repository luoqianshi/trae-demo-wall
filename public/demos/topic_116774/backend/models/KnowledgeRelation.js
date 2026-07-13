const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KnowledgeRelation = sequelize.define('KnowledgeRelation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  source_id: { type: DataTypes.INTEGER, allowNull: false },
  target_id: { type: DataTypes.INTEGER, allowNull: false },
  relation_type: { type: DataTypes.ENUM('related', 'derived_from', 'part_of', 'reference'), defaultValue: 'related' },
  weight: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.5 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'knowledge_relations', timestamps: false });

module.exports = KnowledgeRelation;