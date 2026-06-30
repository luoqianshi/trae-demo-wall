// AI对话控制器
const { pool } = require('../config/database');

// 内存缓存：避免短时间内重复回复（key: user_id, value: 已用过的回复ID数组）
const recentReplyCache = new Map();
const RECENT_REPLY_LIMIT = 3; // 避免最近3条回复重复

// 内存缓存：用户当前会话上下文（key: user_id+session_id, value: 对话轮数）
const conversationRoundsCache = new Map();

/**
 * 根据用户文本匹配AI场景并返回回复
 * POST /api/chat/reply
 * body: { user_id, session_id, text }
 */
async function getAIReply(req, res) {
  try {
    const { user_id, session_id, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ code: 400, message: '消息内容不能为空' });
    }
    if (text.length > 500) {
      return res.status(400).json({ code: 400, message: '内容超过500字限制' });
    }

    const userId = user_id || 1;
    const sessionId = session_id || `session_${Date.now()}`;

    // 1. 获取所有启用的场景（按优先级降序）
    const [scenes] = await pool.query(
      'SELECT id, scene_key, scene_name, priority, keywords, exclude_keywords FROM ai_scenes WHERE is_active = 1 ORDER BY priority DESC'
    );

    // 2. 场景匹配（按优先级从高到低）
    let matchedScene = null;
    for (const scene of scenes) {
      if (scene.scene_key === 'default') continue; // 默认场景最后兜底

      let keywords = [];
      try {
        keywords = JSON.parse(scene.keywords || '[]');
      } catch (e) {
        keywords = [];
      }

      let excludeKeywords = [];
      try {
        excludeKeywords = JSON.parse(scene.exclude_keywords || '[]');
      } catch (e) {
        excludeKeywords = [];
      }

      // 检查排除关键词
      const isExcluded = excludeKeywords.some(kw => text.includes(kw));
      if (isExcluded) continue;

      // 检查匹配关键词
      const isMatched = keywords.some(kw => text.includes(kw));
      if (isMatched) {
        matchedScene = scene;
        break;
      }
    }

    // 3. 兜底：使用默认场景
    if (!matchedScene) {
      [matchedScene] = await pool.query(
        'SELECT id, scene_key, scene_name, priority, keywords, exclude_keywords FROM ai_scenes WHERE scene_key = ? AND is_active = 1',
        ['default']
      );
      matchedScene = matchedScene[0];
    }

    if (!matchedScene) {
      return res.status(500).json({ code: 500, message: '未找到可用的回复场景' });
    }

    // 4. 获取该场景的所有回复
    const [replies] = await pool.query(
      'SELECT id, content FROM ai_responses WHERE scene_id = ? AND is_active = 1 ORDER BY sort_order',
      [matchedScene.id]
    );

    if (replies.length === 0) {
      return res.status(500).json({ code: 500, message: '该场景暂无回复内容' });
    }

    // 5. 避免重复：排除最近使用过的回复
    const cacheKey = `${userId}_${matchedScene.id}`;
    const recentUsed = recentReplyCache.get(cacheKey) || [];
    let availableReplies = replies.filter(r => !recentUsed.includes(r.id));

    // 如果全部用过，重置缓存
    if (availableReplies.length === 0) {
      availableReplies = replies;
      recentReplyCache.set(cacheKey, []);
    }

    // 6. 随机选择一条回复
    const selectedIndex = Math.floor(Math.random() * availableReplies.length);
    const selectedReply = availableReplies[selectedIndex];

    // 更新缓存
    const newCache = [...(recentReplyCache.get(cacheKey) || []), selectedReply.id];
    if (newCache.length > RECENT_REPLY_LIMIT) {
      newCache.shift();
    }
    recentReplyCache.set(cacheKey, newCache);

    // 7. 追问机制：达到一定轮数后追加追问
    const roundKey = `${userId}_${sessionId}`;
    let currentRounds = conversationRoundsCache.get(roundKey) || 0;
    currentRounds += 1;
    conversationRoundsCache.set(roundKey, currentRounds);

    let finalContent = selectedReply.content;
    if (currentRounds >= 4) {
      const [followups] = await pool.query(
        'SELECT content FROM ai_followups WHERE is_active = 1 AND trigger_rounds <= ? ORDER BY RAND() LIMIT 1',
        [currentRounds]
      );
      if (followups.length > 0 && Math.random() < 0.5) {
        finalContent += followups[0].content;
      }
    }

    // 8. 保存对话记录（用户消息 + AI回复）
    await pool.query(
      'INSERT INTO chat_messages (user_id, session_id, sender, content) VALUES (?, ?, ?, ?)',
      [userId, sessionId, 'user', text]
    );
    await pool.query(
      'INSERT INTO chat_messages (user_id, session_id, sender, content, matched_scene) VALUES (?, ?, ?, ?, ?)',
      [userId, sessionId, 'ai', finalContent, matchedScene.scene_key]
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        reply: finalContent,
        scene: matchedScene.scene_key,
        scene_name: matchedScene.scene_name,
        session_id: sessionId
      }
    });
  } catch (error) {
    console.error('获取AI回复失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

/**
 * 获取对话历史
 * GET /api/chat/history?user_id=1&session_id=xxx&limit=50
 */
async function getChatHistory(req, res) {
  try {
    const userId = req.query.user_id || 1;
    const sessionId = req.query.session_id;
    const limit = parseInt(req.query.limit) || 50;

    let sql = 'SELECT id, sender, content, matched_scene, created_at FROM chat_messages WHERE user_id = ?';
    let params = [userId];

    if (sessionId) {
      sql += ' AND session_id = ?';
      params.push(sessionId);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    // 倒序返回，前端按时间正序展示
    rows.reverse();

    res.json({ code: 0, message: 'success', data: rows });
  } catch (error) {
    console.error('获取对话历史失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

/**
 * 获取用户对话统计
 * GET /api/chat/stats?user_id=1
 */
async function getChatStats(req, res) {
  try {
    const userId = req.query.user_id || 1;
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN sender = "user" THEN 1 ELSE 0 END) as user_count FROM chat_messages WHERE user_id = ?',
      [userId]
    );
    res.json({ code: 0, message: 'success', data: rows[0] });
  } catch (error) {
    console.error('获取对话统计失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

module.exports = { getAIReply, getChatHistory, getChatStats };
