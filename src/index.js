require("dotenv").config({ path: "/app/.env" });

const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
const { redisClient } = require('./config/redis');
const transporterRoutes = require('./routes/transporterRoutes');
const adminRoutes = require("./routes/adminRoutes");
const driverRoutes = require('./routes/driverRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const documentRoutes = require('./routes/documentRoutes');
const coverageRoutes = require('./routes/coverageRoutes.js')
const clientRoutes = require('./routes/clientRoutes.js')
const ftlRoutes = require('./routes/ftlRoutes.js')
const quotationRoutes = require('./routes/quotationRoutes.js')
const { swaggerUi, getSwaggerDocument } = require('./config/swagger');
const app = express();
const PORT = process.env.PORT || 3000;
const seedAdmin = require('./seeders/seedAdmin');

//fake admin
const Admin = require("./models/admin");
if (process.env.NODE_ENV === 'development') {
  const createFakeAdmin = async () => {
    try {
      const adminEmail = "v@gmail.com";

      const existingAdmin = await Admin.findOne({
        where: { email: adminEmail }
      });

      if (existingAdmin) {
        console.log("✅ Fake admin already exists");
        return;
      }

      await Admin.create({
        name: "Super Admin",
        email: adminEmail,
        password: "1",
        role: "admin"
      });

      console.log("🚀 Fake admin created");
      console.log("Email: v@gmail.com");
      console.log("Password: 1");
    } catch (err) {
      console.error("❌ Failed to create fake admin:", err);
    }
  };

  createFakeAdmin();
}





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
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
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
app.use("/api/admin", adminRoutes);
app.use('/api/coverage', coverageRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/ftl/', ftlRoutes);
app.use('/api/quotation', quotationRoutes)

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

    if (process.env.NODE_ENV !== 'production') {
      app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }
    await sequelize.authenticate();
    console.log('Database connected');
    console.log('Database synchronized (tables created/verified)');
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Ultron server running at http://localhost:${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Swagger docs at http://localhost:${PORT}/docs`);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
