'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Thread extends Model {
    static associate(models) {
      Thread.hasMany(models.ThreadParticipant, { foreignKey: 'threadId', as: 'participants' });
      Thread.hasMany(models.Message, { foreignKey: 'threadId', as: 'messages' });
      Thread.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
    }
  }
  Thread.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Thread',
  });
  return Thread;
}; 