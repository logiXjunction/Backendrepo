const sequelize = require('../config/database'); // initialized instance
const { DataTypes } = require('sequelize');
// ----------------------------------------

// Import models
const Client = require('./client');
const Ftl = require('./ftl');
// -------------------------------------
const Transporter = require('./transporter');
const Vehicle = require('./vehicle');
// ---------------------------------------------
// Client ↔ FTL (Shipments)
Client.hasMany(Ftl, { foreignKey: 'clientId' });
Ftl.belongsTo(Client, { foreignKey: 'clientId' });
// -----------------------------------------------------

// Packers & Movers requests (Client optional)
const PackersRequest = require('./packersRequest');
Client.hasMany(PackersRequest, { foreignKey: 'clientId' });
PackersRequest.belongsTo(Client, { foreignKey: 'clientId' });

// PTL lead / request (Client optional)
const PtlRequest = require('./ptlRequest');
Client.hasMany(PtlRequest, { foreignKey: 'clientId' });
PtlRequest.belongsTo(Client, { foreignKey: 'clientId' });

Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

const models = {
  // --------
  Client,
  Ftl,
  // ---------
  PackersRequest,
  PtlRequest,
  Transporter,
  Vehicle,
};

module.exports = models;
