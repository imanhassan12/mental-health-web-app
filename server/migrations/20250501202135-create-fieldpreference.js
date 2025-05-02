'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FieldPreferences', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      practitionerId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fields: {
        type: Sequelize.JSON,
        allowNull: false
      },
      scope: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'user'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FieldPreferences');
  }
}; 