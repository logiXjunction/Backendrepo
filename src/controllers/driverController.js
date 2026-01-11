const Driver = require('../models/driver');
const uploadToS3 = require('../utils/s3upload');
const {redisClient: redis} = require('../config/redis');
const getSignedS3Url = require('../config/s3SignedUrl');


const addDriver = async (req, res) => {
  try {
    const { driverName, driverPhoneNumber } = req.body;

    if (!driverName || !driverPhoneNumber) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!req.files?.aadhar || !req.files?.license) {
      return res.status(400).json({
        message: 'Aadhar and License are required.',
      });
    }

    const transporterId = req.transporter.id;

    // 1️⃣ Create driver first
    const driver = await Driver.create({
      driverName,
      driverPhoneNumber,
      transporterId,
    });

    const basePath = `drivers/${transporterId}/${driver.id}`;

    // 2️⃣ Upload files
    const [aadharKey, licenseKey, photoKey] = await Promise.all([
      uploadToS3({
        buffer: req.files.aadhar[0].buffer,
        mimeType: req.files.aadhar[0].mimetype,
        key: `${basePath}/aadhar`,
      }),
      uploadToS3({
        buffer: req.files.license[0].buffer,
        mimeType: req.files.license[0].mimetype,
        key: `${basePath}/license`,
      }),
      req.files.photo
        ? uploadToS3({
            buffer: req.files.photo[0].buffer,
            mimeType: req.files.photo[0].mimetype,
            key: `${basePath}/photo`,
          })
        : null,
    ]);

    // 3️⃣ Update driver with document keys
    await driver.update({
      driverAadharUpload: aadharKey,
      driverLicenseUpload: licenseKey,
      driverPhotoUpload: photoKey,
    });

    // 4️⃣ Clear cache
    await redis.del(`drivers:transporter:${transporterId}`);

    res.status(201).json({
      message: 'Driver created successfully.',
      driverId: driver.id,
    });
  } catch (error) {
    console.error('Add driver error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const DRIVER_LIST_CACHE_TTL = 30 * 60;

const getAllDrivers = async (req, res) => {
  try {
    const transporterId = req.transporter.id;


    const drivers = await Driver.findAll({
      where: { transporterId },
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'driverName',
        'driverPhoneNumber',
        'driverAadharUpload',
        'driverLicenseUpload',
        'driverPhotoUpload',
        'status'
      ],
    });


    res.status(200).json({
      message: 'Drivers fetched successfully.',
      source: 'db',
      drivers,
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getDriverDocument = async (req, res) => {
  try {
    const { driverId, type } = req.params;
    const transporterId = req.transporter.id;

    const driver = await Driver.findOne({
      where: { id: driverId, transporterId },
    });

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const keyMap = {
      aadhar: driver.driverAadharUpload,
      license: driver.driverLicenseUpload,
      photo: driver.driverPhotoUpload,
    };

    const key = keyMap[type];

    if (!key) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const signedUrl = await getSignedS3Url(key);

    res.json({ url: signedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch document' });
  }
};


module.exports={
    addDriver,
    getAllDrivers,
    getDriverDocument
}