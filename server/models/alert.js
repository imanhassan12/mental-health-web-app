'use strict';
module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING,
      defaultValue: 'critical'
    },
    acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    acknowledgedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sessionNoteId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  Alert.associate = (models) => {
    Alert.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return Alert;
}; 