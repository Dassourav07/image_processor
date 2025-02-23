const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
  },
  serialNumber: {
    type: Number,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  inputUrl: {
    type: String,
    required: true,
  },
  outputUrl: {
    type: String,
  },
  status: {
    type: String,
    default: 'Pending',
  },
});

module.exports = mongoose.model('Image', ImageSchema);
