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
        images.push({
          requestId: request.requestId,
          serialNumber: row.SerialNumber,
          productName: row.ProductName,
          inputUrl: row.InputURL,
        });
      })
      .on('end', async () => {
        await Image.insertMany(images);
        res.json({ requestId: request.requestId });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadCSV };
