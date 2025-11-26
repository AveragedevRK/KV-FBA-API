const mongoose = require('mongoose');

const shipmentHistorySchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups by shipmentId and sorting by date
shipmentHistorySchema.index({ shipmentId: 1, createdAt: -1 });

module.exports = mongoose.model('ShipmentHistory', shipmentHistorySchema);
