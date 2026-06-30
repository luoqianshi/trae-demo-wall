// 绘画控制器
const { pool } = require('../config/database');

/**
 * 生成画作（根据用户输入匹配画作模板）
 * POST /api/art/generate
 * body: { user_id, prompt }
 */
async function generateArt(req, res) {
  try {
    const { user_id, prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ code: 400, message: '请输入情绪描述' });
    }
    if (prompt.length > 200) {
      return res.status(400).json({ code: 400, message: '描述超过200字限制' });
    }

    const userId = user_id || 1;

    // 1. 获取所有画作关键词分组
    const [keywords] = await pool.query(
      'SELECT category, keyword FROM art_keywords'
    );

    // 2. 按类别统计匹配数
    const categoryMatchCount = {};
    keywords.forEach(row => {
      if (prompt.includes(row.keyword)) {
        categoryMatchCount[row.category] = (categoryMatchCount[row.category] || 0) + 1;
      }
    });

    // 3. 选择匹配数最多的类别
    let matchedCategory = 'default';
    let maxCount = 0;
    Object.entries(categoryMatchCount).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        matchedCategory = cat;
      }
    });

    // 4. 从该类别中随机选择一个画作模板
    const [templates] = await pool.query(
      'SELECT id, category, image_url, title, description FROM art_templates WHERE category = ? AND is_active = 1 ORDER BY sort_order',
      [matchedCategory]
    );

    if (templates.length === 0) {
      // 回退到默认类别
      const [defaultTemplates] = await pool.query(
        'SELECT id, category, image_url, title, description FROM art_templates WHERE category = ? AND is_active = 1 ORDER BY sort_order',
        ['default']
      );
      if (defaultTemplates.length === 0) {
        return res.status(500).json({ code: 500, message: '未找到画作模板' });
      }
      const idx = Math.floor(Math.random() * defaultTemplates.length);
      const selected = defaultTemplates[idx];

      // 保存用户画作
      await pool.query(
        'INSERT INTO artworks (user_id, prompt, image_url, title, description, category) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, prompt, selected.image_url, selected.title, selected.description, selected.category]
      );

      return res.json({
        code: 0,
        message: 'success',
        data: {
          image_url: selected.image_url,
          title: selected.title,
          description: selected.description,
          category: selected.category
        }
      });
    }

    const selectedIndex = Math.floor(Math.random() * templates.length);
    const selectedTemplate = templates[selectedIndex];

    // 5. 保存用户画作
    await pool.query(
      'INSERT INTO artworks (user_id, prompt, image_url, title, description, category) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, prompt, selectedTemplate.image_url, selectedTemplate.title, selectedTemplate.description, selectedTemplate.category]
    );

    res.json({
      code: 0,
      message: 'success',
      data: {
        image_url: selectedTemplate.image_url,
        title: selectedTemplate.title,
        description: selectedTemplate.description,
        category: selectedTemplate.category
      }
    });
  } catch (error) {
    console.error('生成画作失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

/**
 * 获取用户画作历史
 * GET /api/art/history?user_id=1&limit=20
 */
async function getArtHistory(req, res) {
  try {
    const userId = req.query.user_id || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [rows] = await pool.query(
      'SELECT id, prompt, image_url, title, description, category, created_at FROM artworks WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );

    res.json({ code: 0, message: 'success', data: rows });
  } catch (error) {
    console.error('获取画作历史失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
}

module.exports = { generateArt, getArtHistory };
