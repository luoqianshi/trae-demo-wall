/**
 * 访谈控制器
 * 创建日期: 2026-07-10
 */

const { Op } = require('sequelize');
const Interview = require('../models/Interview');
const User = require('../models/User');
const response = require('../utils/response');
const aiService = require('../services/ai.service');

const createInterview = async (req, res) => {
  try {
    const { topic, mode, expert_id } = req.body;
    if (!topic) return res.status(400).json(response.badRequest('访谈主题不能为空'));
    const interview = await Interview.create({
      expert_id: expert_id || req.user.id,
      employee_id: req.user.role === 'employee' ? req.user.id : null,
      topic,
      mode: mode || 'text',
      status: 'in_progress'
    });
    res.status(201).json(response.created(interview, '访谈创建成功'));
  } catch (err) {
    console.error('创建访谈失败:', err);
    res.status(500).json(response.internalError('创建访谈失败', err.message));
  }
};

const getInterviewList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, expert_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (req.user.role === 'expert') {
      where.expert_id = req.user.id;
    } else if (req.user.role === 'employee') {
      where.employee_id = req.user.id;
    }
    if (expert_id && req.user.role === 'admin') {
      where.expert_id = expert_id;
    }
    const { count, rows } = await Interview.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'expert', attributes: ['id', 'username', 'real_name', 'department', 'position'] }]
    });
    res.json(response.success({ list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) }, '获取成功'));
  } catch (err) {
    console.error('获取访谈列表失败:', err);
    res.status(500).json(response.internalError('获取访谈列表失败', err.message));
  }
};

const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findByPk(id, {
      include: [{ model: User, as: 'expert', attributes: ['id', 'username', 'real_name', 'department', 'position'] }]
    });
    if (!interview) return res.status(404).json(response.notFound('访谈不存在'));
    if (req.user.role === 'expert' && interview.expert_id !== req.user.id) {
      return res.status(403).json(response.forbidden('无权限访问'));
    }
    if (req.user.role === 'employee' && interview.employee_id !== req.user.id) {
      return res.status(403).json(response.forbidden('无权限访问'));
    }
    res.json(response.success(interview, '获取成功'));
  } catch (err) {
    console.error('获取访谈详情失败:', err);
    res.status(500).json(response.internalError('获取访谈详情失败', err.message));
  }
};

const addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, sender } = req.body;
    const interview = await Interview.findByPk(id);
    if (!interview) return res.status(404).json(response.notFound('访谈不存在'));
    if (interview.expert_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'employee') return res.status(403).json(response.forbidden('无权限操作'));
    let transcript = interview.transcript ? JSON.parse(interview.transcript) : [];
    transcript.push({ content, sender, timestamp: Date.now() });
    await interview.update({ transcript: JSON.stringify(transcript) });
    res.json(response.success(transcript, '消息添加成功'));
  } catch (err) {
    console.error('添加消息失败:', err);
    res.status(500).json(response.internalError('添加消息失败', err.message));
  }
};

const calculateConfidenceScore = (transcript) => {
  if (!transcript || transcript.length === 0) return 0.5;
  let messages = [];
  try {
    messages = JSON.parse(transcript);
  } catch {
    messages = [{ content: transcript }];
  }
  const messageCount = Array.isArray(messages) ? messages.length : 1;
  const totalLength = Array.isArray(messages)
    ? messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0)
    : (messages.content?.length || transcript.length);
  let score = 0.5;
  if (messageCount >= 5) score += 0.1;
  if (messageCount >= 10) score += 0.15;
  if (messageCount >= 20) score += 0.1;
  if (totalLength >= 200) score += 0.05;
  if (totalLength >= 500) score += 0.05;
  if (totalLength >= 1000) score += 0.05;
  return Math.min(score, 0.95);
};

const generateSummary = (transcript) => {
  if (!transcript) return '';
  let messages = [];
  try {
    messages = JSON.parse(transcript);
  } catch {
    messages = [{ content: transcript }];
  }
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const userMessages = messages.filter(m => m.sender === 'user');
  const expertMessages = messages.filter(m => m.sender === 'expert' || m.sender === 'system');
  const topics = userMessages.map(m => m.content).join('、');
  const answers = expertMessages.map(m => m.content).join('\n');
  const summary = `【访谈主题】${topics.substring(0, 100)}\n\n【核心要点】\n${answers.substring(0, 500)}\n\n【总结】本次访谈共${messages.length}条消息，涵盖${userMessages.length}个问题，专家给出了详细解答，可作为知识沉淀参考。`;
  return summary;
};

const generateAISummary = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findByPk(id);
    if (!interview) return res.status(404).json(response.notFound('访谈不存在'));
    if (interview.expert_id !== req.user.id && req.user.role !== 'admin' && interview.employee_id !== req.user.id) {
      return res.status(403).json(response.forbidden('无权限操作'));
    }
    const summary = await aiService.generateSummary(interview.transcript);
    await interview.update({ summary });
    res.json(response.success({ summary }, 'AI总结生成成功'));
  } catch (err) {
    console.error('生成AI总结失败:', err);
    res.status(500).json(response.internalError('生成AI总结失败', err.message));
  }
};

const completeInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findByPk(id);
    if (!interview) return res.status(404).json(response.notFound('访谈不存在'));
    if (interview.expert_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json(response.forbidden('无权限操作'));
    const confidenceScore = calculateConfidenceScore(interview.transcript);
    const summary = await aiService.generateSummary(interview.transcript);
    await interview.update({
      status: 'completed',
      completed_at: new Date(),
      confidence_score: confidenceScore,
      summary
    });
    res.json(response.success(interview, '访谈完成成功，AI总结已生成'));
  } catch (err) {
    console.error('完成访谈失败:', err);
    res.status(500).json(response.internalError('完成访谈失败', err.message));
  }
};

module.exports = { createInterview, getInterviewList, getInterviewById, addMessage, completeInterview, generateAISummary };