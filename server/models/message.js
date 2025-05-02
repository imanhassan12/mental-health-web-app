'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Practitioner, { foreignKey: 'senderId', as: 'sender' });
      Message.belongsTo(models.Thread, { foreignKey: 'threadId', as: 'thread' });
      Message.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      Message.hasMany(models.MessageAccessLog, { foreignKey: 'messageId', as: 'accessLogs' });
    }
  }
  Message.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
}; 