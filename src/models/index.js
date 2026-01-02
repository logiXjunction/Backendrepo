const sequelize = require('../config/database'); 
const { DataTypes } = require('sequelize');

const Transporter = require('./transporter');
const Vehicle = require('./vehicle');
const Driver = require('./driver');
const Document = require('./document');

Driver.belongsTo(Transporter, {foreignKey: 'transporterId'})
Transporter.hasMany(Driver, {foreignKey: 'transporterId'})

Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

Transporter.hasOne(Document, { foreignKey: 'transporterId' });
Document.belongsTo(Transporter, { foreignKey: 'transporterId' });

const models = {
  Transporter,
  Vehicle,
  Driver,
  Document
};

module.exports = models;
