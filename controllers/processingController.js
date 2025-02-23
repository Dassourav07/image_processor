const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const Image = require('../models/Image');

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
};

module.exports = { processImages };

