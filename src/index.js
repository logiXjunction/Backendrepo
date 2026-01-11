require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
const { redisClient } = require('./config/redis');
const transporterRoutes = require('./routes/transporterRoutes');
const driverRoutes = require('./routes/driverRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const documentRoutes = require('./routes/documentRoutes');
const coverageRoutes = require('./routes/coverageRoutes.js')
const clientRoutes= require('./routes/clientRoutes.js')
const ftlRoutes = require('./routes/ftlRoutes.js')
const { swaggerUi, getSwaggerDocument } = require('./config/swagger');
const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  'http://localhost:5173',
  'https://logixjunction.com',
  'https://www.logixjunction.com',
  'https://logix-frontend-sigma.vercel.app',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not an allowed origin'));
    },
    credentials: true,
  })
);

/* -------------------- BODY PARSERS -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- HEALTH CHECK -------------------- */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ultron backend works fine',
  });
});

app.use('/api/transporter', transporterRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/coverage',coverageRoutes);
app.use('/api/client',clientRoutes);
app.use('/api/ftl/',ftlRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  try {
    const swaggerDocument = await getSwaggerDocument();

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    }

    await sequelize.authenticate();
    console.log('Database connected');
    console.log('Database synchronized (tables created/verified)');

    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Redis connected');
    }

    app.listen(PORT, () => {
      console.log(`Ultron server running at http://localhost:${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
