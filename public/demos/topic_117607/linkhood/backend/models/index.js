const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool
  }
);

const User = require('./User')(sequelize, DataTypes);
const Circle = require('./Circle')(sequelize, DataTypes);
const CircleMember = require('./CircleMember')(sequelize, DataTypes);
const Need = require('./Need')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const Activity = require('./Activity')(sequelize, DataTypes);
const Feedback = require('./Feedback')(sequelize, DataTypes);
const AuthRecord = require('./AuthRecord')(sequelize, DataTypes);
const Comment = require('./Comment')(sequelize, DataTypes);

// 关联关系
User.belongsToMany(Circle, { through: CircleMember, foreignKey: 'userId', as: 'circles' });
Circle.belongsToMany(User, { through: CircleMember, foreignKey: 'circleId', as: 'members' });

Circle.hasMany(CircleMember, { foreignKey: 'circleId', as: 'circleMembers' });
CircleMember.belongsTo(Circle, { foreignKey: 'circleId' });
CircleMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Need, { foreignKey: 'publisherId', as: 'needs' });
Need.belongsTo(User, { foreignKey: 'publisherId', as: 'publisher' });

Circle.hasMany(Need, { foreignKey: 'circleId', as: 'needs' });
Need.belongsTo(Circle, { foreignKey: 'circleId', as: 'circle' });

User.hasMany(Order, { foreignKey: 'buyerId', as: 'ordersAsBuyer' });
User.hasMany(Order, { foreignKey: 'sellerId', as: 'ordersAsSeller' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Order.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Order.belongsTo(Need, { foreignKey: 'needId', as: 'need' });

User.hasMany(Activity, { foreignKey: 'organizerId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });
Circle.hasMany(Activity, { foreignKey: 'circleId', as: 'activities' });
Activity.belongsTo(Circle, { foreignKey: 'circleId', as: 'circle' });

User.hasMany(Feedback, { foreignKey: 'publisherId', as: 'feedbacks' });
Feedback.belongsTo(User, { foreignKey: 'publisherId', as: 'publisher' });
Circle.hasMany(Feedback, { foreignKey: 'circleId', as: 'feedbacks' });
Feedback.belongsTo(Circle, { foreignKey: 'circleId', as: 'circle' });

User.hasMany(AuthRecord, { foreignKey: 'userId', as: 'authRecords' });
AuthRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Need.hasMany(Comment, { foreignKey: 'needId', as: 'comments' });
Comment.belongsTo(Need, { foreignKey: 'needId' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Circle,
  CircleMember,
  Need,
  Order,
  Activity,
  Feedback,
  AuthRecord,
  Comment
};
