'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MessageAccessLog extends Model {
    static associate(models) {
      MessageAccessLog.belongsTo(models.Message, { foreignKey: 'messageId', as: 'message' });
      MessageAccessLog.belongsTo(models.Practitioner, { foreignKey: 'userId', as: 'user' });
    }
  }
  MessageAccessLog.init({
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
    accessedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'MessageAccessLog',
  });
  return MessageAccessLog;
}; 