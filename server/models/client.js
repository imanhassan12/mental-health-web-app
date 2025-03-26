'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Client.hasMany(models.Appointment, {
        foreignKey: 'clientId',
        as: 'appointments'
      });
      
      Client.hasMany(models.SessionNote, {
        foreignKey: 'clientId',
        as: 'sessionNotes'
      });
      
      Client.hasMany(models.Goal, {
        foreignKey: 'clientId',
        as: 'goals'
      });
    }
  }
  Client.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Client',
  });
  return Client;
};