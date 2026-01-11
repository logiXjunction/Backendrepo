const Document = require('../models/document');
const uploadToS3 = require('../utils/s3upload');
const getSignedS3Url = require('../config/s3SignedUrl');

// Document type to name mapping
const DOCUMENT_NAMES = {
  gst: 'GST Certificate',
  pan: 'Pan Card',
  aadhar: 'Owner Aadhar',
  cancelledCheck: 'Cancelled Check',
  passBookCopy: 'PassBook Copy',
};

// Submit a single document independently
const submitDocument = async (req, res) => {
  try {
    const { key } = req.params;
    const transporterId = req.transporter.id;

    // Validate document type
    const validTypes = ['gst', 'pan', 'aadhar', 'cancelledCheck', 'passBookCopy'];
    if (!validTypes.includes(key)) {
      return res.status(400).json({
        message: 'Invalid document type. Valid types: gst, pan, aadhar, cancelledCheck, passBookCopy'
      });
    }

    // Check if file is provided
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Upload file to S3
    const s3Key = `transporters/${transporterId}/documents/${key}`;
    await uploadToS3({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      key: s3Key,
    });

    // Find or create document record
    let document = await Document.findOne({
      where: { transporterId },
    });

    if (!document) {
      document = await Document.create({ transporterId });
    }

    // Update the specific document field
    const documentData = {
      isSubmitted: true,
      isVerified: 'false',
      name: DOCUMENT_NAMES[key],
      key: s3Key,
      description: '',
    };

    await document.update(
      { [key]: documentData },
      { silent: false }
    );

    await document.reload();

    res.status(200).json({
      message: `${DOCUMENT_NAMES[key]} submitted successfully`,
      document: {
        [key]: {
          isSubmitted: documentData.isSubmitted,
          isVerified: documentData.isVerified,
          name: documentData.name,
          description: documentData.description,
        },
      },
    });
  } catch (error) {
    console.error('Submit document error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all documents for a transporter
const getDocuments = async (req, res) => {
  try {
    const transporterId = req.transporter.id;

    const document = await Document.findOne({
      where: { transporterId },
    });

    if (!document) {
      // Return default structure if no document record exists
      return res.status(200).json({
        gst: {
          isSubmitted: false,
          isVerified: 'false',
          name: DOCUMENT_NAMES.gst,
          description: '',
        },
        aadhar: {
          isSubmitted: false,
          isVerified: 'false',
          name: DOCUMENT_NAMES.aadhar,
          description: '',
        },
        pan: {
          isSubmitted: false,
          isVerified: 'false',
          name: DOCUMENT_NAMES.pan,
          description: '',
        },
        cancelledCheck: {
          isSubmitted: false,
          isVerified: 'false',
          name: DOCUMENT_NAMES.cancelledCheck,
          description: '',
        },
        passBookCopy: {
          isSubmitted: false,
          isVerified: 'false',
          name: DOCUMENT_NAMES.passBookCopy,
          description: '',
        },
      });
    }

    // Return documents without key (security) - match exact format from example
    const documents = {
      gst: {
        isSubmitted: document.gst?.isSubmitted || false,
        isVerified: document.gst?.isVerified || 'false',
        name: document.gst?.name || DOCUMENT_NAMES.gst,
        description: document.gst?.description || '',
      },
      aadhar: {
        isSubmitted: document.aadhar?.isSubmitted || false,
        isVerified: document.aadhar?.isVerified || 'false',
        name: document.aadhar?.name || DOCUMENT_NAMES.aadhar,
        description: document.aadhar?.description || '',
      },
      pan: {
        isSubmitted: document.pan?.isSubmitted || false,
        isVerified: document.pan?.isVerified || 'false',
        name: document.pan?.name || DOCUMENT_NAMES.pan,
        description: document.pan?.description || '',
      },
      cancelledCheck: {
        isSubmitted: document.cancelledCheck?.isSubmitted || false,
        isVerified: document.cancelledCheck?.isVerified || 'false',
        name: document.cancelledCheck?.name || DOCUMENT_NAMES.cancelledCheck,
        description: document.cancelledCheck?.description || '',
      },
      passBookCopy: {
        isSubmitted: document.passBookCopy?.isSubmitted || false,
        isVerified: document.passBookCopy?.isVerified || 'false',
        name: document.passBookCopy?.name || DOCUMENT_NAMES.passBookCopy,
        description: document.passBookCopy?.description || '',
      },
    };

    res.status(200).json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get S3 signed URL for a specific document
const getDocumentUrl = async (req, res) => {
  try {
    const { key } = req.params;
    const transporterId = req.transporter.id;// from middleware

    // Validate document type
    const validTypes = ['gst', 'pan', 'aadhar', 'cancelledCheck', 'passBookCopy'];
    if (!validTypes.includes(key)) {
      return res.status(400).json({
        message: 'Invalid document type. Valid types: gst, pan, aadhar, cancelledCheck, passBookCopy'
      });
    }

    // Find document record
    const document = await Document.findOne({
      where: { transporterId },
    });

    if (!document || !document[key]?.key) {
      return res.status(404).json({
        message: `${DOCUMENT_NAMES[key]} not found or not submitted`
      });
    }

    const s3Key = document[key].key;
    const signedUrl = await getSignedS3Url(s3Key);

    res.json({
      url: signedUrl,
      name: document[key].name,
    });
  } catch (error) {
    console.error('Get document URL error:', error);
    res.status(500).json({ message: 'Failed to fetch document URL' });
  }
};

module.exports = {
  submitDocument,
  getDocuments,
  getDocumentUrl,
};

