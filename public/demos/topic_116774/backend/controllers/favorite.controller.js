const Favorite = require('../models/Favorite');
const Knowledge = require('../models/Knowledge');
const SOP = require('../models/SOP');
const User = require('../models/User');
const response = require('../utils/response');

const getFavorites = async (req, res) => {
  try {
    const { target_type } = req.query;
    const where = { user_id: req.user.id };
    if (target_type) where.target_type = target_type;

    const favorites = await Favorite.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    const result = await Promise.all(
      favorites.map(async (fav) => {
        let target = null;
        if (fav.target_type === 'knowledge') {
          target = await Knowledge.findByPk(fav.target_id, {
            include: [{ model: User, as: 'contributor', attributes: ['real_name', 'department', 'position'] }],
          });
        } else if (fav.target_type === 'sop') {
          target = await SOP.findByPk(fav.target_id, {
            include: [{ model: Knowledge, as: 'knowledge', attributes: ['title', 'type'] }],
          });
        }

        const targetData = target?.toJSON() || {};
        return {
          favorite_id: fav.id,
          target_type: fav.target_type,
          target_id: fav.target_id,
          created_at: fav.created_at,
          ...targetData,
        };
      })
    );

    res.json(response.success({ list: result, total: result.length }, '获取成功'));
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    res.status(500).json(response.internalError('获取收藏列表失败', err.message));
  }
};

const addFavorite = async (req, res) => {
  try {
    const { target_type, target_id } = req.body;

    if (!target_type || !target_id) {
      return res.status(400).json(response.badRequest('缺少必要参数'));
    }

    const existing = await Favorite.findOne({
      where: { user_id: req.user.id, target_type, target_id },
    });

    if (existing) {
      return res.json(response.success(null, '已收藏'));
    }

    await Favorite.create({
      user_id: req.user.id,
      target_type,
      target_id,
    });

    res.json(response.success(null, '收藏成功'));
  } catch (err) {
    console.error('添加收藏失败:', err);
    res.status(500).json(response.internalError('添加收藏失败', err.message));
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const favorite = await Favorite.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!favorite) {
      return res.status(404).json(response.notFound('收藏不存在'));
    }

    await favorite.destroy();

    res.json(response.success(null, '取消收藏成功'));
  } catch (err) {
    console.error('取消收藏失败:', err);
    res.status(500).json(response.internalError('取消收藏失败', err.message));
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };