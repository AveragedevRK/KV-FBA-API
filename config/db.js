const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rrr:Devel166x6@cluster0.keh3e.gcp.mongodb.net/KV-FBA?appName=Cluster0';

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log("Mongo already connected");
    return;
  }
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    // drop shipments collection

    console.log("MongoDB connected:", conn.connection.host);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

module.exports = { connectDB };

// Create the routes directory if it doesn't exist
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', 'routes');
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
}
