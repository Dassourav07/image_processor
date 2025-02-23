const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  requestId: { type: String, required: true },
  serialNumber: { type: Number, required: true },
  productName: { type: String, required: true },
  inputUrl: { type: String, required: true },
  outputUrl: { type: String },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
});

module.exports = mongoose.model('Image', imageSchema);
