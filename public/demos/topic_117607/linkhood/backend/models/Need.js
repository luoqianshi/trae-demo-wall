module.exports = (sequelize, DataTypes) => {
  const Need = sequelize.define('Need', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('activity', 'idle_item', 'skill_service', 'home_business', 'feedback'),
      allowNull: false,
      comment: '活动、闲置物品、技能服务、居家创业、那些事儿'
    },
    price: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    params: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '物品参数、规格、成色等'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
    },
    boosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'closed', 'pending'),
      defaultValue: 'active'
    },
    circleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'circles', key: 'id' }
    },
    publisherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    distance: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'needs',
    timestamps: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['circleId'] },
      { fields: ['publisherId'] },
      { fields: ['boosts'] }
    ]
  });

  return Need;
};
