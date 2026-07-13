module.exports = (sequelize, DataTypes) => {
  const AuthRecord = sequelize.define('AuthRecord', {
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
    type: {
      type: DataTypes.ENUM('real_name', 'industry', 'community', 'university'),
      allowNull: false,
      comment: '实名、行业、小区、大学认证'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    certNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '证件/资质编号'
    },
    materials: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '上传材料URL列表'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '行业类型（行业认证用）'
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '审核人ID'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'auth_records',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['status'] }
    ]
  });

  return AuthRecord;
};
