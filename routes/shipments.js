const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');

// POST /api/shipments - Create a new shipment
router.post('/', async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const {
      shipmentId,
      shipmentName,
      meta,
      shipmentContents,
      packingLines,
      status = 'Unpacked',
      isPriority = false,
      priorityIndex
    } = req.body;

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

    // Validate priority fields
    if (isPriority === true && (priorityIndex === undefined || priorityIndex === null)) {
      return res.status(400).json({
        success: false,
        message: 'priorityIndex is required when isPriority is true.'
      });
    }

    // Validate status against enum
    const validStatuses = ['Unpacked', 'Packed', 'Shipped'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
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
      packingLines: packingLines || [],
      status,
      isPriority,
      ...(isPriority && { priorityIndex })
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
      .sort({
        isPriority: -1,        // Priority shipments first
        priorityIndex: 1,      // Then by priorityIndex ascending
        createdAt: -1          // Then by newest first
      })
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

// GET /api/shipments/:shipmentId - Get a single shipment by shipmentId
router.get('/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      shipmentId: req.params.shipmentId
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH /api/shipments/:shipmentId/packing - Update packing info for a shipment
router.patch('/:shipmentId/packing', async (req, res) => {
  try {
    const { packingLines, status } = req.body;
    const { shipmentId } = req.params;

    // Find the shipment
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Update packingLines if provided
    if (packingLines !== undefined) {
      shipment.packingLines = packingLines;
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['Unpacked', 'Packed', 'Shipped'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      shipment.status = status;
    }

    // Save the updated shipment
    const updatedShipment = await shipment.save();

    res.status(200).json({
      success: true,
      data: updatedShipment
    });

  } catch (error) {
    console.error('Error updating shipment packing:', error);

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

module.exports = router;
