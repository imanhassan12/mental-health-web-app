const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Translate text to a target language using OpenAI GPT-4o.
 * @param {string} text
 * @param {string} targetLang (e.g., 'es', 'fr', 'zh')
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, targetLang) {
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