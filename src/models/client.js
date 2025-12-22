const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: true,   //optional
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    allowNull: false,
    validate: {
      isTenDigitNumber(value) {
        if (value && !/^\d{10}$/.test(value)) {
          throw new Error('Phone number must be a 10 digit number');
        }
      }
    } // not optional
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'company_name'   //optional
  },
  companyAddress: {
    type: DataTypes.TEXT,
    field: 'company_address',   //optional
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'email',
    unique: true,
    validate: { isEmail: true }  // not optional
  },
  // Password for shipper accounts (hashed via hooks)
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password',
  },
  gstNumber: {
    type: DataTypes.STRING,
    field: 'gst_number',
    allowNull: true,
    validate: {
      // Custom GST validation
      isValidGST(value) {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
          throw new Error('Invalid GST number format');
        }
      }
    }  // optional
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  }
}, {
  tableName: 'clients',
  timestamps: true,
  hooks: {
    beforeCreate: async (client) => {
      if (client.password) {
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(client.password, salt);
      }
    },
    beforeUpdate: async (client) => {
      if (client.changed && client.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(client.password, salt);
      }
    },
  }
});

// Instance method to verify password
Client.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = Client;
