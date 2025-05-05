const { OpenAI } = require('openai');

/**
 * Analyze a session note for summary, key topics, mood indicators, action items, and suggested tags.
 * @param {string} noteText
 * @returns {Promise<{summary: string, keyTopics: string[], moodIndicators: string[], actionItems: string[], suggestedTags: string[]}>}
 */
async function analyzeNote(noteText) {
  // Lazy init: always use the latest OPENAI_API_KEY
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `You are a clinical documentation assistant. Given the following session note, extract:
- A concise summary (1-2 sentences)
- Key topics (comma-separated)
- Mood indicators (e.g., "anxious", "depressed")
- Action items (if any)
- Suggested tags (e.g., "anxiety", "medication", "follow-up")

Respond with ONLY valid JSON, no markdown, no commentary, and no code block. Do not include any text before or after the JSON.

Example:
{
  "summary": "Client reports feeling very low and anxious.",
  "keyTopics": ["low mood", "anxiety"],
  "moodIndicators": ["low", "anxious"],
  "actionItems": [],
  "suggestedTags": ["anxiety", "low mood"]
}

Session Note: ${noteText}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 300,
  });
  const text = res.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from the response using regex
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {}
    }
    return { summary: '', keyTopics: [], moodIndicators: [], actionItems: [], suggestedTags: [], raw: text };
  }
}

module.exports = { analyzeNote }; 