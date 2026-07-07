const express = require('express');
const router = express.Router();
const { generateId, requireAuth, requireAdmin } = require('../utils/db');

router.get('/', (req, res) => {
  const db = require('../utils/db').getDb();
  const now = new Date().toISOString();
  
  const products = db.products.map(p => {
    const isStarted = now >= p.seckillStartTime;
    const isEnded = p.status === 'inactive' || p.stock <= 0;
    
    return {
      ...p,
      isStarted,
      isEnded,
      remainingTime: isStarted ? 0 : Math.max(0, new Date(p.seckillStartTime) - new Date())
    };
  });
  
  res.json({ code: 200, data: products });
});

router.get('/:id', (req, res) => {
  const db = require('../utils/db').getDb();
  const product = db.products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  const now = new Date().toISOString();
  product.isStarted = now >= product.seckillStartTime;
  product.isEnded = product.status === 'inactive' || product.stock <= 0;
  product.remainingTime = product.isStarted ? 0 : Math.max(0, new Date(product.seckillStartTime) - new Date());
  
  res.json({ code: 200, data: product });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, cover, stock, seckillStartTime, price, type, description } = req.body;
  
  if (!name || stock === undefined || !seckillStartTime || price === undefined) {
    return res.status(400).json({ code: 400, message: '必填字段缺失' });
  }
  
  const db = require('../utils/db').getDb();
  
  const newProduct = {
    id: generateId('p'),
    name,
    cover: cover || '',
    stock: parseInt(stock),
    originalStock: parseInt(stock),
    seckillStartTime: new Date(seckillStartTime).toISOString(),
    price: parseFloat(price),
    type: type || 'normal',
    status: 'active',
    description: description || '',
    createdAt: new Date().toISOString()
  };
  
  db.products.push(newProduct);
  require('../utils/db').saveDb();
  
  res.json({ code: 200, message: '商品创建成功', data: newProduct });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const product = db.products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  const { name, cover, stock, seckillStartTime, price, type, status, description } = req.body;
  
  if (name !== undefined) product.name = name;
  if (cover !== undefined) product.cover = cover;
  if (stock !== undefined) {
    const diff = parseInt(stock) - product.stock;
    product.stock = parseInt(stock);
    product.originalStock = product.originalStock + diff;
  }
  if (seckillStartTime !== undefined) product.seckillStartTime = new Date(seckillStartTime).toISOString();
  if (price !== undefined) product.price = parseFloat(price);
  if (type !== undefined) product.type = type;
  if (status !== undefined) product.status = status;
  if (description !== undefined) product.description = description;
  
  require('../utils/db').saveDb();
  
  res.json({ code: 200, message: '商品更新成功', data: product });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  db.products.splice(index, 1);
  require('../utils/db').saveDb();
  
  res.json({ code: 200, message: '商品删除成功' });
});

router.put('/:id/status', requireAuth, requireAdmin, (req, res) => {
  const db = require('../utils/db').getDb();
  const product = db.products.find(p => p.id === req.params.id);
  const { status } = req.body;
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ code: 400, message: '状态值无效' });
  }
  
  product.status = status;
  require('../utils/db').saveDb();
  
  res.json({ code: 200, message: `商品已${status === 'active' ? '上架' : '下架'}`, data: product });
});

module.exports = router;
