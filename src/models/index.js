const sequelize = require('../config/database'); 
const { DataTypes } = require('sequelize');

const Transporter = require('./transporter');
const Vehicle = require('./vehicle');
const Driver = require('./driver');
const Document = require('./document');
const Ftl = require("./ftl");
const Client = require("./client");

Driver.belongsTo(Transporter, {foreignKey: 'transporterId'})
Transporter.hasMany(Driver, {foreignKey: 'transporterId'})

Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

Transporter.hasOne(Document, { foreignKey: 'transporterId' });
Document.belongsTo(Transporter, { foreignKey: 'transporterId' });

Ftl.belongsTo(Client, { foreignKey: "clientId" });
Client.hasMany(Ftl, { foreignKey: "clientId" });



const models = {
  Transporter,
  Vehicle,
  Driver,
  Document,
  Ftl,
  Client
};

module.exports = models;
