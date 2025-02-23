const axios = require('axios');
const sharp = require('sharp');
const Image = require('../models/Image');
const Request = require('../models/Request');

const processImages = async () => {
  // Find all pending images
  const pendingImages = await Image.find({ status: 'Pending' });

  for (const img of pendingImages) {
    try {
      console.log(`Processing Image: ${img.inputUrl}`);

      // Validate the URL
      if (!img.inputUrl.startsWith('https://')) {
        console.error(`Invalid URL: ${img.inputUrl}`);
        img.status = 'Failed';
        await img.save();
        continue;
      }

      // Download the image
      const response = await axios.get(img.inputUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      // Check image format
      const metadata = await sharp(buffer).metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
        console.error(`Unsupported image format: ${metadata.format}`);
        img.status = 'Failed';
        await img.save();
        continue;
      }

      // Process and save the image
      const outputFileName = `public/images/${img.requestId}_${img.serialNumber}.jpg`;
      await sharp(buffer)
        .jpeg({ quality: 50 })
        .toFile(outputFileName);

      // Mark the image as completed
      img.outputUrl = outputFileName;
      img.status = 'Completed';
      await img.save();
    } catch (error) {
      console.error(`Error processing image ${img.inputUrl}:`, error);

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
    await Request.findOneAndUpdate({ requestId }, { status: newStatus, updatedAt: new Date() });
  }
};

module.exports = { processImages };


