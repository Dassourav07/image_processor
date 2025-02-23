const csv = require('csv-parser'); 
const fs = require('fs');
const Request = require('../models/Request');
const Image = require('../models/Image');

const uploadCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const request = new Request();
    await request.save();

    const images = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        // Log the row to check the column names
        console.log('Parsed Row:', row);

        // Ensure all required fields are present
        if (row.SerialNumber && row.ProductName && row.InputURL) {
          images.push({
            requestId: request.requestId,
            serialNumber: row.SerialNumber,
            productName: row.ProductName,
            inputUrl: row.InputURL,
          });
        } else {
          console.error('Missing fields in row:', row);
        }
      })
      .on('end', async () => {
        if (images.length > 0) {
          await Image.insertMany(images);
          res.json({ requestId: request.requestId });
        } else {
          res.status(400).json({ message: 'No valid data to insert' });
        }
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadCSV };
