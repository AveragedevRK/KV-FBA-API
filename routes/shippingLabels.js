const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
let uuidv4;
import("uuid").then(mod => {
  uuidv4 = mod.v4;
});
const fs = require('fs');
const Shipment = require('../models/Shipment');

// Ensure uploads directory exists
const uploadDir = 'public/uploads/labels';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `label-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// POST /api/shipments/:shipmentId/labels
router.post('/:shipmentId/labels', upload.single('file'), async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { appliesTo = [] } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      // Clean up the uploaded file if shipment not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    const newLabel = {
      id: uuidv4(),
      fileName: req.file.originalname,
      fileUrl: `/uploads/labels/${path.basename(req.file.path)}`,
      appliesTo: Array.isArray(appliesTo) ? appliesTo : [appliesTo].filter(Boolean),
      uploadedAt: new Date()
    };

    shipment.shippingLabels.push(newLabel);
    await shipment.save();

    res.status(201).json({
      success: true,
      data: shipment
    });

  } catch (error) {
    console.error('Error uploading shipping label:', error);

    // Clean up the uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const statusCode = error instanceof multer.MulterError ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error uploading shipping label',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/shipments/:shipmentId/labels
router.get('/:shipmentId/labels', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne(
      { shipmentId },
      { shippingLabels: 1, _id: 0 }
    );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: shipment.shippingLabels || []
    });

  } catch (error) {
    console.error('Error fetching shipping labels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shipping labels',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/shipments/:shipmentId/labels/:labelId
router.delete('/:shipmentId/labels/:labelId', async (req, res) => {
  try {
    const { shipmentId, labelId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    const labelIndex = shipment.shippingLabels.findIndex(
      label => label.id === labelId
    );

    if (labelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Label not found'
      });
    }

    // Get the file path before removing the label
    const filePath = path.join(__dirname, '..', 'public', shipment.shippingLabels[labelIndex].fileUrl);

    // Remove the label from the array
    shipment.shippingLabels.splice(labelIndex, 1);
    await shipment.save();

    // Delete the file (optional)
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(200).json({
      success: true,
      data: shipment
    });

  } catch (error) {
    console.error('Error deleting shipping label:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting shipping label',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
