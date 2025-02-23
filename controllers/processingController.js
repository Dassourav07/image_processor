const axios = require('axios');
const sharp = require('sharp');
const Image = require('../models/Image');
const Request = require('../models/Request');

const processImages = async () => {
  // Find all pending images
  const pendingImages = await Image.find({ status: 'Pending' });

  for (const img of pendingImages) {
    try {
      // Download the image
      const response = await axios({
        url: img.inputUrl,
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data, 'binary');
      const outputFileName = `public/images/${img.requestId}_${img.serialNumber}.jpg`;

      // Process and save the image
      await sharp(buffer)
        .jpeg({ quality: 50 })
        .toFile(outputFileName);

      // Mark the image as completed
      img.outputUrl = outputFileName;
      img.status = 'Completed';
      await img.save();
    } catch (error) {
      console.error(`Error processing image ${img.inputUrl}:`, error.message);

      // Mark the image as failed
      img.status = 'Failed';
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
};

module.exports = { processImages };

