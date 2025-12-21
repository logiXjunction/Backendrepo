const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

const uploadToS3 = async ({ buffer, mimeType, key }) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType
  });

  await s3.send(command);
  return key; // store KEY, not public URL
};

module.exports = uploadToS3;
