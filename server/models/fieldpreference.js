'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FieldPreference extends Model {
    static associate(models) {
      // associations defined in models/index.js
    }
  }
  FieldPreference.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    practitionerId: {
      type: DataTypes.UUID,
      allowNull: true // null = global preference
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false, // 'import' or 'export'
    },
    fields: {
      type: DataTypes.JSON,
      allowNull: false // array of field names
    },
    scope: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user', // 'user' or 'global'
      validate: {
        isIn: [['user', 'global']]
      }
    }
  }, {
    sequelize,
    modelName: 'FieldPreference',
  });
  return FieldPreference;
}; 