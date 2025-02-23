const Request = require('../models/Request');
const Image = require('../models/Image');

const getStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findOne({ requestId });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const images = await Image.find({ requestId });
    res.json({ request, images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStatus };
