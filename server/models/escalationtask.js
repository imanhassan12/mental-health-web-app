'use strict';
module.exports = (sequelize, DataTypes) => {
  const EscalationTask = sequelize.define('EscalationTask', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alertId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: 'high'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'open'
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  EscalationTask.associate = (models) => {
    EscalationTask.belongsTo(models.Alert, { foreignKey: 'alertId', as: 'alert' });
    EscalationTask.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
  };

  return EscalationTask;
}; 