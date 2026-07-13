module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define('Activity', {
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
    type: {
      type: DataTypes.ENUM('sports', 'culture', 'game', 'other'),
      allowNull: false,
      comment: '体育、文化棋牌、其他'
    },
    eventTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    maxPeople: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    enrolledCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'ongoing', 'ended', 'cancelled'),
      defaultValue: 'upcoming'
    },
    circleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'circles', key: 'id' }
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    }
  }, {
    tableName: 'activities',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['circleId'] },
      { fields: ['eventTime'] }
    ]
  });

  return Activity;
};
