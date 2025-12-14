const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Ftl = sequelize.define(
  "Ftl",
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
    // --- Pickup Info ---
    pickupAddressLine: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_address_line_1",
    },
    pickupCity: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "pickup_city",
    },
    pickupState: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_state",
    },
    pickupPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "pickup_pincode",
    },

    // --- Drop Info ---
    deliveryAddressLine: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "delivery_address_line_1",
    },
    deliveryCity: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "delivery_city",
    },
    deliveryState: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "delivery_state",
    },
    deliveryPincode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "delivery_pincode",
    },

    // --- Schedule ---
    expectedPickupDate: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "expected_pickup_date",
    },
    expectedDeliveryDate: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "expected_delivery_date",
    },
    // --- Cargo Details ---
    materialType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "material_type",
    },
    customMaterialType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "custom_material_type",
    },
    weightKg: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "weight_kg",
    },
    length: { type: DataTypes.FLOAT, allowNull: true, field: "length" },
    width: { type: DataTypes.FLOAT, allowNull: true, field: "width" },
    height: { type: DataTypes.FLOAT, allowNull: true, field: "height" },
    volumetricWeightKg: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "volumetric_weight_kg",
    },
    dimensionUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "dimension_unit",
    },
    smallVehicleType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "small_vehicle_type",
    },
    materialValue: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "material_value",
    },
    additionalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "additional_notes",
    },
    // --- Logistics ---
    transportMode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "transport_mode",
    },
    shipmentType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "shipment_type",
    },
    bodyType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "body_type",
    },
    truckSize: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "truck_size",
    },
    coolingType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "cooling_type",
    },
    manpower: {
      type: DataTypes.ENUM("yes", "no"),
      allowNull: true,
      defaultValue: "no",
      field: "manpower",
    },
    noOfLabours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: "no_of_labours",
    },
    status: {
      type: DataTypes.ENUM(
        "requested",
        "offer_sent",
        "confirmed",
        "rejected",
        "modification_requested",
        "completed"
      ),
      defaultValue: "requested",
      allowNull: false,
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "cost",
    },
  },
  {
    tableName: "ftl",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Ftl;