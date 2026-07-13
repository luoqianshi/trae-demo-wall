const express = require('express');
const { Order, Need, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

function generateOrderNo() {
  return 'LH' + Date.now() + Math.floor(Math.random() * 1000);
}

// 创建订单（接受需求）
router.post('/', authenticate, async (req, res) => {
  try {
    const { needId, meetLocation, meetTime, message } = req.body;
    const need = await Need.findByPk(needId, { include: [{ model: User, as: 'publisher' }] });
    if (!need) return res.status(404).json({ success: false, message: '需求不存在' });
    if (need.publisherId === req.user.id) {
      return res.status(400).json({ success: false, message: '不能接受自己的需求' });
    }

    // 提取金额
    let amount = 0;
    const match = need.price?.match(/[\d.]+/);
    if (match) amount = parseFloat(match[0]);
    if (isNaN(amount)) amount = 0;

    // 解析交易时间
    let parsedMeetTime = null;
    if (meetTime) {
      const d = new Date(meetTime);
      parsedMeetTime = isNaN(d.getTime()) ? null : d;
    }

    const order = await Order.create({
      orderNo: generateOrderNo(),
      needId,
      buyerId: req.user.id,
      sellerId: need.publisherId,
      amount,
      status: 'pending_pay',
      meetLocation,
      meetTime: parsedMeetTime
    });

    await need.update({ status: 'pending' });
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('创建订单失败:', err.message);
    res.status(500).json({ success: false, message: '创建订单失败', error: err.message });
  }
});

// 获取我的订单
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, role } = req.query;
    const where = {};
    if (status) where.status = status;
    if (role === 'buyer') where.buyerId = req.user.id;
    else if (role === 'seller') where.sellerId = req.user.id;
    else {
      where[require('sequelize').Op.or] = [
        { buyerId: req.user.id },
        { sellerId: req.user.id }
      ];
    }
    const orders = await Order.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Need, as: 'need', attributes: ['id', 'title', 'category', 'price'] },
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar'] }
      ]
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取订单失败', error: err.message });
  }
});

// 获取订单详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Need, as: 'need' },
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'avatar', 'creditScore'] },
        { model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar', 'creditScore'] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权查看此订单' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取订单详情失败', error: err.message });
  }
});

// 更新订单状态
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, comment, rating } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权操作此订单' });
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (order.buyerId === req.user.id) {
        updateData.buyerComment = comment;
        updateData.buyerRating = rating;
      } else {
        updateData.sellerComment = comment;
        updateData.sellerRating = rating;
      }
    }
    if (status === 'pending_pay' && order.buyerId === req.user.id) {
      updateData.paidAt = new Date();
    }

    await order.update(updateData);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新订单失败', error: err.message });
  }
});

module.exports = router;
