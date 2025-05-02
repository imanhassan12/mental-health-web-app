const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Multi-turn reasoning: The agent will first summarize the data, then ask itself what risk factors are present, then decide on a risk level, and finally explain its reasoning.
 */
async function getRiskPrediction({ sessionNotes, moodRatings, appointments }) {
  // Step 1: Summarize the data
  const summaryPrompt = `You are a clinical mental health assistant. Summarize the following session notes and mood ratings for a mental health client. Be concise, objective, and professional.\nSession Notes: ${sessionNotes.map(n => n.content).join(' | ')}\nMood Ratings: ${moodRatings.join(', ')}\nMissed Appointments: ${appointments.filter(a => a.status === 'missed').length}`;
  const summaryRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: summaryPrompt }],
    temperature: 0.2,
    max_tokens: 200,
  });
  const summary = summaryRes.choices[0].message.content;

  // Step 2: Identify risk factors
  const riskFactorsPrompt = `Given this summary, what risk factors are present? Respond concisely and professionally.\nSummary: ${summary}`;
  const riskFactorsRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: riskFactorsPrompt }],
    temperature: 0.2,
    max_tokens: 150,
  });
  const riskFactors = riskFactorsRes.choices[0].message.content;

  // Step 3: Decide risk level
  const riskLevelPrompt = `You are a clinical mental health assistant. Based on the following risk factors, assign a risk level and explain your reasoning.\n\nRespond ONLY in the following JSON format, with no extra text, commentary, or markdown.\n\n{\n  \"risk\": \"Low\" | \"Medium\" | \"High\",\n  \"factors\": \"A concise, professional explanation of why this risk level was chosen.\"\n}\n\nExample:\n{\n  \"risk\": \"Medium\",\n  \"factors\": \"The client has had multiple low mood ratings and missed appointments in the last two weeks.\"\n}\n\nRisk Factors: ${riskFactors}`;
  const riskLevelRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: riskLevelPrompt }],
    temperature: 0.2,
    max_tokens: 200,
  });
  const text = riskLevelRes.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch (e) {
    return { risk: "Unknown", factors: text };
  }
}

module.exports = { getRiskPrediction }; 