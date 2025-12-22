const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PackersRequest = sequelize.define(
    'PackersRequest',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        clientId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'clients', key: 'id' }, field: 'client_id' },

        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: false },

        pickupAddress: { type: DataTypes.TEXT, allowNull: false, field: 'pickup_address' },
        dropoffAddress: { type: DataTypes.TEXT, allowNull: false, field: 'dropoff_address' },

        pickupDate: { type: DataTypes.STRING, allowNull: false, field: 'pickup_date' },
        pickupTime: { type: DataTypes.STRING, allowNull: true, field: 'pickup_time' },

        vehicleType: { type: DataTypes.STRING, allowNull: true, field: 'vehicle_type' },
        estimatedWeight: { type: DataTypes.FLOAT, allowNull: true, field: 'estimated_weight' },
        insurance: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

        items: { type: DataTypes.JSON, allowNull: true },
        images: { type: DataTypes.JSON, allowNull: true },
        additionalNotes: { type: DataTypes.TEXT, allowNull: true, field: 'additional_notes' },

        status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'requested' },
    },
    {
        tableName: 'packers_requests',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = PackersRequest;
