const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Consent = sequelize.define('Consent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.STRING, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
  });
  return Consent;
}; 