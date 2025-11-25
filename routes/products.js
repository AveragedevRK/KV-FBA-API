const express = require('express');
const router = express.Router();
const path = require('path');
const Product = require('../models/Product');
const upload = require('../utils/fileUpload');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// @route   GET /api/products
// @desc    Get all products with optional search and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search query
    const searchQuery = req.query.search
      ? {
        $or: [
          { sku: { $regex: req.query.search, $options: 'i' } },
          { asin: { $regex: req.query.search, $options: 'i' } },
          { productName: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      }
      : {};

    // Get total count for pagination
    const total = await Product.countDocuments(searchQuery);

    // Get paginated results
    const products = await Product.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Public
router.post('/', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }

    try {
      const {
        sku,
        asin,
        productName,
        description,
        productWeight,
        weightUnit = 'g',
        length,
        width,
        height,
        dimensionUnit = 'cm'
      } = req.body;

      // Simple validation
      const requiredFields = [
        'sku', 'asin', 'productName', 'description',
        'productWeight', 'length', 'width', 'height'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Check if SKU or ASIN already exists
      const existingProduct = await Product.findOne({
        $or: [{ sku }, { asin }]
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU or ASIN already exists'
        });
      }

      // Create product with or without image
      // Parse numeric values and ensure they're numbers
      const productFields = {
        sku,
        asin,
        productName,
        description,
        productWeight: parseFloat(productWeight),
        weightUnit,
        productDimensions: {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          unit: dimensionUnit
        }
      };

      if (req.file) {
        productFields.imageUrl = `/uploads/${req.file.filename}`;
      }

      const product = new Product(productFields);
      await product.save();

      res.status(201).json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  });
});

module.exports = router;
