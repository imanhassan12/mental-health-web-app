const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// GET /api/video/meeting-link?appointmentId=...
router.get('/meeting-link', (req, res) => {
  try {
    const { appointmentId } = req.query;
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });
    // Generate a secure random string for the room
    const token = crypto.randomBytes(8).toString('hex');
    const room = `telehealth-${appointmentId}-${token}`;
    const url = `https://meet.jit.si/${room}`;
    res.json({ url });
  } catch (error) {
    console.error('Error generating meeting link:', error);
    res.status(500).json({ message: 'Failed to generate meeting link', error: error.message });
  }
});

module.exports = router; 