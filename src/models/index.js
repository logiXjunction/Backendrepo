const sequelize = require('../config/database'); 
const { DataTypes } = require('sequelize');

const Transporter = require('./transporter');
const Vehicle = require('./vehicle');
const Driver = require('./driver')

Driver.belongsTo(Transporter, {foreignKey: 'transporterId'})
Transporter.hasMany(Driver, {foreignKey: 'transporterId'})


Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

const models = {
  Transporter,
  Vehicle,
  Driver
};

module.exports = models;
