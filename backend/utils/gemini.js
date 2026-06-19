const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is missing in backend/.env');
  }
  return new GoogleGenerativeAI(key);
}

async function generateText({ system, user, history = [], temperature = 0.5 }) {
  const genAI = getGeminiClient();

  // Model choice: fast + cheap for a school chatbot.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const chat = model.startChat({
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    generationConfig: { temperature }
  });

  const prompt = `${system ? system + "\n\n" : ''}${user}`;
  const result = await chat.sendMessage(prompt);
  const response = result.response;
  const text = response.text();

  return text;
}

module.exports = { generateText };
