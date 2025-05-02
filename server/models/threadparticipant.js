'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ThreadParticipant extends Model {
    static associate(models) {
      ThreadParticipant.belongsTo(models.Thread, { foreignKey: 'threadId', as: 'thread' });
      ThreadParticipant.belongsTo(models.Practitioner, { foreignKey: 'practitionerId', as: 'practitioner' });
    }
  }
  ThreadParticipant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    practitionerId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ThreadParticipant',
  });
  return ThreadParticipant;
}; 