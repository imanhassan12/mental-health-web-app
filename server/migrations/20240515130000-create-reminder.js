'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Reminders', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Clients', key: 'id' },
        onDelete: 'SET NULL',
      },
      practitionerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Practitioners', key: 'id' },
        onDelete: 'SET NULL',
      },
      alertId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Alerts', key: 'id' },
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('appointment', 'followup', 'custom'),
        allowNull: false,
        defaultValue: 'custom',
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      recurrence: {
        type: Sequelize.ENUM('none', 'daily', 'weekly', 'monthly', 'custom'),
        allowNull: false,
        defaultValue: 'none',
      },
      recurrenceRule: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isDone: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Reminders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Reminders_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Reminders_recurrence";');
  },
}; 