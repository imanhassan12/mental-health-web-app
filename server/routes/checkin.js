// routes/checkin.js
const express = require('express');
const router = express.Router();

// Endpoint for receiving check-in data
router.post('/checkin', (req, res) => {
  const { mood, message } = req.body;
  console.log('Received check-in:', { mood, message });
  res.json({ message: 'Check-in received successfully' });
});

module.exports = router;

