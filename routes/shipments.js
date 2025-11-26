const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const ShipmentHistory = require('../models/ShipmentHistory');
const logShipmentEvent = require('../utils/logShipmentEvent');



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

    // Save original contents and packing lines
    savedShipment.originalShipmentContents = JSON.parse(JSON.stringify(savedShipment.shipmentContents));
    savedShipment.originalPackingLines = [];
    await savedShipment.save();

    // Log the creation event
    await logShipmentEvent(savedShipment.shipmentId, 'Shipment Created', {
      shipmentName: savedShipment.shipmentName
    });

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

    // Log the packing update event
    await logShipmentEvent(updatedShipment.shipmentId, 'Packing Updated', {
      status: updatedShipment.status,
      packingLinesCount: updatedShipment.packingLines.length
    });

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

// GET /api/shipments/:shipmentId/history - Get history for a shipment
router.get('/:shipmentId/history', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Find all history entries for this shipment, newest first
    const history = await ShipmentHistory.find({ shipmentId })
      .sort({ createdAt: -1 }) // Newest first
      .select('event meta createdAt -_id') // Only include necessary fields
      .lean();

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Error fetching shipment history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH /api/shipments/:shipmentId/contents - Update shipment contents
router.patch('/:shipmentId/contents', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { updates = [], additions = [] } = req.body;

    // Find the shipment
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Process updates
    for (const { sku, newQuantity } of updates) {
      const item = shipment.shipmentContents.find(item => item.sku === sku);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Product with SKU ${sku} not found in shipment`
        });
      }

      // Check if reducing quantity below packed units
      if (newQuantity < item.quantity) {
        const packedQty = shipment.packingLines.reduce((total, line) => {
          const lineItem = line.unitsPerBox.find(u => u.sku === sku);
          return total + (lineItem ? lineItem.quantity : 0);
        }, 0);

        if (newQuantity < packedQty) {
          return res.status(400).json({
            success: false,
            message: `Cannot reduce quantity of ${sku} below ${packedQty} packed units`
          });
        }
      }

      // Log quantity change
      if (newQuantity !== item.quantity) {
        await logShipmentEvent(shipmentId, 'Product quantity updated', {
          sku,
          oldQuantity: item.quantity,
          newQuantity
        });
        item.quantity = newQuantity;
      }
    }

    // Process additions
    for (const { sku, asin, quantity } of additions) {
      if (shipment.shipmentContents.some(item => item.sku === sku)) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU ${sku} already exists in shipment`
        });
      }

      shipment.shipmentContents.push({ sku, asin, quantity });

      await logShipmentEvent(shipmentId, 'Product added to shipment', {
        sku,
        asin,
        quantity
      });
    }

    const updatedShipment = await shipment.save();

    res.status(200).json({
      success: true,
      data: updatedShipment
    });

  } catch (error) {
    console.error('Error updating shipment contents:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/shipments/:shipmentId/reset - Reset shipment to original state
router.post('/:shipmentId/reset', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Find the shipment
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Reset to original state
    shipment.shipmentContents = JSON.parse(JSON.stringify(shipment.originalShipmentContents));
    shipment.packingLines = [];
    shipment.status = 'Unpacked';

    const resetShipment = await shipment.save();

    // Log the reset event
    await logShipmentEvent(shipmentId, 'Shipment reset to original setup');

    res.status(200).json({
      success: true,
      data: resetShipment
    });

  } catch (error) {
    console.error('Error resetting shipment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PATCH /api/shipments/:shipmentId/instructions - Update packing instructions
router.patch('/:shipmentId/instructions', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { packingInstructions } = req.body;

    // Validate input
    if (typeof packingInstructions !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'packingInstructions must be a string'
      });
    }

    // Find and update the shipment
    const shipment = await Shipment.findOneAndUpdate(
      { shipmentId },
      {
        $set: {
          packingInstructions: packingInstructions.trim()
        }
      },
      { new: true, runValidators: true }
    );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Log the update event
    await logShipmentEvent(shipmentId, 'Packing instructions updated', {
      instructions: packingInstructions.trim()
    });

    res.status(200).json({
      success: true,
      data: shipment
    });

  } catch (error) {
    console.error('Error updating packing instructions:', error);

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
