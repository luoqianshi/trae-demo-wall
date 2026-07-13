module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    needId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'needs', key: 'id' }
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending_pay', 'pending_participate', 'pending_review', 'completed', 'cancelled', 'disputed'),
      defaultValue: 'pending_pay',
      comment: '待支付、待参与/待取货、待评价、已完成、已取消、争议中'
    },
    meetLocation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    meetTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    buyerComment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sellerComment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buyerRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    sellerRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['orderNo'] },
      { fields: ['status'] },
      { fields: ['buyerId'] },
      { fields: ['sellerId'] }
    ]
  });

  return Order;
};
