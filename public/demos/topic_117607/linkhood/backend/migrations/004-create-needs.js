'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('needs', {
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
      category: {
        type: Sequelize.ENUM('activity', 'idle_item', 'skill_service', 'home_business', 'feedback'),
        allowNull: false
      },
      price: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true
      },
      params: {
        type: Sequelize.JSON,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      contact: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true
      },
      boosts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'closed', 'pending'),
        defaultValue: 'active'
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
      distance: {
        type: Sequelize.STRING(50),
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
    await queryInterface.addIndex('needs', ['category']);
    await queryInterface.addIndex('needs', ['status']);
    await queryInterface.addIndex('needs', ['circleId']);
    await queryInterface.addIndex('needs', ['publisherId']);
    await queryInterface.addIndex('needs', ['boosts']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('needs');
  }
};
