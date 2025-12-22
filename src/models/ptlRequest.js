const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PtlRequest = sequelize.define(
    'PtlRequest',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        clientId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'clients', key: 'id' }, field: 'client_id' },
        name: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'requested' },
    },
    {
        tableName: 'ptl_requests',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = PtlRequest;
