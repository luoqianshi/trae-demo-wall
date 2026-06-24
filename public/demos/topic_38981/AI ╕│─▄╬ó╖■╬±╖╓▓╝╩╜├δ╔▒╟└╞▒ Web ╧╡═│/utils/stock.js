const db = require('./db').getDb();

const HOLD_TIMEOUT = 15 * 60 * 1000;
const holdRecords = new Map();

function getProduct(productId) {
  const products = db.products || [];
  return products.find(p => p.id === productId);
}

function getAvailableStock(productId) {
  const product = getProduct(productId);
  if (!product) return 0;
  const holdStock = getHeldStock(productId);
  return Math.max(0, (product.stock || 0) - holdStock);
}

function getHeldStock(productId) {
  let totalHeld = 0;
  holdRecords.forEach((record, key) => {
    if (key.startsWith(`hold_${productId}_`) && !record.released) {
      totalHeld += record.quantity;
    }
  });
  return totalHeld;
}

function generateHoldId(productId, userId) {
  return `hold_${productId}_${userId}_${Date.now()}`;
}

function holdStock(productId, userId, quantity = 1) {
  const product = getProduct(productId);
  if (!product) {
    return { success: false, message: '商品不存在' };
  }

  if (quantity <= 0) {
    return { success: false, message: '预扣数量必须大于0' };
  }

  const available = getAvailableStock(productId);
  if (available < quantity) {
    return { success: false, message: '可用库存不足' };
  }

  const existingHold = findUserHold(productId, userId);
  if (existingHold) {
    return { success: false, message: '您已持有该商品的预扣库存，请勿重复下单' };
  }

  const holdId = generateHoldId(productId, userId);
  const holdRecord = {
    holdId,
    productId,
    userId,
    quantity,
    createdAt: Date.now(),
    expiredAt: Date.now() + HOLD_TIMEOUT,
    released: false,
    orderId: null
  };

  holdRecords.set(holdId, holdRecord);

  setTimeout(() => {
    releaseHold(holdId, 'timeout');
  }, HOLD_TIMEOUT);

  return {
    success: true,
    message: '库存预扣成功',
    holdId,
    expiredAt: holdRecord.expiredAt
  };
}

function findUserHold(productId, userId) {
  for (const [key, record] of holdRecords) {
    if (key.startsWith(`hold_${productId}_${userId}_`) && !record.released) {
      return record;
    }
  }
  return null;
}

function releaseHold(holdId, reason = 'manual') {
  const holdRecord = holdRecords.get(holdId);
  if (!holdRecord || holdRecord.released) {
    return { success: false, message: '预扣记录不存在或已释放' };
  }

  holdRecord.released = true;
  holdRecord.releaseReason = reason;
  holdRecord.releasedAt = Date.now();

  return {
    success: true,
    message: `库存已释放，原因: ${reason}`,
    holdRecord
  };
}

function confirmHold(holdId, orderId) {
  const holdRecord = holdRecords.get(holdId);
  if (!holdRecord || holdRecord.released) {
    return { success: false, message: '预扣记录不存在或已释放' };
  }

  if (Date.now() > holdRecord.expiredAt) {
    releaseHold(holdId, 'expired');
    return { success: false, message: '预扣已过期' };
  }

  const product = getProduct(holdRecord.productId);
  if (!product) {
    releaseHold(holdId, 'product_not_found');
    return { success: false, message: '商品不存在' };
  }

  if (product.stock < holdRecord.quantity) {
    releaseHold(holdId, 'stock_insufficient');
    return { success: false, message: '库存不足' };
  }

  product.stock -= holdRecord.quantity;
  holdRecord.orderId = orderId;
  holdRecord.confirmed = true;

  require('./db').saveDb();

  return {
    success: true,
    message: '库存确认成功',
    holdRecord,
    remainingStock: product.stock
  };
}

function rollbackStock(orderId) {
  for (const [key, record] of holdRecords) {
    if (record.orderId === orderId && record.confirmed) {
      const product = getProduct(record.productId);
      if (product) {
        product.stock += record.quantity;
        require('./db').saveDb();
      }
      record.rolledBack = true;
      return {
        success: true,
        message: '库存回滚成功',
        quantity: record.quantity
      };
    }
  }
  return { success: false, message: '未找到对应的预扣记录' };
}

function getHoldRecord(holdId) {
  return holdRecords.get(holdId);
}

function cleanupExpiredHolds() {
  const now = Date.now();
  holdRecords.forEach((record, key) => {
    if (!record.released && now > record.expiredAt) {
      releaseHold(key, 'timeout_cleanup');
    }
  });
}

setInterval(cleanupExpiredHolds, 60 * 1000);

module.exports = {
  HOLD_TIMEOUT,
  getAvailableStock,
  getHeldStock,
  holdStock,
  releaseHold,
  confirmHold,
  rollbackStock,
  getHoldRecord,
  findUserHold
};