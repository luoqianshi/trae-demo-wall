const express = require('express');
const { run, get, all } = require('../database');
const { authMiddleware, scientistOnly } = require('../middleware/auth');

const router = express.Router();

// 获取所有项目（支持筛选和搜索）
router.get('/', async (req, res) => {
  try {
    const { category, search, status, creator_id } = req.query;

    let query = `
      SELECT p.*, u.name as creator_name, u.institution as creator_institution,
        (SELECT COUNT(*) FROM participations WHERE project_id = p.id) as participant_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (creator_id) {
      query += ' AND p.creator_id = ?';
      params.push(creator_id);
    }

    query += ' ORDER BY p.created_at DESC';

    const projects = await all(query, params);
    res.json({ projects });
  } catch (err) {
    console.error('获取项目列表错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有分类
router.get('/categories', async (req, res) => {
  try {
    const categories = await all('SELECT DISTINCT category FROM projects ORDER BY category');
    res.json({ categories: categories.map(c => c.category) });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取我的项目（我创建的）
router.get('/my/created', authMiddleware, scientistOnly, async (req, res) => {
  try {
    const projects = await all(`
      SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM participations WHERE project_id = p.id) as participant_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.creator_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取我参与的项目
router.get('/my/participating', authMiddleware, async (req, res) => {
  try {
    const projects = await all(`
      SELECT p.*, u.name as creator_name, u.institution as creator_institution, par.status as participation_status
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      JOIN participations par ON par.project_id = p.id
      WHERE par.user_id = ?
      ORDER BY par.created_at DESC
    `, [req.user.id]);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个项目详情
router.get('/:id', async (req, res) => {
  try {
    const project = await get(`
      SELECT p.*, u.name as creator_name, u.institution as creator_institution,
        (SELECT COUNT(*) FROM participations WHERE project_id = p.id) as participant_count
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建项目（仅科学家）
router.post('/', authMiddleware, scientistOnly, async (req, res) => {
  try {
    const { title, description, category, requirements, location } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: '请填写项目标题、描述和分类' });
    }

    const result = await run(
      'INSERT INTO projects (title, description, category, requirements, location, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, category, requirements || '', location || '', req.user.id]
    );

    const project = await get(`
      SELECT p.*, u.name as creator_name, u.institution as creator_institution
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `, [result.lastID]);

    res.status(201).json({ message: '项目创建成功', project });
  } catch (err) {
    console.error('创建项目错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新项目（仅创建者）
router.put('/:id', authMiddleware, scientistOnly, async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    if (project.creator_id !== req.user.id) {
      return res.status(403).json({ error: '只能修改自己创建的项目' });
    }

    const { title, description, category, requirements, location, status } = req.body;
    await run(
      `UPDATE projects SET title = ?, description = ?, category = ?, requirements = ?, location = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        title || project.title,
        description || project.description,
        category || project.category,
        requirements || project.requirements,
        location || project.location,
        status || project.status,
        req.params.id
      ]
    );

    const updated = await get(`
      SELECT p.*, u.name as creator_name, u.institution as creator_institution
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    res.json({ message: '项目更新成功', project: updated });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除项目（仅创建者）
router.delete('/:id', authMiddleware, scientistOnly, async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }
    if (project.creator_id !== req.user.id) {
      return res.status(403).json({ error: '只能删除自己创建的项目' });
    }

    await run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: '项目已删除' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 参与项目
router.post('/:id/participate', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const project = await get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    const existing = await get(
      'SELECT * FROM participations WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    );
    if (existing) {
      return res.status(400).json({ error: '您已参与此项目' });
    }

    await run(
      'INSERT INTO participations (user_id, project_id, status) VALUES (?, ?, ?)',
      [userId, projectId, 'active']
    );
    res.json({ message: '参与成功' });
  } catch (err) {
    console.error('参与项目错误:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 取消参与
router.delete('/:id/participate', authMiddleware, async (req, res) => {
  try {
    const result = await run(
      'DELETE FROM participations WHERE user_id = ? AND project_id = ?',
      [req.user.id, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到参与记录' });
    }
    res.json({ message: '已取消参与' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;