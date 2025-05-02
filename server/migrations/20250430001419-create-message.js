"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Messages", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Practitioners", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      threadId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Threads", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      clientId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "Clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    await queryInterface.dropTable("Messages");
  }
}; 