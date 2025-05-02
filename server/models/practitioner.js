'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Practitioner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Practitioner.hasMany(models.Appointment, {
        foreignKey: 'practitionerId',
        as: 'appointments'
      });
      Practitioner.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'sentMessages'
      });
      Practitioner.hasMany(models.MessageAccessLog, {
        foreignKey: 'userId',
        as: 'messageAccessLogs'
      });
    }
  }
  Practitioner.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'practitioner',
      validate: {
        isIn: [['admin', 'practitioner', 'viewer']]
      }
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Practitioner',
  });
  return Practitioner;
};