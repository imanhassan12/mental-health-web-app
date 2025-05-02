const fs = require('fs');
const express = require('express');
const router = express.Router();
const path = require('path');
const { Consent } = require('../models');
const jwt = require('jsonwebtoken');
const { Practitioner } = require('../models');
const db = require('../models');

// Minimal requireAuth middleware (any authenticated user)
async function requireAuth(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized (no token)' });
  }
  let payload = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized (invalid token)' });
  }
  // Look up user in Practitioner table
  const user = await Practitioner.findByPk(payload.id);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized (user not found)' });
  }
  req.user = user;
  next();
}

// GET /api/privacy-policy - returns the current privacy policy text
router.get('/privacy-policy', async (req, res) => {
  const policyPath = path.join(__dirname, '../privacy-policy.txt');
  if (!fs.existsSync(policyPath)) return res.status(404).json({ message: 'Privacy policy not found' });
  const text = fs.readFileSync(policyPath, 'utf8');
  res.json({ text, version: '1.0' });
});

// POST /api/consent - record user consent
router.post('/consent', requireAuth, async (req, res) => {
  const { userId, version } = req.body;
  if (!userId || !version) return res.status(400).json({ message: 'Missing userId or version' });
  await Consent.create({ userId, version, timestamp: new Date() });
  res.json({ success: true });
});

// GET /api/consent/me - get current user's consent status
router.get('/consent/me', requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  const consent = await Consent.findOne({ where: { userId: req.user.id }, order: [['timestamp', 'DESC']] });
  res.json(consent);
});

// Get current user's preferred language
router.get('/me/language', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await db.Practitioner.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ preferredLanguage: user.preferredLanguage || 'en' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get preferred language', error: error.message });
  }
});

// Set current user's preferred language
router.post('/me/language', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { preferredLanguage } = req.body;
    if (!preferredLanguage) return res.status(400).json({ message: 'preferredLanguage is required' });
    const user = await db.Practitioner.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.preferredLanguage = preferredLanguage;
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set preferred language', error: error.message });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth; 