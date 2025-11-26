const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');


router.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, "../stamp.txt"), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading stamp.txt:', err);
      return res.status(500).json({ ok: false, message: 'Server error' });
    }

    const time = data.trim();
    return res.json({ ok: true, message: 'Server is healthy', time });
  });
});

module.exports = router;
