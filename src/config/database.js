const { Sequelize } = require('sequelize');

// Determine if we are in production
const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,

    // Dialect options for Production (SSL)
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    } : {},

    retry: {
      match: [/ECONNREFUSED/, /ETIMEDOUT/],
      max: 5,
    },

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;