const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');
const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vehicleName: {
    type: DataTypes.STRING,
    field: 'vehicle_name',
    allowNull: false,
  },
  dimension:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacity:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleNumber:{
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'vehicle_number',
  },
  isRefrigerated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_refrigerated',
  },
  bodyType:{
    type: DataTypes.ENUM('open','closed'),
    allowNull: false,
    field: 'body_type',
  },
  rcUrl:{
    type:DataTypes.STRING,
    allownull:false,
    fields:'rc_url',
  },
  roadPermitUrl:{
    type:DataTypes.STRING,
    allownull:false,
    fields:'road_permit_url',
  },
  PollutionCertificateUrl:{
    type:DataTypes.STRING,
    allownull:false,
    fields:'pollution_certificate_url',
  },
  transporterId:{
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: 'transporters',
        key: 'id',
    },
    field: 'transporter_id',
  },
  status:{
    type: DataTypes.ENUM('verified','unverified','suspended'),
    allowNull: false,
    defaultValue: 'inactive',
  }

}, {
    tableName: 'vehicles',
    timestamps: true,
}
)

module.exports = Vehicle;