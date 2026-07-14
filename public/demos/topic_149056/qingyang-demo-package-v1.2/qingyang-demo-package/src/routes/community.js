const express = require('express');
const { db } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

/**
 * POST /api/v1/community/profiles
 * 创建匿名身份
 */
router.post('/profiles', (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname } = req.body;

    // 检查是否已有匿名身份
    const existing = db.prepare('SELECT * FROM community_profiles WHERE user_id = ?').get(userId);
    if (existing) {
      return res.json({
        code: 0,
        message: '已有匿名身份',
        data: existing
      });
    }

    // 生成随机种子用于头像
    const avatarSeed = `user_${userId}_${Date.now()}`;
    const defaultNickname = nickname || `养生达人${Math.floor(Math.random() * 9000 + 1000)}`;

    const result = db.prepare(
      'INSERT INTO community_profiles (user_id, nickname, avatar_seed) VALUES (?, ?, ?)'
    ).run(userId, defaultNickname, avatarSeed);

    const profile = db.prepare('SELECT * FROM community_profiles WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      code: 0,
      message: '匿名身份创建成功',
      data: profile
    });
  } catch (err) {
    console.error('[Community] 创建匿名身份失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * GET /api/v1/community/posts
 * 获取社区帖子列表
 */
router.get('/posts', (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const total = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;

    const posts = db.prepare(`
      SELECT p.*, cp.nickname, cp.avatar_seed
      FROM posts p
      JOIN community_profiles cp ON p.profile_id = cp.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    // 获取每个帖子的评论数
    const postsWithCommentCount = posts.map(post => {
      const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?')
        .get(post.id).count;
      return {
        ...post,
        comment_count: commentCount
      };
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        posts: postsWithCommentCount
      }
    });
  } catch (err) {
    console.error('[Community] 获取帖子列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * POST /api/v1/community/posts
 * 发帖
 */
router.post('/posts', (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ code: 400, message: '帖子内容不能为空', data: null });
    }

    if (content.length > 2000) {
      return res.status(400).json({ code: 400, message: '帖子内容不能超过2000字', data: null });
    }

    // 获取用户的社区身份
    let profile = db.prepare('SELECT * FROM community_profiles WHERE user_id = ?').get(userId);
    if (!profile) {
      // 自动创建匿名身份
      const avatarSeed = `user_${userId}_${Date.now()}`;
      const nickname = `养生达人${Math.floor(Math.random() * 9000 + 1000)}`;
      const result = db.prepare(
        'INSERT INTO community_profiles (user_id, nickname, avatar_seed) VALUES (?, ?, ?)'
      ).run(userId, nickname, avatarSeed);
      profile = db.prepare('SELECT * FROM community_profiles WHERE id = ?').get(result.lastInsertRowid);
    }

    // 插入帖子
    const result = db.prepare(
      'INSERT INTO posts (profile_id, content) VALUES (?, ?)'
    ).run(profile.id, content.trim());

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

    // 发帖奖励积分
    db.prepare('INSERT INTO point_records (user_id, points, event_type) VALUES (?, ?, ?)')
      .run(userId, 2, 'post');

    res.status(201).json({
      code: 0,
      message: '发帖成功',
      data: {
        ...post,
        nickname: profile.nickname,
        avatar_seed: profile.avatar_seed
      }
    });
  } catch (err) {
    console.error('[Community] 发帖失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

/**
 * POST /api/v1/community/posts/:id/comments
 * 评论
 */
router.post('/posts/:id/comments', (req, res) => {
  try {
    const userId = req.user.id;
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ code: 400, message: '评论内容不能为空', data: null });
    }

    if (content.length > 500) {
      return res.status(400).json({ code: 400, message: '评论内容不能超过500字', data: null });
    }

    // 验证帖子存在
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ code: 404, message: '帖子不存在', data: null });
    }

    // 获取用户的社区身份
    let profile = db.prepare('SELECT * FROM community_profiles WHERE user_id = ?').get(userId);
    if (!profile) {
      const avatarSeed = `user_${userId}_${Date.now()}`;
      const nickname = `养生达人${Math.floor(Math.random() * 9000 + 1000)}`;
      const result = db.prepare(
        'INSERT INTO community_profiles (user_id, nickname, avatar_seed) VALUES (?, ?, ?)'
      ).run(userId, nickname, avatarSeed);
      profile = db.prepare('SELECT * FROM community_profiles WHERE id = ?').get(result.lastInsertRowid);
    }

    // 插入评论
    const result = db.prepare(
      'INSERT INTO comments (post_id, profile_id, content) VALUES (?, ?, ?)'
    ).run(postId, profile.id, content.trim());

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid);

    // 评论奖励积分
    db.prepare('INSERT INTO point_records (user_id, points, event_type) VALUES (?, ?, ?)')
      .run(userId, 1, 'comment');

    res.status(201).json({
      code: 0,
      message: '评论成功',
      data: {
        ...comment,
        nickname: profile.nickname,
        avatar_seed: profile.avatar_seed
      }
    });
  } catch (err) {
    console.error('[Community] 评论失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
  }
});

module.exports = router;
