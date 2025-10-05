// routes/Teachers/chatbot.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Load environment variables with correct path (go up 2 directories to backend root)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const OpenAI = require('openai').default;
const ChatHistory = require('../../models/chatHistoryModel');

// Initialize OpenAI client with your secret key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Log API key status for debugging (without exposing the key)
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment variables!');
} else {
  console.log(`✅ OpenAI API Key loaded (starts with: ${process.env.OPENAI_API_KEY.substring(0, 7)}...)`);
}

/**
 * Get dyslexia-specific teaching context for the AI assistant
 */
function getDyslexiaTeachingContext(userType) {
  const baseContext = `You are the "Literexia Teaching Assistant" - an AI companion specialized in supporting Filipino K-12 students with dyslexia and reading difficulties.

CORE SYSTEM UNDERSTANDING:
- Assessment System: 5 reading levels (Low Emerging → At Grade Level) with 5 core skill categories
- 5 Reading Categories: Alphabet Knowledge, Phonological Awareness, Decoding, Word Recognition, Reading Comprehension
- Language Context: Primarily Filipino/Tagalog with English elements
- Population: K-12 Filipino students with dyslexia and reading difficulties

KEY DYSLEXIA-SPECIFIC CHALLENGES:
1. Phonological Awareness Difficulties - Problems distinguishing similar sounds (B-P, M-N, D-T)
2. Sequential Processing Issues - Trouble with 3+ sound sequences
3. Sound-Symbol Mapping - Difficulty connecting letters to sounds
4. Decoding Challenges - Problems sounding out words, especially initial sounds
5. Reading Comprehension Gaps - All-or-nothing understanding issues

ASSESSMENT SYSTEM:
- Students progress through reading levels only when ALL categories pass ≥75%
- Failed categories trigger teacher-created interventions with system prescriptions
- Error patterns include: B-P sound confusion, sequential processing difficulties, initial sound problems
- Intervention process: Prescription → Teacher creation → Student practice → Teacher revision if needed

RESEARCH-BASED APPROACHES TO RECOMMEND:
- Multisensory Learning (Visual + auditory + tactile approaches)
- Systematic Phonics (Structured, explicit sound-symbol instruction)
- Scaffolding (Breaking complex skills into smaller steps)
- Repeated Practice (Focused, targeted skill practice)
- Positive Reinforcement (Celebrating progress and effort)
- Metacognitive Strategies (Teaching students how they learn best)`;

  if (userType === 'student') {
    return baseContext + `

COMMUNICATION STYLE FOR STUDENTS:
- Use simple, clear language
- Break information into small chunks
- Be encouraging and patient
- Emphasize strengths while addressing challenges
- Avoid overwhelming with too much text
- Validate difficulties while promoting growth mindset
- Provide practical, actionable advice
- Use positive, motivating language

STUDENT SUPPORT FOCUS:
- Learning encouragement and motivation
- Simple explanations of reading concepts
- Home practice suggestions
- Self-advocacy skills
- Building confidence in learning abilities`;
  }

  // Default teacher context
  return baseContext + `

TEACHER SUPPORT FOCUS:
- Intervention strategy guidance
- Error pattern analysis interpretation
- Question creation assistance
- Progress monitoring techniques
- Differentiation strategies for specific student needs
- Research-based teaching methods
- Assessment result interpretation

INTERVENTION GUIDANCE:
- Help interpret error patterns from assessment results
- Suggest specific techniques for common dyslexia challenges
- Provide question creation guidance for teacher-made interventions
- Recommend modifications for near-miss cases (students scoring 70-74%)
- Support teachers in understanding prescriptive analytics results

Be practical, evidence-based, and supportive in all responses.`;
}

/**
 * POST /api/chatbot/ask
 * Request body: { prompt: string, model?: string, userType?: string }
 * Returns: { reply: string }
 */
router.post('/ask', async (req, res) => {
  const { prompt, model = 'gpt-4', userType = 'teacher' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    // Create dyslexia-specific system context
    const systemContext = getDyslexiaTeachingContext(userType);

    // Call the Chat Completions endpoint with proper context
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.5
    });

    const reply = completion.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'Failed to generate chatbot response' });
  }
});

/**
 * POST /api/chatbot/intervention-help
 * Help teachers with specific intervention scenarios
 * Request body: { studentData: object, question: string }
 */
router.post('/intervention-help', async (req, res) => {
  const { studentData, question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'No question provided' });
  }

  try {
    // Create context with student-specific data
    const systemContext = getDyslexiaTeachingContext('teacher') + `

CURRENT STUDENT CONTEXT:
${studentData ? `
- Student Performance: ${JSON.stringify(studentData, null, 2)}
- Focus on specific error patterns and scores shown above
- Provide targeted intervention strategies based on this student's specific needs
` : 'General intervention guidance requested - provide evidence-based dyslexia intervention strategies'}

Provide practical, specific advice that teachers can immediately implement.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 600,
      presence_penalty: 0.6,
      frequency_penalty: 0.5
    });

    const reply = completion.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'Failed to generate intervention guidance' });
  }
});

/**
 * POST /api/chatbot/student-encouragement
 * Provide encouragement and learning tips for students
 * Request body: { studentLevel: string, challenge: string, question: string }
 */
router.post('/student-encouragement', async (req, res) => {
  const { studentLevel, challenge, question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'No question provided' });
  }

  try {
    const systemContext = getDyslexiaTeachingContext('student') + `

STUDENT CONTEXT:
- Reading Level: ${studentLevel || 'Not specified'}
- Current Challenge: ${challenge || 'General support needed'}

Focus on:
- Being extremely encouraging and positive
- Using simple, age-appropriate language
- Providing concrete, actionable tips
- Building confidence and motivation
- Normalizing learning differences
- Celebrating effort and progress`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: question }
      ],
      temperature: 0.8,
      max_tokens: 400,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    });

    const reply = completion.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'Failed to generate student encouragement' });
  }
});

// Test route to verify API is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Literexia Teaching Assistant API is working!',
    endpoints: {
      '/ask': 'General dyslexia teaching assistance',
      '/intervention-help': 'Specific intervention guidance with student data',
      '/student-encouragement': 'Student-focused encouragement and tips',
      '/history/save': 'Save chat history',
      '/history/load': 'Load chat history for a user'
    }
  });
});

/**
 * POST /api/chatbot/history/save
 * Save chat messages to database
 * Request body: { userId: string, userType: string, sessionId: string, messages: array, category?: string, language?: string }
 */
router.post('/history/save', async (req, res) => {
  const { userId, userType, sessionId, messages, category = 'all', language = 'filipino' } = req.body;

  if (!userId || !userType || !sessionId || !messages) {
    return res.status(400).json({ error: 'Missing required fields: userId, userType, sessionId, messages' });
  }

  try {
    // Find existing chat history or create new one
    let chatHistory = await ChatHistory.findOne({ userId, userType, sessionId });

    if (chatHistory) {
      // Update existing chat history
      chatHistory.messages = messages;
      chatHistory.category = category;
      chatHistory.language = language;
      chatHistory.lastActivity = new Date();
    } else {
      // Create new chat history
      chatHistory = new ChatHistory({
        userId,
        userType,
        sessionId,
        messages,
        category,
        language
      });
    }

    await chatHistory.save();

    res.json({
      success: true,
      message: 'Chat history saved successfully',
      sessionId: chatHistory.sessionId
    });
  } catch (err) {
    console.error('Error saving chat history:', err);
    res.status(500).json({ error: 'Failed to save chat history' });
  }
});

/**
 * GET /api/chatbot/history/load/:userId/:userType
 * Load chat history for a user
 * Optional query params: sessionId, limit
 */
router.get('/history/load/:userId/:userType', async (req, res) => {
  const { userId, userType } = req.params;
  const { sessionId, limit = 10 } = req.query;

  if (!userId || !userType) {
    return res.status(400).json({ error: 'Missing required params: userId, userType' });
  }

  try {
    let query = { userId, userType };

    // If sessionId is provided, get specific session
    if (sessionId) {
      query.sessionId = sessionId;
      const chatHistory = await ChatHistory.findOne(query);
      return res.json({
        success: true,
        chatHistory: chatHistory || null
      });
    }

    // Otherwise, get most recent sessions
    const chatHistories = await ChatHistory.find(query)
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      chatHistories,
      count: chatHistories.length
    });
  } catch (err) {
    console.error('Error loading chat history:', err);
    res.status(500).json({ error: 'Failed to load chat history' });
  }
});

/**
 * GET /api/chatbot/history/sessions/:userId/:userType
 * Get all chat sessions for a user
 */
router.get('/history/sessions/:userId/:userType', async (req, res) => {
  const { userId, userType } = req.params;

  if (!userId || !userType) {
    return res.status(400).json({ error: 'Missing required params: userId, userType' });
  }

  try {
    const sessions = await ChatHistory.find({ userId, userType })
      .select('sessionId category language lastActivity createdAt messages')
      .sort({ lastActivity: -1 });

    // Map to include message count and preview
    const sessionsWithPreview = sessions.map(session => ({
      sessionId: session.sessionId,
      category: session.category,
      language: session.language,
      messageCount: session.messages.length,
      lastMessage: session.messages.length > 0 ? session.messages[session.messages.length - 1].text.substring(0, 100) : '',
      lastActivity: session.lastActivity,
      createdAt: session.createdAt
    }));

    res.json({
      success: true,
      sessions: sessionsWithPreview,
      count: sessionsWithPreview.length
    });
  } catch (err) {
    console.error('Error loading chat sessions:', err);
    res.status(500).json({ error: 'Failed to load chat sessions' });
  }
});

/**
 * DELETE /api/chatbot/history/:sessionId
 * Delete a specific chat session
 */
router.delete('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing required param: sessionId' });
  }

  try {
    const result = await ChatHistory.findOneAndDelete({ sessionId });

    if (!result) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting chat session:', err);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

module.exports = router;