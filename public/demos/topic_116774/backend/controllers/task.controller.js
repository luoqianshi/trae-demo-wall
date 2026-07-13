const Task = require('../models/Task');
const response = require('../utils/response');

const getTasks = async (req, res) => {
  try {
    const { completed } = req.query;
    const where = { user_id: req.user.id };
    if (completed !== undefined) where.completed = completed === 'true';

    const tasks = await Task.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    res.json(response.success({ list: tasks, total: tasks.length }, '获取成功'));
  } catch (err) {
    console.error('获取任务列表失败:', err);
    res.status(500).json(response.internalError('获取任务列表失败', err.message));
  }
};

const createTask = async (req, res) => {
  try {
    const { title, priority, deadline } = req.body;

    if (!title) {
      return res.status(400).json(response.badRequest('任务标题不能为空'));
    }

    const task = await Task.create({
      user_id: req.user.id,
      title,
      priority: priority || 'medium',
      deadline: deadline || null,
    });

    res.json(response.success({ task }, '创建任务成功'));
  } catch (err) {
    console.error('创建任务失败:', err);
    res.status(500).json(response.internalError('创建任务失败', err.message));
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, priority, deadline, completed } = req.body;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!task) {
      return res.status(404).json(response.notFound('任务不存在'));
    }

    if (title !== undefined) task.title = title;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (completed !== undefined) task.completed = completed;

    await task.save();

    res.json(response.success({ task }, '更新任务成功'));
  } catch (err) {
    console.error('更新任务失败:', err);
    res.status(500).json(response.internalError('更新任务失败', err.message));
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!task) {
      return res.status(404).json(response.notFound('任务不存在'));
    }

    await task.destroy();

    res.json(response.success(null, '删除任务成功'));
  } catch (err) {
    console.error('删除任务失败:', err);
    res.status(500).json(response.internalError('删除任务失败', err.message));
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };