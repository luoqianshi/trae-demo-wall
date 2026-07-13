/**
 * SOP控制器
 * 创建日期: 2026-07-10
 */

const SOP = require('../models/SOP');
const Knowledge = require('../models/Knowledge');
const response = require('../utils/response');

const getSOPList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, knowledge_id } = req.query;
    const where = {};
    if (knowledge_id) where.knowledge_id = knowledge_id;
    const { count, rows } = await SOP.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']],
      include: [{ model: Knowledge, as: 'knowledge', attributes: ['id', 'title', 'type'] }]
    });
    res.json(response.success({ list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }, '获取成功'));
  } catch (err) {
    console.error('获取SOP列表失败:', err);
    res.status(500).json(response.internalError('获取SOP列表失败', err.message));
  }
};

const getSOPById = async (req, res) => {
  try {
    const { id } = req.params;
    const sop = await SOP.findByPk(id, {
      include: [{ model: Knowledge, as: 'knowledge', attributes: ['id', 'title', 'type'] }]
    });
    if (!sop) return res.status(404).json(response.notFound('SOP不存在'));
    res.json(response.success(sop, '获取成功'));
  } catch (err) {
    console.error('获取SOP详情失败:', err);
    res.status(500).json(response.internalError('获取SOP详情失败', err.message));
  }
};

module.exports = { getSOPList, getSOPById };