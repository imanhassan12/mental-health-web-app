'use strict';
module.exports = (sequelize, DataTypes) => {
  const AlertAuditLog = sequelize.define('AlertAuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alertId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  AlertAuditLog.associate = (models) => {
    AlertAuditLog.belongsTo(models.Alert, { foreignKey: 'alertId', as: 'alert' });
  };

  return AlertAuditLog;
}; 