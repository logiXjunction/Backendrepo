const sequelize = require('../config/database'); 
const { DataTypes } = require('sequelize');

const Transporter = require('./transporter');
const Vehicle = require('./vehicle');
const Driver = require('./driver');
const Document = require('./document');
const Coverage = require('./coverage');
const Ftl = require('./ftl');
const Quotation = require('./quotation');
const Client = require('./client');

// --- Transporter Associations ---
Driver.belongsTo(Transporter, { foreignKey: 'transporterId' });
Transporter.hasMany(Driver, { foreignKey: 'transporterId' });

Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

Transporter.hasOne(Document, { foreignKey: 'transporterId' });
Document.belongsTo(Transporter, { foreignKey: 'transporterId' });

Transporter.hasOne(Coverage, { foreignKey: 'transporterId' });
Coverage.belongsTo(Transporter, { foreignKey: 'transporterId' });

// --- Client & FTL Associations ---
Ftl.belongsTo(Client, { foreignKey: 'clientId', as: 'owner' });
Client.hasMany(Ftl, { foreignKey: 'clientId', as: 'shipments' });

// --- FTL & Quotation Associations ---
Quotation.belongsTo(Ftl, { foreignKey: 'FtlId', as: 'shipment' });
Ftl.hasMany(Quotation, { foreignKey: 'FtlId', as: 'quotes' });

Quotation.belongsTo(Transporter, { foreignKey: 'transporterId', as: 'transporter' });
Transporter.hasMany(Quotation, { foreignKey: 'transporterId', as: 'quotes' });

const models = {
  Transporter,
  Vehicle,
  Driver,
  Document,
  Coverage,
  Client,
  Ftl,
  Quotation
};

module.exports = models;