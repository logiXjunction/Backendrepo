const sequalizeize = require('../config/database.js');
const { DataTypes } = require('sequelize');

const Driver = sequalizeize.define('Driver', {
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
    driverAadharUpload: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'driver_aadhar_upload',
    },
    driverLicenseUpload: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'driver_license_upload',
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
        references: {
            model: 'transporters',
            key: 'id',
        },
        field: 'transporter_id',
    },
    driverPhotoUpload: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'driver_photo_upload',
    },
}, {
    tableName: 'drivers',
    timestamps: false,
});

module.exports = Driver;