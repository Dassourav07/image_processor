const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const RequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  status: {
    type: String,
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Request', RequestSchema);
