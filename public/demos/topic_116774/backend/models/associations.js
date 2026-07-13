/**
 * ģ�͹�����ϵ����
 * ��������: 2026-07-10
 */

const User = require('./User');
const Interview = require('./Interview');
const Knowledge = require('./Knowledge');
const SOP = require('./SOP');
const Tag = require('./Tag');
const Contribution = require('./Contribution');

// �û����̸����
Interview.belongsTo(User, { foreignKey: 'expert_id', as: 'expert' });
User.hasMany(Interview, { foreignKey: 'expert_id', as: 'interviews' });

// �û���֪ʶ����
Knowledge.belongsTo(User, { foreignKey: 'created_by', as: 'contributor' });
User.hasMany(Knowledge, { foreignKey: 'created_by', as: 'knowledgeItems' });

// �û��빱�׹���
Contribution.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Contribution, { foreignKey: 'user_id', as: 'contributions' });

// ��̸��֪ʶ����
Knowledge.belongsTo(Interview, { foreignKey: 'interview_id', as: 'interview' });
Interview.hasMany(Knowledge, { foreignKey: 'interview_id', as: 'knowledgeItems' });

// ֪ʶ��SOP����
SOP.belongsTo(Knowledge, { foreignKey: 'knowledge_id', as: 'knowledge' });
Knowledge.hasMany(SOP, { foreignKey: 'knowledge_id', as: 'sops' });

// ֪ʶ���ǩ��������Զࣩ
Knowledge.belongsToMany(Tag, { through: { model: 'knowledge_tags', timestamps: false }, as: 'tagList' });
Tag.belongsToMany(Knowledge, { through: { model: 'knowledge_tags', timestamps: false }, as: 'knowledgeItems' });

module.exports = { User, Interview, Knowledge, SOP, Tag, Contribution };
