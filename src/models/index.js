const sequelize = require('../config/database'); // initialized instance
const { DataTypes } = require('sequelize');

const Transporter = require('./transporter');
const Vehicle = require('./vehicle');

Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

const models = {
  Transporter,
  Vehicle,
};

module.exports = models;
