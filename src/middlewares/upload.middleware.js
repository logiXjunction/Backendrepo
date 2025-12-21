const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'), false);
    } else {
      cb(null, true);
    }
  }
});

module.exports = upload;
