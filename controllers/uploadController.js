const csv = require('csv-parser'); 
const fs = require('fs');
const Request = require('../models/Request');
const Image = require('../models/Image');

// Upload CSV and save image data
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Create a new request
    const request = new Request();
    await request.save();

    const images = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        const urls = row['Input Image Urls'].split(','); // Split URLs
        urls.forEach(url => {
          images.push({
            requestId: request.requestId,
            serialNumber: row['S. No.'],
            productName: row['Product Name'],
            inputUrl: url.trim(),  // Trim to remove extra spaces
            status: 'Pending',     // Set initial status
          });
        });
      })
      .on('end', async () => {
        try {
          await Image.insertMany(images);
          res.json({ requestId: request.requestId });
        } catch (dbError) {
          console.error('Database Error:', dbError);
          res.status(500).json({ message: 'Failed to save images' });
        }
      });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'File processing failed' });
  }
};

module.exports = { uploadCSV };


