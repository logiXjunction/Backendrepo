const Vehicle = require('../models/vehicle');
const uploadToS3 = require('../utils/s3upload');
const redis = require('../config/redis');

const addVehicle = async (req, res) => {
  try {
    const {
      vehicleName,
      dimension,
      capacity,
      vehicleNumber,
      isRefrigerated,
      bodyType
    } = req.body;

    if (
      !vehicleName ||
      !dimension ||
      !capacity ||
      !vehicleNumber ||
      isRefrigerated === undefined ||
      !bodyType
    ) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!req.files?.rc || !req.files?.roadPermit || !req.files?.pollution) {
      return res.status(400).json({
        message: 'RC, Road Permit and Pollution Certificate are required.'
      });
    }

    const transporterId = req.transporter.id;
    const basePath = `transporters/${transporterId}/vehicles/${vehicleNumber}`;

    const [rcKey, roadPermitKey, pollutionKey] = await Promise.all([
      uploadToS3({
        buffer: req.files.rc[0].buffer,
        mimeType: req.files.rc[0].mimetype,
        key: `${basePath}/rc`
      }),
      uploadToS3({
        buffer: req.files.roadPermit[0].buffer,
        mimeType: req.files.roadPermit[0].mimetype,
        key: `${basePath}/road-permit`
      }),
      uploadToS3({
        buffer: req.files.pollution[0].buffer,
        mimeType: req.files.pollution[0].mimetype,
        key: `${basePath}/pollution`
      })
    ]);

    const vehicle = await Vehicle.create({
      vehicleName,
      dimension,
      capacity,
      vehicleNumber,
      isRefrigerated,
      bodyType,
      transporterId,
      rcUrl: rcKey,
      roadPermitUrl: roadPermitKey,
      PollutionCertificateUrl: pollutionKey
    });

    res.status(201).json({
      message: 'Vehicle added successfully.',
      vehicleId: vehicle.id
    });
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const VEHICLE_LIST_CACHE_TTL = 30 * 60; // 30 minutes

/**
 * GET ALL VEHICLES FOR A TRANSPORTER
 * - Redis first
 * - DB fallback
 */
const getAllVehicles = async (req, res) => {
  try {
    const transporterId = req.transporter.id;
    const cacheKey = `vehicles:transporter:${transporterId}`;

    // 1️⃣ Redis first
    const cachedVehicles = await redis.get(cacheKey);
    if (cachedVehicles) {
      return res.status(200).json({
        message: 'Vehicles fetched successfully.',
        source: 'cache',
        vehicles: JSON.parse(cachedVehicles)
      });
    }

    // 2️⃣ DB fallback
    const vehicles = await Vehicle.findAll({
      where: { transporterId },
      order: [['id', 'DESC']]
    });

    // 3️⃣ Cache result
    await redis.setex(
      cacheKey,
      VEHICLE_LIST_CACHE_TTL,
      JSON.stringify(vehicles)
    );

    res.status(200).json({
      message: 'Vehicles fetched successfully.',
      source: 'db',
      vehicles
    });
  } catch (error) {
    console.error('Get all vehicles error:', error);
    res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};

module.exports = {
  addVehicle,
  getAllVehicles
};