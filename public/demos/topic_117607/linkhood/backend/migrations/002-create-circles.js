'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('circles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('community', 'university', 'friends'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      safetyInfo: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      memberCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      services: {
        type: Sequelize.JSON,
        allowNull: true
      },
      groups: {
        type: Sequelize.JSON,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'pending'),
        defaultValue: 'active'
      },
      verifyType: {
        type: Sequelize.ENUM('location', 'student', 'friend', 'admin'),
        defaultValue: 'admin'
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
    await queryInterface.addIndex('circles', ['type']);
    await queryInterface.addIndex('circles', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('circles');
  }
};
