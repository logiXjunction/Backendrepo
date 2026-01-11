const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Quotation = sequelize.define('Quotation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    FtlId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Ftls', key: 'id' }
    },
    transporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'transporters', key: 'id' }
    },
    baseFreight: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    odaCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    detentionCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    otherCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    
    canMeetDates: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'yes' },
    expectedPickupDate: { type: DataTypes.DATEONLY, allowNull: true },
    expectedDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true },
    
    canMeetLabour: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'yes' },
    labourCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    
    additionalNotes: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Quotation;