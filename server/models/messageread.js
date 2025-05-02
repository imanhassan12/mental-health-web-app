'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MessageRead extends Model {
    static associate(models) {
      MessageRead.belongsTo(models.Message, { foreignKey: 'messageId', as: 'message' });
      MessageRead.belongsTo(models.Practitioner, { foreignKey: 'userId', as: 'user' });
    }
  }
  MessageRead.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'MessageRead',
  });
  return MessageRead;
}; 