const csv = require('csv-parser');
const fs = require('fs');
const Request = require('../models/Request');
const Image = require('../models/Image');
const path = require('path');

// Function to validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// Upload CSV and save image data
const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create a new request
    const request = new Request();
    await request.save();

    const images = [];
    const filePath = path.resolve(req.file.path);

    // Read and process the CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const urls = row['Input Image Urls'].split(','); // Split URLs
        urls.forEach((url, index) => {
          const trimmedUrl = url.trim();
          
          // Validate URL
          if (isValidUrl(trimmedUrl)) {
            images.push({
              requestId: request.requestId,
              serialNumber: `${row['S. No.']}_${index + 1}`, // Ensure unique serial number
              productName: row['Product Name'],
              inputUrl: trimmedUrl,
              status: 'Pending', // Set initial status
            });
          } else {
            console.warn(`Invalid URL skipped: ${trimmedUrl}`);
          }
        });
      })
      .on('end', async () => {
        try {
          // Save images in bulk
          if (images.length > 0) {
            await Image.insertMany(images);
            res.json({ requestId: request.requestId, message: 'Images uploaded successfully' });
          } else {
            res.status(400).json({ message: 'No valid image URLs found' });
          }
        } catch (dbError) {
          console.error('Database Error:', dbError);
          res.status(500).json({ message: 'Failed to save images' });
        }
      })
      .on('error', (error) => {
        console.error('CSV Processing Error:', error);
        res.status(500).json({ message: 'CSV file processing failed' });
      });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'File processing failed' });
  }
};

module.exports = { uploadCSV };



