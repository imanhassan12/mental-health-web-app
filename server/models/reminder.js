const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Reminder extends Model {
    static associate(models) {
      Reminder.belongsTo(models.Client, { foreignKey: 'clientId' });
      Reminder.belongsTo(models.Practitioner, { foreignKey: 'practitionerId' });
      Reminder.belongsTo(models.Alert, { foreignKey: 'alertId' });
    }
  }
  Reminder.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    practitionerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    alertId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('appointment', 'followup', 'custom'),
      allowNull: false,
      defaultValue: 'custom',
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    recurrence: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'custom'),
      allowNull: false,
      defaultValue: 'none',
    },
    recurrenceRule: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Reminder',
    tableName: 'Reminders',
  });
  return Reminder;
}; 