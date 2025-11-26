const ShipmentHistory = require('../models/ShipmentHistory');

/**
 * Logs a shipment event to the ShipmentHistory collection
 * @param {string} shipmentId - The shipment ID to log the event for
 * @param {string} event - The event name (e.g., "Shipment Created", "Packing Updated")
 * @param {Object} [meta={}] - Additional metadata to store with the event
 * @returns {Promise<void>}
 */
async function logShipmentEvent(shipmentId, event, meta = {}) {
    try {
        await ShipmentHistory.create({
            shipmentId,
            event,
            meta,
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error logging shipment event:', error);
        // Don't throw the error to avoid breaking the main operation
    }
}

module.exports = logShipmentEvent;
