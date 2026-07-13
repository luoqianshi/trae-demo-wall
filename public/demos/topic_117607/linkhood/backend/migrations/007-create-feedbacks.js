'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('feedbacks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      boosts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      progress: {
        type: Sequelize.STRING(100),
        defaultValue: '征集中'
      },
      status: {
        type: Sequelize.ENUM('open', 'processing', 'resolved', 'closed'),
        defaultValue: 'open'
      },
      circleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'circles', key: 'id' },
        onDelete: 'CASCADE'
      },
      publisherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('feedbacks', ['status']);
    await queryInterface.addIndex('feedbacks', ['circleId']);
    await queryInterface.addIndex('feedbacks', ['boosts']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('feedbacks');
  }
};
