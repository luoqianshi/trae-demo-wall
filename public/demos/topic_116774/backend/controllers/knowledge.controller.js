/**
 * 知识库控制器
 * 创建日期: 2026-07-10
 */

const Knowledge = require('../models/Knowledge');
const User = require('../models/User');
const response = require('../utils/response');

const getKnowledgeList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, type, tag } = req.query;
    const where = {};
    if (type) where.type = type;
    if (keyword) where.title = { [Knowledge.sequelize.Op.like]: `%${keyword}%` };
    const { count, rows } = await Knowledge.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'contributor', attributes: ['id', 'username', 'real_name', 'department', 'position'] }]
    });
    const processedRows = rows.map(item => {
      const data = item.toJSON();
      if (data.tags) {
        data.tags = data.tags.split(',').map(t => t.trim());
      }
      return data;
    });
    res.json(response.success({ list: processedRows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }, '获取成功'));
  } catch (err) {
    console.error('获取知识列表失败:', err);
    res.status(500).json(response.internalError('获取知识列表失败', err.message));
  }
};

const getKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;
    const knowledge = await Knowledge.findByPk(id, {
      include: [{ model: User, as: 'contributor', attributes: ['id', 'username', 'real_name', 'department', 'position'] }]
    });
    if (!knowledge) return res.status(404).json(response.notFound('知识不存在'));
    await knowledge.increment('view_count');
    const data = knowledge.toJSON();
    if (data.tags) {
      data.tags = data.tags.split(',').map(t => t.trim());
    }
    res.json(response.success(data, '获取成功'));
  } catch (err) {
    console.error('获取知识详情失败:', err);
    res.status(500).json(response.internalError('获取知识详情失败', err.message));
  }
};

const verifyKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified, confidence_score } = req.body;
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) return res.status(404).json(response.notFound('知识不存在'));
    await knowledge.update({ is_verified: is_verified !== undefined ? is_verified : true, confidence_score: confidence_score || knowledge.confidence_score });
    res.json(response.success(knowledge, '验证成功'));
  } catch (err) {
    console.error('验证知识失败:', err);
    res.status(500).json(response.internalError('验证知识失败', err.message));
  }
};

const feedbackKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) return res.status(404).json(response.notFound('知识不存在'));
    await knowledge.increment('usage_count');
    res.json(response.success({ message: '反馈成功', rating, comment }, '反馈成功'));
  } catch (err) {
    console.error('反馈知识失败:', err);
    res.status(500).json(response.internalError('反馈知识失败', err.message));
  }
};

module.exports = { getKnowledgeList, getKnowledgeById, verifyKnowledge, feedbackKnowledge };