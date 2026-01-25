const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Quotation = sequelize.define('Quotation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    FtlId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ftls', key: 'id' },
        field: "ftl_id"
    },
    transporterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'transporters', key: 'id' },
        field: "transporter_id"
    },
    companyName:{
        type: DataTypes.STRING,
        allowNull: true,
        field: 'company_name'

    },
    baseFreight: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field:'base_freight' },
    odaCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field:'oda_charges' },
    detentionCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field:'detention_charges'},
    otherCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field:'other_charges' },
    
    canMeetDates: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'yes',field:'can_meet_dates' },
    expectedPickupDate: { type: DataTypes.DATEONLY, allowNull: true, field:'expected_pickup_date' },
    expectedDeliveryDate: { type: DataTypes.DATEONLY, allowNull: true, field:'expected_delivery_date'},
    
    canMeetLabour: { type: DataTypes.ENUM('yes', 'no'), defaultValue: 'yes',field:'can_meet_labour' },
    labourCharges: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0,field:'labour_charges' },
    
    additionalNotes: { type: DataTypes.TEXT, allowNull: true, field:'additional_notes' },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Quotation;