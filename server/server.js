// server.js
const express = require('express');
const app = express();
const path = require('path');

// Middleware to parse JSON bodies
app.use(express.json());

// Import routes (we'll create these next)
const checkinRoutes = require('./routes/checkin');
const audioUploadRoutes = require('./routes/audioUpload');

// Use routes with a common API prefix
app.use('/api', checkinRoutes);
app.use('/api', audioUploadRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

