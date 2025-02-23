const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const Image = require('../models/Image');
const Request = require('../models/Request');

const processImages = async () => {
  try {
    // Find all pending images
    const pendingImages = await Image.find({ status: 'Pending' });

    for (const img of pendingImages) {
      try {
        console.log(`Processing image: ${img.inputUrl}`);
        
        // Check URL validity
        if (!img.inputUrl.startsWith('http')) {
          throw new Error('Invalid URL');
        }

        // Download the image
        const response = await axios({
          url: img.inputUrl,
          responseType: 'arraybuffer',
          validateStatus: (status) => status < 500  // Reject only if the status code is greater than or equal to 500
        });

        // Check for non-200 status
        if (response.status !== 200) {
          throw new Error(`Failed to download image. Status: ${response.status}`);
        }

        const buffer = Buffer.from(response.data, 'binary');
        const outputDir = path.join(__dirname, '../public/images');
        
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFileName = path.join(outputDir, `${img.requestId}_${img.serialNumber}.jpg`);

        // Process and save the image
        await sharp(buffer)
          .jpeg({ quality: 50 })
          .toFile(outputFileName);

        // Mark the image as completed
        img.outputUrl = `/images/${img.requestId}_${img.serialNumber}.jpg`;
        img.status = 'Completed';
        await img.save();
      } catch (error) {
        console.error(`Error processing image ${img.inputUrl}:`, error.message);

        // Mark the image as failed with error message
        img.status = 'Failed';
        img.errorMessage = error.message;
        await img.save();
      }
    }

    // Check and update request statuses
    const requestIds = [...new Set(pendingImages.map(img => img.requestId))];
    for (const requestId of requestIds) {
      const images = await Image.find({ requestId });
      const allCompleted = images.every(img => img.status === 'Completed');
      const allFailed = images.every(img => img.status === 'Failed');

      // Determine new status
      let newStatus = 'Partial';
      if (allCompleted) newStatus = 'Completed';
      if (allFailed) newStatus = 'Failed';

      // Update the request status
      await Request.findOneAndUpdate({ requestId }, { status: newStatus });
    }
  } catch (err) {
    console.error('Processing error:', err.message);
  }
};

module.exports = { processImages };

