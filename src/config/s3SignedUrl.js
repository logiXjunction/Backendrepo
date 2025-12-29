const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');

const getSignedS3Url = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key, // transporters/1/vehicles/212/rc
  });

  return await getSignedUrl(s3, command, { expiresIn: 300 });
};

module.exports = getSignedS3Url;
