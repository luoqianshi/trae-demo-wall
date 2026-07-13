module.exports = (sequelize, DataTypes) => {
  const Circle = sequelize.define('Circle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('community', 'university', 'friends'),
      allowNull: false,
      comment: '小区、大学、朋友圈'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    safetyInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '安全信息，如实名率'
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    services: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '服务列表'
    },
    groups: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '微信群列表'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'active'
    },
    verifyType: {
      type: DataTypes.ENUM('location', 'student', 'friend', 'admin'),
      defaultValue: 'admin',
      comment: '验证方式'
    }
  }, {
    tableName: 'circles',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['status'] }
    ]
  });

  return Circle;
};
