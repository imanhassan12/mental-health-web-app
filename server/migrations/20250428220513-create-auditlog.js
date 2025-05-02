'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AlertAuditLogs', {
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
      action: { type: Sequelize.STRING, allowNull: false },
      actorId: { type: Sequelize.UUID, allowNull: true },
      note: { type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AlertAuditLogs');
  }
}; 