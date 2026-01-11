const sequelize = require('../config/database.js');
const { DataTypes } = require('sequelize');

const Driver = sequelize.define(
  'Driver',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    driverName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'driver_name',
    },

    driverPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'driver_phone_number',
    },

    transporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'transporter_id',
    },

    driverAadharUpload: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'driver_aadhar_upload',
    },

    driverLicenseUpload: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'driver_license_upload',
    },

    driverPhotoUpload: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'driver_photo_upload',
    },

    status: {
      type: DataTypes.ENUM('verified', 'unverified', 'suspended'),
      allowNull: false,
      defaultValue: 'unverified',
    },
  },
  {
    tableName: 'drivers',
    timestamps: true,
    createdAt: 'created_at',   // ✅ mapped
    updatedAt: 'updated_at',   // ✅ mapped
  }
);

module.exports = Driver;
