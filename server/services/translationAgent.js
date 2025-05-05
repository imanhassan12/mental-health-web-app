const { OpenAI } = require('openai');

/**
 * Translate text to a target language using OpenAI GPT-4o.
 * @param {string} text
 * @param {string} targetLang (e.g., 'es', 'fr', 'zh')
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, targetLang) {
  // Lazy init: always use the latest OPENAI_API_KEY
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Translate the following text to ${targetLang}. Respond with ONLY the translated text, no commentary, no code block, no markdown.`;
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: text }
    ],
    temperature: 0.2,
    max_tokens: 400,
  });
  return res.choices[0].message.content.trim();
}

module.exports = { translateText }; 