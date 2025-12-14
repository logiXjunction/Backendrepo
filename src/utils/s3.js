const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload file to S3 (private by default)
const uploadToS3 = async (file) => {
  if (!file) return null;

  const fileKey = `${uuidv4()}${path.extname(file.originalname)}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return fileKey;
};

// Generate signed URL (view/download)
const getSignedUrlFromS3 = async (fileKey, expiresInSeconds = 300) => {
  if (!fileKey) return null;

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: expiresInSeconds,
  });
};

module.exports = {
  uploadToS3,
  getSignedUrlFromS3,
};
