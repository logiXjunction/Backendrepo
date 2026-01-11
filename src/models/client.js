const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },

  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,  
    validate: {
      isTenDigitNumber(value) {
        if (value && !/^\d{10}$/.test(value)) {
          throw new Error('Phone number must be a 10 digit number');
        }
      }
    }
  },

  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  companyAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValidGST(value) {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
          throw new Error('Invalid GST number format');
        }
      }
    }
  },

  isProfileComplete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },

}, {
  tableName: 'clients',
  timestamps: true,
});


module.exports = Client;
