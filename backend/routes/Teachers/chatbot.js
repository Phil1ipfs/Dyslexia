// routes/Teachers/chatbot.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Initialize Google Gen AI (Unified SDK)
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'literexia-capstone-project',
  location: 'global'
});

/**
 * Optimized Title Generator
 */
function generateSessionTitle(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return 'New Teaching Session';
  const userMsg = messages.find(m => m.sender === 'user' && m.text)?.text || '';
  if (!userMsg) return 'New Teaching Session';
  return userMsg.split(/[.!?\n]/)[0].trim().split(/\s+/).slice(0, 8).join(' ') || 'Chat Session';
}

const ChatHistory = require('../../models/chatHistoryModel');

/**
 * Dyslexia-Specific System Instructions
 */
function getSystemInstructions(userType) {
  const base = `You are the "Literexia Teaching Assistant" - a world-class educational expert specialized in Filipino K-12 students with dyslexia and reading difficulties.

PERSONALITY & TONE (CONVERSATIONAL & SLIGHTLY CONYO):
- Be super warm, conversational, and friendly. Speak like a supportive mentor using modern "Conyo" Taglish (Tagalog-English mix).
- STYLE: Use natural, conversational "Taglish." Feel free to use "Actually," "Anyway," or "Wait, 'yung..." 
- ❌ NO DEEP TAGALOG: Strictly avoid "sobrang lalim" or archaic Tagalog words. Stick to how people actually talk nowadays.
- ❌ NO MARKDOWN: Do NOT use bold (**), headers (##), or any markdown symbols. Use plain text only. If you need to emphasize, just use capitalization or descriptive words.
- Be concise but helpful. Don't be too formal.

CORE DYSLEXIA EXPERTISE:
- You are a master of "Workarounds" (diskarte):
  - Multisensory: Using sand trays, shaving cream, or sandpaper letters.
  - Mnemonics: e.g., "b" has a belly, "d" has a diaper.
  - Sequential Processing: Break instructions into simple, single points.
  - Visual Stress: Suggest color overlays or extra spacing.
- Categories: Master of Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, and Comprehension.

PEDAGOGICAL STRATEGIES:
- Systematic Phonics: Smallest sound first.
- Scaffolding (Alalay): Support early, then let them lead.
- Metacognition: Explain *how* their brain works.`;

  if (userType === 'student') {
    return `${base}\n\nSTUDENT FOCUS: Be super encouraging and use easy-to-understand Taglish. Be their biggest cheerleader! If they struggle, say something like "It's okay, wait, let's try another way!" Use fun and simple words. Keep the vibe high-energy and positive!`;
  }
  return `${base}\n\nTEACHER FOCUS: Be a "co-teacher" or a helpful partner. Give actionable, creative intervention plans using conversational Taglish. Instead of being super formal, just talk like you're brainstorming with a colleague. Explain the "why" simply.`;
}

/**
 * Core Optimized Generation Logic with Vertex AI
 */
async function generateResponse(prompt, userType, temperature = 0.7) {
  try {
    // Using gemini-2.5-flash as confirmed by global availability test
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        { role: 'user', parts: [{ text: getSystemInstructions(userType) }] },
        { role: 'model', parts: [{ text: 'Maliwanag po. Handa na akong tumulong bilang Literexia Teaching Assistant.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        temperature,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ]
      }
    });

    console.log('✅ Google Gen AI (Gemini 2.5 Pro) response generated successfully');

    // Clean up any stray markdown formatting as requested
    const cleanText = response.text
      .replace(/\*\*/g, '')
      .replace(/##/g, '')
      .replace(/#{1,6}\s?/g, '') // Remove any header hash symbols
      .trim();

    return cleanText;

  } catch (aiError) {
    console.error('⚠️ Google Gen AI Failed:', aiError.message);

    // FALLBACK TO OPENAI
    try {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) throw new Error('OPENAI_API_KEY not set');
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: openAiKey });

      console.log('🔄 Falling back to OpenAI...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: getSystemInstructions(userType) },
          { role: "user", content: prompt }
        ],
        temperature
      });
      return completion.choices[0].message.content;
    } catch (openaiError) {
      throw new Error('Nagkaproblema sa pag-abot sa AI services. Subukan muli maya-maya.');
    }
  }
}

/**
 * ROUTES
 */
router.post('/ask', async (req, res) => {
  const { prompt, userType = 'teacher' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  try {
    const reply = await generateResponse(prompt, userType);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/intervention-help', async (req, res) => {
  const { studentData, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  const contextPrompt = studentData ? `Data: ${JSON.stringify(studentData)}. \n\nQ: ${question}` : question;
  try {
    const reply = await generateResponse(contextPrompt, 'teacher');
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/student-encouragement', async (req, res) => {
  const { studentLevel, challenge, question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });
  const contextPrompt = `Level: ${studentLevel}. Challenge: ${challenge}. \n\nStudent asks: ${question}`;
  try {
    const reply = await generateResponse(contextPrompt, 'student', 0.8);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/history/save', async (req, res) => {
  const { userId, userType, sessionId, messages } = req.body;
  if (!userId || !sessionId || !messages) return res.status(400).json({ error: 'Missing data' });
  try {
    await ChatHistory.findOneAndUpdate(
      { userId, userType, sessionId },
      { messages, lastActivity: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/history/load/:userId/:userType', async (req, res) => {
  const { userId, userType } = req.params;
  const { sessionId } = req.query;
  try {
    const history = await ChatHistory.findOne({ userId, userType, sessionId });
    if (!history) {
      return res.status(404).json({ error: 'Chat history not found' });
    }
    res.json({ success: true, messages: history.messages });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/history/sessions/:userId/:userType', async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.params.userId })
      .select('sessionId messages lastActivity createdAt')
      .sort({ lastActivity: -1 });
    const results = sessions.map(s => ({
      sessionId: s.sessionId,
      title: generateSessionTitle(s.messages),
      lastActivity: s.lastActivity,
      messageCount: s.messages.length
    }));
    res.json({ success: true, sessions: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

router.delete('/history/:sessionId', async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ sessionId: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;