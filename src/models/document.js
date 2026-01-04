const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  transporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'transporters',
      key: 'id',
    },
    field: 'transporter_id',
    unique: true, // One document record per transporter
  },
  gst: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isSubmitted: false,
      isVerified: 'false',
      name: 'GST Certificate',
      key: null,
      description: '',
    },
  },
  pan: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isSubmitted: false,
      isVerified: 'false',
      name: 'Pan Card',
      key: null,
      description: '',
    },
  },
  aadhar: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isSubmitted: false,
      isVerified: 'false',
      name: 'Owner Aadhar',
      key: null,
      description: '',
    },
  },
  cancelledCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isSubmitted: false,
      isVerified: 'false',
      name: 'Cancelled Check',
      key: null,
      description: '',
    },
    field: 'cancelled_check',
  },
  passBookCopy: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isSubmitted: false,
      isVerified: 'false',
      name: 'PassBook Copy',
      key: null,
      description: '',
    },
    field: 'passbook_copy',
  },
}, {
  tableName: 'documents',
  timestamps: true,
});

module.exports = Document;

