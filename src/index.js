require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
const { redisClient } = require('./config/redis');
const transporterRoutes = require('./routes/transporterRoutes');
const { swaggerUi, getSwaggerDocument } = require('./config/swagger');
const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------- CORS -------------------- */
const allowedOrigins = [
  'http://localhost:5173',
  'https://logixjunction.com',
  'https://www.logixjunction.com',
  'https://logix-frontend-sigma.vercel.app',
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

/* -------------------- API ROUTES -------------------- */
app.use('/api/transporters', transporterRoutes);


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
        // 1. Get the resolved Swagger document
        const swaggerDocument = await getSwaggerDocument();

        // 2. Set up the Swagger route (Corrected line)
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 

        // 3. Authenticate Sequelize (Start this *after* the docs route is set)
        await sequelize.authenticate(); // <--- This line is now correctly separated
        console.log('✅ Database connected');

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
