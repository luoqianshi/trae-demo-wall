'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activities', {
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
      type: {
        type: Sequelize.ENUM('sports', 'culture', 'game', 'other'),
        allowNull: false
      },
      eventTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      maxPeople: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      enrolledCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      fee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'ongoing', 'ended', 'cancelled'),
        defaultValue: 'upcoming'
      },
      circleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'circles', key: 'id' },
        onDelete: 'CASCADE'
      },
      organizerId: {
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
    await queryInterface.addIndex('activities', ['status']);
    await queryInterface.addIndex('activities', ['circleId']);
    await queryInterface.addIndex('activities', ['eventTime']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('activities');
  }
};
