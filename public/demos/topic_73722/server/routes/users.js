const express = require('express');
const { run, get } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取用户公开信息
router.get('/:id', async (req, res) => {
  try {
    const user = await get(
      'SELECT id, name, role, institution, bio, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新个人资料
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, institution, bio } = req.body;
    await run(
      'UPDATE users SET name = ?, institution = ?, bio = ? WHERE id = ?',
      [name, institution || '', bio || '', req.user.id]
    );
    res.json({ message: '资料更新成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;