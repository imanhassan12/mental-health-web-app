// routes/audioUpload.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Use memory storage for simplicity
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint for uploading an audio file
router.post('/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  // For demonstration, save the file to a local "uploads" directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  const filePath = path.join(uploadsDir, req.file.originalname);
  fs.writeFile(filePath, req.file.buffer, (err) => {
    if (err) {
      console.error('Error saving audio file:', err);
      return res.status(500).json({ error: 'Error saving file' });
    }
    res.json({ message: 'Audio file saved successfully', path: filePath 
});
  });
});

module.exports = router;

