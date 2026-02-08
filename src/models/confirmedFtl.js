const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");


const ConfirmedFtl = sequelize.define(
  "ConfirmedFtl",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
      field: "client_id",
    },
    transporterId:{
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "transporters",
        key: 'id'
      },
      field: 'transporter_id'
    },
    ftlId:{
        type:DataTypes.INTEGER,
        allowNull:false,
        references:{
            model:"ftls",
            key:"id"
        },
        field: "ftl_id"
    },
    isVehicleAssigned:{
        type:DataTypes.BOOLEAN,
        defaultValue:false,
        field:"is_vehicle_assigned"
    },
    isDriverAssigned:{
        type:DataTypes.BOOLEAN,
        defaultValue:false,
        field:"is_driver_assigned"
    },
    driverId:{
        type:DataTypes.INTEGER,
        allowNull:true,
        field:"driver_id"
    },
    vehicleId:{
        type:DataTypes.INTEGER,
        allowNull:true,
        field:"vehicle_id"
    },
    trackingId:{
        type:DataTypes.STRING,
        allowNull:true,
        field:"tracking_id"
    },
    trackingLink:{
        type:DataTypes.STRING,
        allowNull:true,
        field:"tracking_link"
    },
    totalValue:{
        type:DataTypes.DECIMAL(10, 2),
        allowNull:false,
        field:"total_value"
    },
    status: {
      type: DataTypes.ENUM("paid","assigned","ongoing","completed","cancelled"),
      defaultValue: "paid",
      allowNull: false,
    },
  },
  {
    tableName: "confirmedftls",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ConfirmedFtl;
