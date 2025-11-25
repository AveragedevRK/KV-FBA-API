const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    required: [true, 'Shipment ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  shipmentName: {
    type: String,
    required: [true, 'Shipment name is required'],
    trim: true
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  shipmentContents: [{
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true
    },
    asin: {
      type: String,
      required: [true, 'ASIN is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    }
  }],
  packingLines: [{
    boxCount: {
      type: Number,
      required: [true, 'Box count is required'],
      min: [1, 'Box count must be at least 1']
    },
    dimensions: {
      length: {
        type: Number,
        required: [true, 'Length is required'],
        min: [0, 'Length must be a positive number']
      },
      width: {
        type: Number,
        required: [true, 'Width is required'],
        min: [0, 'Width must be a positive number']
      },
      height: {
        type: Number,
        required: [true, 'Height is required'],
        min: [0, 'Height must be a positive number']
      }
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0, 'Weight must be a positive number']
    },
    unitsPerBox: [{
      sku: {
        type: String,
        required: [true, 'SKU is required'],
        trim: true
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity must be 0 or greater']
      }
    }]
  }],
  status: {
    type: String,
    default: 'Draft',
    enum: ['Draft', 'Packed', 'Shipped']
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Indexes for better query performance
shipmentSchema.index({ 'shipmentContents.sku': 1 });
shipmentSchema.index({ 'shipmentContents.asin': 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
