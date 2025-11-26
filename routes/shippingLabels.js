const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
let uuidv4;
import("uuid").then(mod => {
  uuidv4 = mod.v4;
});
const fs = require('fs').promises;
const Shipment = require('../models/Shipment');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads/labels');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

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

    // Validate file is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a PDF file.'
      });
    }

    // Validate appliesTo is provided and is a valid JSON array
    if (!req.body.appliesTo) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'appliesTo is required and must be a JSON array of packing line IDs'
      });
    }

    let appliesTo;
    try {
      appliesTo = JSON.parse(req.body.appliesTo);
      if (!Array.isArray(appliesTo) || appliesTo.length === 0) {
        throw new Error('appliesTo must be a non-empty array');
      }
    } catch (error) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'Invalid appliesTo format. Must be a JSON array of packing line IDs'
      });
    }

    // Find the shipment
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Create new label
    const newLabel = {
      id: uuidv4(),
      fileName: req.file.originalname,
      fileUrl: `/uploads/labels/${path.basename(req.file.path)}`,
      appliesTo,
      uploadedAt: new Date()
    };

    // Add label to shipment and save
    shipment.shippingLabels.push(newLabel);
    await shipment.save();

    res.status(201).json({
      success: true,
      data: shipment
    });

  } catch (error) {
    console.error('Error uploading shipping label:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
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

    // Find the shipment
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Find the label index
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
    const filePath = path.join(__dirname, '../public', shipment.shippingLabels[labelIndex].fileUrl);

    // Remove the label from the array
    shipment.shippingLabels.splice(labelIndex, 1);
    await shipment.save();

    // Delete the file (async)
    fs.unlink(filePath).catch(console.error);

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
