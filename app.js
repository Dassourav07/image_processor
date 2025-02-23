const express = require('express');
const connectDB = require('./config/db');
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');
const { processImages } = require('./controllers/processingController');

const app = express();

connectDB();

app.use(express.json());
app.use('/upload', uploadRoutes);
app.use('/status', statusRoutes);

setInterval(processImages, 5000); // Process images every 5 seconds

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
