const express = require('express');
const router = express.Router();
const { translateText } = require('../services/translationAgent');

// POST /api/translate
router.post('/', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) return res.status(400).json({ message: 'text and targetLang are required' });
  try {
    const translatedText = await translateText(text, targetLang);
    res.json({ translatedText });
  } catch (error) {
    res.status(500).json({ message: 'Translation failed', error: error.message });
  }
});

module.exports = router; 