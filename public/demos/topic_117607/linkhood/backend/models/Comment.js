module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    needId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'needs', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'comments', key: 'id' },
      comment: '回复评论ID'
    }
  }, {
    tableName: 'comments',
    timestamps: true,
    indexes: [
      { fields: ['needId'] },
      { fields: ['userId'] }
    ]
  });

  return Comment;
};
