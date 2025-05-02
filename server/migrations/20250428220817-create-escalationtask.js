'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('EscalationTasks', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      alertId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Alerts', key: 'id' },
        onDelete: 'CASCADE'
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Clients', key: 'id' },
        onDelete: 'CASCADE'
      },
      assigneeId: { type: Sequelize.UUID },
      priority: { type: Sequelize.STRING, defaultValue: 'high' },
      dueDate: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING, defaultValue: 'open' },
      comments: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('EscalationTasks');
  }
}; 