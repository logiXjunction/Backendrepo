const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const Transporter = sequelize.define('Transporter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ownerName: {
    type: DataTypes.STRING,
    field: 'owner_name',
    allowNull: true,
  },
  ownerPhoneNumber: {
    type: DataTypes.STRING,
    field: 'owner_phone_number',
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING,
    field: 'designation',
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'company_name'
  },
  companyAddress: {
    type: DataTypes.TEXT,
    field: 'company_address',
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'email',
    unique: true,
    validate: { isEmail: true }
  },
  gstNumber: {
    type: DataTypes.STRING,
    field: 'gst_number',
    allowNull: false,
    validate: {
      isValidGST(value) {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) {
          throw new Error('Invalid GST number format');
        }
      }
    }
  },
  customerServiceNumber: {
    type: DataTypes.STRING,
    field: 'customer_service_number',
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password',
  },
  profileStatus: {
    type: DataTypes.ENUM('pending', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
    field: 'profile_status',
  },
  cinNumber:{
    type: DataTypes.STRING,
    allowNull: true,
    field: 'cin_number',
  },
  status: {
    type: DataTypes.ENUM('verified', 'unverified', 'suspended'),
    allowNull: false,
    defaultValue: 'unverified',
    field: 'status',
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
  tableName: 'transporters',
  timestamps: true,
  hooks: {
    beforeCreate: async transporter => {
      if (transporter.password) {
        const salt = await bcrypt.genSalt(10);
        transporter.password = await bcrypt.hash(transporter.password, salt);
      }
    },
    beforeUpdate: async transporter => {
      if (transporter.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        transporter.password = await bcrypt.hash(transporter.password, salt);
      }
    },
  }
});

// Instance method to verify password
Transporter.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = Transporter;