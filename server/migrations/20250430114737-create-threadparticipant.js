"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ThreadParticipants", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      threadId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Threads", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      practitionerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Practitioners", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ThreadParticipants");
  }
}; 