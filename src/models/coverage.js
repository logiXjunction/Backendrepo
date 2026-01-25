const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Coverage = sequelize.define(
  "Coverage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    transporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "transporter_id",
    },

    servicesOffered: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: "services_offered",
    },

    pickup: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { panIndia: false, locations: [] },
    },

    drop: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { panIndia: false, locations: [] },
    },
  },
  {
    tableName: "coverages",
    timestamps: true,
  }
);

module.exports = Coverage;
