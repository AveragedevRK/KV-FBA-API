const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  asin: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    short: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160  // Good for meta descriptions
    },
    long: {
      type: String,
      trim: true,
      default: ''
    },
    features: [{
      type: String,
      trim: true
    }],
    specifications: {
      type: Map,
      of: String
    }
  },
  imageUrl: {
    type: String,
    default: ''
  },
  productWeight: {
    type: Number,
    required: true,
    min: 0,
    set: v => parseFloat(v.toFixed(2)) // Store with 2 decimal places
  },
  productDimensions: {
    length: {
      type: Number,
      required: true,
      min: 0,
      set: v => parseFloat(v.toFixed(2))
    },
    width: {
      type: Number,
      required: true,
      min: 0,
      set: v => parseFloat(v.toFixed(2))
    },
    height: {
      type: Number,
      required: true,
      min: 0,
      set: v => parseFloat(v.toFixed(2))
    },
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'in'
    }
  },
  weightUnit: {
    type: String,
    enum: ['g', 'kg', 'lb', 'oz'],
    default: 'lb'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
