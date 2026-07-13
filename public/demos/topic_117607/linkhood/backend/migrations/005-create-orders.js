'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderNo: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      needId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'needs', key: 'id' },
        onDelete: 'CASCADE'
      },
      buyerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      sellerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending_pay', 'pending_participate', 'pending_review', 'completed', 'cancelled', 'disputed'),
        defaultValue: 'pending_pay'
      },
      meetLocation: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      meetTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      buyerComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sellerComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      buyerRating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sellerRating: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('orders', ['orderNo']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['buyerId']);
    await queryInterface.addIndex('orders', ['sellerId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  }
};
