// 社区路由模块
// 提供社区动态流、帖子、评论、点赞、关注等社区功能

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authRequired } = require('../middleware/auth');

// 所有社区接口都需要登录
router.use(authRequired);

/**
 * 将数据库帖子行格式化为返回给前端的对象
 * 关联查询作者、关联记录、当前用户是否点赞
 * @param {object} row - 数据库帖子行（需包含作者信息字段）
 * @param {number} currentUserId - 当前登录用户 ID
 * @returns {object} 格式化后的帖子对象
 */
function formatPost(row, currentUserId) {
  if (!row) return null;

  // 处理图片路径，加上 /uploads/ 前缀
  let imagePath = row.image_path;
  if (imagePath && !imagePath.startsWith('/uploads/')) {
    imagePath = `/uploads/${imagePath}`;
  }

  // 构造作者信息
  const author = {
    id: row.author_id,
    username: row.author_username
  };

  // 构造关联记录信息（如果有）
  let record = null;
  if (row.record_id) {
    record = {
      id: row.record_id,
      dishName: row.record_dish_name,
      emoji: row.record_emoji,
      date: row.record_date
    };
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    imagePath,
    createdAt: row.created_at,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    author,
    liked: !!row.liked,
    record
  };
}

/**
 * 构造帖子列表查询 SQL（带作者、关联记录、当前用户点赞状态）
 * @param {string} whereClause - WHERE 子句（不含 WHERE 关键字）
 * @param {array} params - SQL 参数
 * @param {number} currentUserId - 当前用户 ID
 * @returns {object} { sql, params }
 */
function buildPostListQuery(whereClause, params, currentUserId) {
  const sql = `
    SELECT
      p.id, p.title, p.content, p.image_path, p.record_id,
      p.likes_count, p.comments_count, p.created_at,
      u.id AS author_id, u.username AS author_username,
      r.dish_name AS record_dish_name, r.emoji AS record_emoji, r.date AS record_date,
      (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
    FROM posts p
    INNER JOIN users u ON p.user_id = u.id
    LEFT JOIN records r ON p.record_id = r.id
    ${whereClause ? `WHERE ${whereClause}` : ''}
    ORDER BY p.created_at DESC
  `;
  // 当前用户 ID 作为 liked 子查询的参数，放在最前面
  return { sql, params: [currentUserId, ...params] };
}

/**
 * 构造热门帖子查询 SQL（按点赞数排序）
 * @param {number} currentUserId - 当前用户 ID
 * @returns {object} { sql, params }
 */
function buildHotPostListQuery(currentUserId) {
  const sql = `
    SELECT
      p.id, p.title, p.content, p.image_path, p.record_id,
      p.likes_count, p.comments_count, p.created_at,
      u.id AS author_id, u.username AS author_username,
      r.dish_name AS record_dish_name, r.emoji AS record_emoji, r.date AS record_date,
      (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
    FROM posts p
    INNER JOIN users u ON p.user_id = u.id
    LEFT JOIN records r ON p.record_id = r.id
    ORDER BY p.likes_count DESC, p.created_at DESC
    LIMIT 5
  `;
  return { sql, params: [currentUserId] };
}

/**
 * 1. GET /feed - 获取社区动态流
 * Query: page=1&limit=10
 * 返回所有用户的帖子，按时间倒序，带分页
 */
router.get('/feed', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    // 查询总数
    const totalRow = db.prepare('SELECT COUNT(*) AS total FROM posts').get();
    const total = totalRow ? totalRow.total : 0;

    // 查询当前页帖子
    const { sql, params } = buildPostListQuery('', [], currentUserId);
    const rows = db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const posts = rows.map((row) => formatPost(row, currentUserId));

    res.json({
      success: true,
      data: {
        posts,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 2. GET /hot - 获取热门帖子
 * 返回点赞数最高的5条帖子
 */
router.get('/hot', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { sql, params } = buildHotPostListQuery(currentUserId);
    const rows = db.prepare(sql).all(...params);
    const posts = rows.map((row) => formatPost(row, currentUserId));

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 3. POST /posts - 发布帖子
 * Body: {title, content, imagePath, recordId}
 * 返回新创建的帖子
 */
router.post('/posts', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { title, content, imagePath, recordId } = req.body;

    // 校验必填字段
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: '帖子标题不能为空'
      });
    }

    // 如果传了 recordId，校验记录是否存在且属于当前用户
    if (recordId) {
      const record = db
        .prepare('SELECT id FROM records WHERE id = ? AND user_id = ?')
        .get(recordId, currentUserId);
      if (!record) {
        return res.status(400).json({
          success: false,
          message: '关联的美食记录不存在或无权访问'
        });
      }
    }

    // 插入帖子
    const result = db
      .prepare(
        `INSERT INTO posts (user_id, title, content, image_path, record_id)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        currentUserId,
        title.trim(),
        content || null,
        imagePath || null,
        recordId || null
      );

    // 查询并返回新创建的帖子（带作者、关联记录、点赞状态）
    const { sql, params } = buildPostListQuery('p.id = ?', [result.lastInsertRowid], currentUserId);
    const row = db.prepare(sql).get(...params);

    res.status(201).json({
      success: true,
      data: formatPost(row, currentUserId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 4. GET /posts/:id - 获取单个帖子详情
 * 包含作者信息、关联记录、当前用户是否点赞
 */
router.get('/posts/:id', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id } = req.params;

    const { sql, params } = buildPostListQuery('p.id = ?', [id], currentUserId);
    const row = db.prepare(sql).get(...params);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    res.json({
      success: true,
      data: formatPost(row, currentUserId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 5. DELETE /posts/:id - 删除帖子（只能删自己的）
 * 同时删除关联的评论和点赞
 */
router.delete('/posts/:id', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id } = req.params;

    // 校验帖子存在且属于当前用户
    const post = db
      .prepare('SELECT id FROM posts WHERE id = ? AND user_id = ?')
      .get(id, currentUserId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在或无权删除'
      });
    }

    // 删除帖子（评论和点赞通过外键 ON DELETE CASCADE 自动删除）
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '帖子已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 6. GET /posts/:id/comments - 获取帖子的评论列表
 * 每条评论包含: id, content, createdAt, author{id, username}
 */
router.get('/posts/:id/comments', (req, res) => {
  try {
    const { id } = req.params;

    // 校验帖子存在
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const rows = db
      .prepare(
        `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.username AS author_username
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`
      )
      .all(id);

    const comments = rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      author: {
        id: row.author_id,
        username: row.author_username
      }
    }));

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 7. POST /posts/:id/comments - 发表评论
 * Body: {content}
 * 更新帖子的 comments_count
 */
router.post('/posts/:id/comments', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id } = req.params;
    const { content } = req.body;

    // 校验内容
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    // 校验帖子存在
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 使用事务：插入评论 + 更新帖子评论数
    const insertComment = db.prepare(
      `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`
    );
    const updateCount = db.prepare(
      `UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?) WHERE id = ?`
    );

    const result = db.transaction(() => {
      const r = insertComment.run(id, currentUserId, content.trim());
      updateCount.run(id, id);
      return r;
    })();

    // 查询新创建的评论
    const row = db
      .prepare(
        `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.username AS author_username
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        author: {
          id: row.author_id,
          username: row.author_username
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 8. DELETE /comments/:id - 删除评论（只能删自己的）
 */
router.delete('/comments/:id', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id } = req.params;

    // 校验评论存在且属于当前用户
    const comment = db
      .prepare('SELECT id, post_id FROM comments WHERE id = ? AND user_id = ?')
      .get(id, currentUserId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或无权删除'
      });
    }

    // 使用事务：删除评论 + 更新帖子评论数
    const deleteComment = db.prepare('DELETE FROM comments WHERE id = ?');
    const updateCount = db.prepare(
      `UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?) WHERE id = ?`
    );

    db.transaction(() => {
      deleteComment.run(id);
      updateCount.run(comment.post_id, comment.post_id);
    })();

    res.json({
      success: true,
      message: '评论已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 9. POST /posts/:id/like - 点赞/取消点赞（toggle）
 * 如果已点赞则取消，未点赞则添加
 * 更新帖子的 likes_count
 * 返回 {liked: bool, likesCount: number}
 */
router.post('/posts/:id/like', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id } = req.params;

    // 校验帖子存在
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 检查是否已点赞
    const existing = db
      .prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?')
      .get(id, currentUserId);

    const insertLike = db.prepare(
      `INSERT INTO likes (post_id, user_id) VALUES (?, ?)`
    );
    const deleteLike = db.prepare(
      `DELETE FROM likes WHERE post_id = ? AND user_id = ?`
    );
    const updateCount = db.prepare(
      `UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?`
    );

    let liked;
    db.transaction(() => {
      if (existing) {
        // 已点赞，取消点赞
        deleteLike.run(id, currentUserId);
        liked = false;
      } else {
        // 未点赞，添加点赞
        insertLike.run(id, currentUserId);
        liked = true;
      }
      // 更新帖子的点赞数
      updateCount.run(id, id);
    })();

    // 查询最新的点赞数
    const updatedPost = db.prepare('SELECT likes_count FROM posts WHERE id = ?').get(id);

    res.json({
      success: true,
      data: {
        liked,
        likesCount: updatedPost ? updatedPost.likes_count : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 10. POST /follow/:userId - 关注用户
 * 不能关注自己
 * 返回 {following: true}
 */
router.post('/follow/:userId', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);

    // 不能关注自己
    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    // 校验目标用户存在
    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 插入关注关系（UNIQUE 约束会防止重复关注，使用 INSERT OR IGNORE 忽略重复）
    db.prepare(
      `INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`
    ).run(currentUserId, targetUserId);

    res.json({
      success: true,
      data: { following: true }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 11. DELETE /follow/:userId - 取消关注
 * 返回 {following: false}
 */
router.delete('/follow/:userId', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);

    db.prepare(
      `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`
    ).run(currentUserId, targetUserId);

    res.json({
      success: true,
      data: { following: false }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 12. GET /users/:userId/posts - 获取指定用户的帖子
 * 同 feed 格式
 */
router.get('/users/:userId/posts', (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = parseInt(req.params.userId, 10);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;

    // 校验目标用户存在
    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 查询总数
    const totalRow = db
      .prepare('SELECT COUNT(*) AS total FROM posts WHERE user_id = ?')
      .get(targetUserId);
    const total = totalRow ? totalRow.total : 0;

    // 查询帖子
    const { sql, params } = buildPostListQuery('p.user_id = ?', [targetUserId], currentUserId);
    const rows = db.prepare(`${sql} LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const posts = rows.map((row) => formatPost(row, currentUserId));

    res.json({
      success: true,
      data: {
        posts,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 13. GET /profile - 获取当前用户的社区资料
 * 返回: {postCount, followerCount, followingCount, likeCount(收到的总点赞)}
 */
router.get('/profile', (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // 帖子数
    const postCountRow = db
      .prepare('SELECT COUNT(*) AS count FROM posts WHERE user_id = ?')
      .get(currentUserId);
    const postCount = postCountRow ? postCountRow.count : 0;

    // 粉丝数（被关注数）
    const followerCountRow = db
      .prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?')
      .get(currentUserId);
    const followerCount = followerCountRow ? followerCountRow.count : 0;

    // 关注数
    const followingCountRow = db
      .prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?')
      .get(currentUserId);
    const followingCount = followingCountRow ? followingCountRow.count : 0;

    // 收到的总点赞数（自己所有帖子被点赞的总和）
    const likeCountRow = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM likes l
         INNER JOIN posts p ON l.post_id = p.id
         WHERE p.user_id = ?`
      )
      .get(currentUserId);
    const likeCount = likeCountRow ? likeCountRow.count : 0;

    res.json({
      success: true,
      data: {
        postCount,
        followerCount,
        followingCount,
        likeCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
