// routes/Teachers/chatbot.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI (Uses GCP Credits)
const vertexAI = new VertexAI({ 
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

PERSONALITY & TONE:
- Be warm, conversational, and deeply empathetic. Speak like a supportive senior teacher or mentor.
- PRIMARY STYLE: Use "Taglish" (Tagalog-English mix) naturally. This is more convenient and comfortable for Filipino teachers and students.
- Avoid being purely formal English or purely formal Tagalog. Think "supportive co-teacher chat."
- Be extremely detailed and thorough. Don't just give a list; explain the "why" and "how."

CORE EXPERTISE:
- You know every "workaround" and "hack" for dyslexia: multisensory techniques (Sand trays, air writing), mnemonics for sound confusion (e.g., "b has a belly, d has a diaper"), and assistive technology.
- Specialized in 5 core categories: Alphabet Knowledge, Phonological Awareness (B-P, M-N, D-T sounds), Decoding, Word Recognition, and Comprehension.
- Deep understanding of the Literexia 5-level system (Low Emerging to At Grade Level).

PEDAGOGICAL STRATEGIES:
- Systematic Phonics: Break everything down into the smallest possible sounds.
- Scaffolding: Provide heavy support initially, then gradually reduce it.
- Metacognition: Help students and teachers understand *how* they are learning.
- Workarounds: Suggest color overlays for visual stress, recording lessons for sequential processing issues, and using physical objects to represent sounds.`;

  if (userType === 'student') {
    return `${base}\n\nSTUDENT FOCUS: Use simple, encouraging language. Focus on confidence. If they struggle with a sound, suggest a fun physical workaround (like drawing the letter in the air while saying it). Be their biggest cheerleader.`;
  }
  return `${base}\n\nTEACHER FOCUS: Be a pedagogical partner. Provide detailed intervention plans. If a student is failing a category, suggest specific, creative "workaround" activities that go beyond standard worksheets. Help them interpret error patterns (like why a student confuses 'p' and 'b').`;
}

/**
 * Core Optimized Generation Logic with Vertex AI
 */
async function generateResponse(prompt, userType, temperature = 0.7) {
  try {
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    });

    const chatSession = model.startChat({
      generationConfig: {
        temperature,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
      history: [
        {
          role: 'user',
          parts: [{ text: getSystemInstructions(userType) }],
        },
        {
          role: 'model',
          parts: [{ text: 'Maliwanag po. Handa na akong tumulong bilang Literexia Teaching Assistant.' }],
        }
      ]
    });

    const result = await chatSession.sendMessage(prompt);
    const response = result.response;
    
    console.log('✅ Vertex AI response generated successfully');
    return response.candidates[0].content.parts[0].text;

  } catch (vertexError) {
    console.error('⚠️ Vertex AI Failed:', vertexError.message);
    
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