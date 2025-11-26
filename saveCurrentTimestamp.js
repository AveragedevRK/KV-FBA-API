const fs = require('fs');
const path = require('path');


const currentTimestamp = new Date().toLocaleString();

const filePath = path.join(__dirname, 'stamp.txt');

fs.writeFile(filePath, currentTimestamp, (err) => {
  if (err) {
    console.error('Error writing current timestamp to file:', err);
  } else {
    console.log('Current timestamp saved to stamp.txt');
  }
});
