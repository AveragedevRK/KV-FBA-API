const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');

// POST /api/shipments - Create a new shipment
router.post('/', async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { shipmentId, shipmentName, meta, shipmentContents, packingLines } = req.body;

    // Validate required fields
    if (!shipmentId || !shipmentId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shipment ID is required'
      });
    }

    // Check if shipment with this ID already exists
    const existingShipment = await Shipment.findOne({ shipmentId: shipmentId.trim() });
    if (existingShipment) {
      return res.status(409).json({
        success: false,
        message: 'Shipment with this ID already exists'
      });
    }

    if (!shipmentName || !shipmentName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shipment name is required'
      });
    }

    if (!Array.isArray(shipmentContents) || shipmentContents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one shipment content item is required'
      });
    }

    // Validate shipment contents
    for (const [index, item] of shipmentContents.entries()) {
      if (!item.sku || !item.asin || item.quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: `Item ${index + 1} is missing required fields (sku, asin, or quantity)`
        });
      }
      if (item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Item ${index + 1}: Quantity must be at least 1`
        });
      }
    }

    // Create new shipment
    const shipment = new Shipment({
      shipmentId: shipmentId.trim(),
      shipmentName: shipmentName.trim(),
      meta: meta || {},
      shipmentContents,
      packingLines: packingLines || []
    });

    // Save to database
    const savedShipment = await shipment.save();

    // Return success response
    res.status(201).json({
      success: true,
      data: savedShipment
    });

  } catch (error) {
    console.error('Error creating shipment:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/shipments - Get all shipments
router.get('/', async (req, res) => {
  try {
    const shipments = await Shipment.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JavaScript objects

    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
