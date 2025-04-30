'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Alerts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Clients',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      severity: {
        type: Sequelize.STRING,
        defaultValue: 'critical'
      },
      acknowledged: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      acknowledgedBy: {
        type: Sequelize.UUID,
        allowNull: true
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sessionNoteId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'SessionNotes',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Alerts');
  }
}; 