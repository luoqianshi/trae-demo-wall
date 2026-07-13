module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define('Feedback', {
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
    boosts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    progress: {
      type: DataTypes.STRING(100),
      defaultValue: '征集中',
      comment: '进度状态'
    },
    status: {
      type: DataTypes.ENUM('open', 'processing', 'resolved', 'closed'),
      defaultValue: 'open'
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
    }
  }, {
    tableName: 'feedbacks',
    timestamps: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['circleId'] },
      { fields: ['boosts'] }
    ]
  });

  return Feedback;
};
