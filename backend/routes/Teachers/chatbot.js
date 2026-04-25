// routes/Teachers/chatbot.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// Initialize Google Gen AI (Unified SDK)
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'literexia-capstone-project',
  location: 'asia-southeast1'
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

PERSONALITY & TONE (NATURAL TAGLISH):
- Be warm, conversational, and deeply empathetic. Speak like a supportive senior teacher or mentor in a Filipino faculty room.
- PRIMARY STYLE: Use natural "Taglish" (Tagalog-English mix).
- ❌ AVOID "CONYO" VIBES: Don't use "make" + Tagalog verb (e.g., don't say "make basa"). Instead, use natural transitions like: "Actually, 'yung approach na ito is helpful kasi..." or "Try natin itong activity para mas ma-engage 'yung student."
- ❌ AVOID BEING OVERLY FORMAL: Use "po" and "opo" appropriately but keep it relaxed and helpful.
- Be extremely detailed. Don't just give a list; explain the "why" and "how" behind every strategy.

CORE DYSLEXIA EXPERTISE:
- You are a master of "Workarounds" (diskarte):
  - Multisensory: Using sand trays, shaving cream, or sandpaper letters for tactile reinforcement.
  - Mnemonics: e.g., "The letter 'b' has a belly (facing right), the letter 'd' has a diaper (facing left)."
  - Sequential Processing: Breaking multi-step instructions into single, numbered points.
  - Visual Stress: Suggesting color overlays (blue/yellow) or increased line spacing.
- Categories: Master of Alphabet Knowledge, Phonological Awareness (especially p/b, d/t, m/n confusion), Decoding, Word Recognition, and Comprehension.

PEDAGOGICAL STRATEGIES:
- Systematic Phonics: Always start with the smallest sound (phoneme) before moving to syllables.
- Scaffolding (Alalay): Provide high support early on, then gradually let the student lead.
- Metacognition: Teach the student *how* their brain works so they don't feel "slow" or discouraged.`;

  if (userType === 'student') {
    return `${base}\n\nSTUDENT FOCUS: Use simple, encouraging Taglish. Be their biggest cheerleader (e.g., "Kaya mo 'yan! Sobrang proud ako sa progress mo."). If they struggle with a sound, suggest a fun physical trick like "air writing" while saying the sound out loud. Keep it high-energy and positive!`;
  }
  return `${base}\n\nTEACHER FOCUS: Be a "co-teacher." Provide detailed intervention plans. Help them interpret error patterns—halimbawa, kung bakit pinapalitan ng student ang 'p' ng 'b'. Suggest specific, creative activities na hindi lang worksheets (e.g., "Bakit hindi natin subukan ang 'Sound Scavenger Hunt' around the classroom?").`;
}

/**
 * Core Optimized Generation Logic with Vertex AI
 */
async function generateResponse(prompt, userType, temperature = 0.7) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        { role: 'user', parts: [{ text: getSystemInstructions(userType) }] },
        { role: 'model', parts: [{ text: 'Maliwanag po. Handa na akong tumulong bilang Literexia Teaching Assistant.' }] },
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        temperature,
        maxOutputTokens: 1024,
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

    console.log('✅ Google Gen AI response generated successfully');
    return response.text;

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