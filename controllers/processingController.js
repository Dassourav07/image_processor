const axios = require('axios');
const sharp = require('sharp');
const Image = require('../models/Image');
const Request = require('../models/Request');

const processImages = async () => {
  const pendingImages = await Image.find({ status: 'Pending' });

  for (const img of pendingImages) {
    try {
      const response = await axios({
        url: img.inputUrl,
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data, 'binary');
      const outputFileName = `public/images/${img.requestId}_${img.serialNumber}.jpg`;

      await sharp(buffer)
        .jpeg({ quality: 50 })
        .toFile(outputFileName);

      img.outputUrl = outputFileName;
      img.status = 'Completed';
      await img.save();
    } catch (error) {
      console.error(`Error processing image ${img.inputUrl}:`, error.message);
      img.status = 'Failed';  // Update status to Failed on error
      await img.save();
    }
  }

  // Check and update request statuses
  const requestIds = [...new Set(pendingImages.map(img => img.requestId))];
  for (const requestId of requestIds) {
    const images = await Image.find({ requestId });
    const allCompleted = images.every(img => img.status === 'Completed');
    const allFailed = images.every(img => img.status === 'Failed');
    
    let newStatus = 'Partial';
    if (allCompleted) newStatus = 'Completed';
    if (allFailed) newStatus = 'Failed';
    
    await Request.findOneAndUpdate({ requestId }, { status: newStatus });
  }
};

module.exports = { processImages };

