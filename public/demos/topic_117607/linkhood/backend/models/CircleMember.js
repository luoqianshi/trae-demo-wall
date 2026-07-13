module.exports = (sequelize, DataTypes) => {
  const CircleMember = sequelize.define('CircleMember', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    circleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'circles', key: 'id' }
    },
    role: {
      type: DataTypes.ENUM('member', 'admin', 'owner'),
      defaultValue: 'member'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'approved'
    },
    applyReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'circle_members',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'circleId'], unique: true },
      { fields: ['status'] }
    ]
  });

  return CircleMember;
};
