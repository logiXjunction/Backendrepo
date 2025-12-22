require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});


// -------------------------------
console.log("SMTP:", process.env.SMTP_FROM);
console.log("NOTIFY_TO:", process.env.NOTIFY_TO);
console.log("AWS_BUCKET:", process.env.AWS_S3_BUCKET);
// -------------------------
const express = require('express');
const cors = require('cors');
// -----------------------------------
const shipmentRoutes = require('./routes/shipmentRoutes');
// const authRoutes = require('./routes/authRoutes');
const validateRoutes = require('./routes/validateRoutes');
const shipperRoutes = require('./routes/shipperRoutes');

// --------------------------------------------
const sequelize = require('./config/database');
const { redisClient } = require('./config/redis');
const transporterRoutes = require('./routes/transporterRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const { swaggerUi, getSwaggerDocument } = require('./config/swagger');
const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://logixjunction.com',
  'https://www.logixjunction.com',
  'https://logix-frontend-sigma.vercel.app',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow everything during local development (helps with HMR, different hostnames like 127.0.0.1, etc.)
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      // In production, enforce the allowed origins list
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

/* -------------------- API ROUTES -------------------- */
app.use('/api/transporter', transporterRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/shipper', shipperRoutes);
app.use("/api/services", servicesRoutes);

// ------------------------------------------------
// Support both plural and singular shipment endpoints for backward compatibility
app.use('/api/shipments', shipmentRoutes);
app.use('/api/shipment', shipmentRoutes);
// app.use('/api/auth', authRoutes);

// -----------------------------------------------

/* -------------------- GLOBAL ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

/* -------------------- SERVER START -------------------- */
const startServer = async () => {
  try {
    const swaggerDocument = await getSwaggerDocument();

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    await sequelize.authenticate();
    console.log('✅ Database connected');
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized (updated schema in dev)');
    } else {
      await sequelize.sync();
      console.log('✅ Database synchronized (tables created/verified)');
    }

    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connected');
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
