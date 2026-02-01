// utils/s3Helper.js
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

/**
 * Generate a temporary signed URL for S3 object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL validity in seconds (default: 300 = 5 minutes)
 * @returns {Promise<string>} Signed URL
 */
const getSignedUrlForObject = async (key, expiresIn = 600) => {
  if (!key) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

/**
 * Process document object and replace keys with signed URLs
 * @param {Object} doc - Document object with nested structure
 * @returns {Promise<Object>} Document with signed URLs
 */
const processDocumentUrls = async (doc) => {
  if (!doc) return null;

  const documentCopy = JSON.parse(JSON.stringify(doc));
  
  const fields = ['gst', 'pan', 'aadhar', 'cancelledCheck', 'passBookCopy'];
  
  for (const field of fields) {
    if (documentCopy[field]?.key) {
      documentCopy[field].url = await getSignedUrlForObject(documentCopy[field].key);
    }
  }

  return documentCopy;
};

/**
 * Process driver documents and add signed URLs
 * @param {Array} drivers - Array of driver objects
 * @returns {Promise<Array>} Drivers with signed URLs
 */
const processDriverUrls = async (drivers) => {
  if (!drivers || !Array.isArray(drivers)) return [];

  return Promise.all(
    drivers.map(async (driver) => {
      const driverCopy = driver.toJSON ? driver.toJSON() : { ...driver };
      
      if (driverCopy.driverAadharUpload) {
        driverCopy.driverAadharUrl = await getSignedUrlForObject(driverCopy.driverAadharUpload);
      }
      if (driverCopy.driverLicenseUpload) {
        driverCopy.driverLicenseUrl = await getSignedUrlForObject(driverCopy.driverLicenseUpload);
      }
      if (driverCopy.driverPhotoUpload) {
        driverCopy.driverPhotoUrl = await getSignedUrlForObject(driverCopy.driverPhotoUpload);
      }

      return driverCopy;
    })
  );
};

/**
 * Process vehicle documents and add signed URLs
 * @param {Array} vehicles - Array of vehicle objects
 * @returns {Promise<Array>} Vehicles with signed URLs
 */
const processVehicleUrls = async (vehicles) => {
  if (!vehicles || !Array.isArray(vehicles)) return [];

  return Promise.all(
    vehicles.map(async (vehicle) => {
      const vehicleCopy = vehicle.toJSON ? vehicle.toJSON() : { ...vehicle };
      
      if (vehicleCopy.rcUrl) {
        vehicleCopy.rcSignedUrl = await getSignedUrlForObject(vehicleCopy.rcUrl);
      }
      if (vehicleCopy.roadPermitUrl) {
        vehicleCopy.roadPermitSignedUrl = await getSignedUrlForObject(vehicleCopy.roadPermitUrl);
      }
      if (vehicleCopy.PollutionCertificateUrl) {
        vehicleCopy.pollutionCertificateSignedUrl = await getSignedUrlForObject(vehicleCopy.PollutionCertificateUrl);
      }

      return vehicleCopy;
    })
  );
};

module.exports = {
  getSignedUrlForObject,
  processDocumentUrls,
  processDriverUrls,
  processVehicleUrls,
};