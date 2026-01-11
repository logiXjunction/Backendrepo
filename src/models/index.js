const sequelize = require('../config/database'); 
const { DataTypes } = require('sequelize');

const Transporter = require('./transporter');
const Vehicle = require('./vehicle');
const Driver = require('./driver');
const Document = require('./document');
const Coverage = require('./coverage')
const Ftl = require('./ftl')
const Quotation = require('./quotation')



const Client = require('./client')


Driver.belongsTo(Transporter, {foreignKey: 'transporterId'})
Transporter.hasMany(Driver, {foreignKey: 'transporterId'})

Transporter.hasMany(Vehicle, { foreignKey: 'transporterId' });
Vehicle.belongsTo(Transporter, { foreignKey: 'transporterId' });

Transporter.hasOne(Document, { foreignKey: 'transporterId' });
Document.belongsTo(Transporter, { foreignKey: 'transporterId' });

Transporter.hasOne(Coverage, {foreignKey:  'transporterId'});
Coverage.belongsTo(Transporter, { foreignKey: 'transporterId'})

Ftl.belongsTo(Client, {foreignKey:'clientId'});
Client.hasMany(Client, {foreignKey: 'clientId'});

Quotation.belongsTo(Ftl, {foreignKey:'FtlId'} );
Ftl.hasMany(Quotation, {foreignKey: 'FtlId'})

const models = {
  Transporter,
  Vehicle,
  Driver,
  Document,
  Coverage,
  Client,
  Ftl
};

module.exports = models;
