/**
 * server.ts - Full-Stack Express Server for AI Tutor
 *
 * Professional AI-powered tutor for students from LKG to Class 12.
 * - LKG & UKG: Automatic visual image/SVG generation for every answer
 * - Class 1 to 2: Early learning friendly teacher
 * - Class 3 to 8: Concept mastery with check questions
 * - Class 9 to 12: Step-by-step STEM and formula tutoring
 * - English instruction throughout
 * - Student authentication with name & password
 * - 5-Question MCQ Quiz generator with automated schema retry
 * - In-memory learning analytics & weak topics
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { findUser, loginUser, registerUser, updateUserProfile, saveQuizResult, getResults, getWeakTopics } from './db.js';

// Load environment variables with override
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Parse incoming JSON requests
app.use(express.json());

// Initialize Google Gemini AI SDK on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Primary fast model + fallback model
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-3.8-flash';

/**
 * Robust helper to call Gemini with automatic fallback on high demand spikes
 */
async function generateContentWithFallback(params: {
  contents: unknown;
  config?: Record<string, unknown>;
}) {
  try {
    return await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: params.contents as any,
      config: params.config,
    });
  } catch (primaryErr: any) {
    console.warn(`Primary model (${PRIMARY_MODEL}) failed:`, primaryErr?.message || primaryErr);
    console.log(`Falling back to ${FALLBACK_MODEL}...`);
    return await ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: params.contents as any,
      config: params.config,
    });
  }
}

/**
 * Build tailored system prompt based on the student's class band
 */
function getSystemPrompt(studentClass: string, subject?: string): string {
  const normClass = (studentClass || '').trim().toUpperCase();

  let bandPrompt = '';

  // 1. Kindergarten (LKG & UKG): Require visual image/SVG generation!
  if (normClass === 'LKG' || normClass === 'UKG') {
    bandPrompt = `You are a cheerful kindergarten teacher for a child aged 3 to 5 in ${normClass}.
Use very short sentences, simple words, and enthusiastic praise.
IMPORTANT VISUAL REQUIREMENT: ALWAYS generate and include a colorful, clean, standalone SVG illustration (<svg viewBox="0 0 240 240" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">...</svg>) in your response that visually illustrates your explanation (for example: smiling animals, bright red apples, yellow sun, counting shapes with numbers, balloons, etc.). Use friendly curved shapes, cute smiling faces, and bright cheerful colors so the child learns visually.`;
  }
  // 2. Junior Band (Classes 1 and 2)
  else if (normClass === '1' || normClass === '2' || normClass === 'CLASS 1' || normClass === 'CLASS 2') {
    bandPrompt = `You are a friendly teacher for a young child aged 6 to 7 in Class ${studentClass}. Use short sentences, simple everyday words and one familiar real-life example. Be encouraging and warm.`;
  }
  // 3. Senior Band (Classes 9 to 12)
  else if (
    normClass === '9' ||
    normClass === '10' ||
    normClass === '11' ||
    normClass === '12' ||
    ['CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'].includes(normClass)
  ) {
    bandPrompt = `You are an expert tutor for a Class ${studentClass} high school student. Provide step-by-step academic explanations with exact formulas, derivations, and units where needed. Show the working clearly. Guide the student through the problem rather than merely giving an answer.`;
  }
  // 4. Middle Band (Classes 3 to 8 - Default fallback)
  else {
    bandPrompt = `You are a patient, engaging teacher for a student in Class ${studentClass}. Explain concepts clearly using an intuitive real-life analogy, then conclude with one short check question to verify understanding.`;
  }

  const subjectContext = subject ? ` The subject is ${subject}.` : '';
  const commonSuffix = ` Reply in clear English. Only answer educational and study-related questions. If asked anything completely inappropriate or unrelated to learning, politely guide the student back to their lessons.`;

  return `${bandPrompt}${subjectContext}${commonSuffix}`;
}

// -------------------------------------------------------------
// 1. LOGIN & PROFILE ROUTES
// POST /api/login -> body: { name, password, class, action: 'signin' | 'register' }
// -------------------------------------------------------------
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { name, password, class: studentClass, action } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your student name.' });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    // Registration flow
    if (action === 'register') {
      const regResult = await registerUser({
        name: name.trim(),
        password: password.trim(),
        class: studentClass || '5',
      });

      if (!regResult.success) {
        return res.status(400).json({ error: regResult.error });
      }

      return res.json({ success: true, user: regResult.user });
    }

    // Sign In flow (Validates that student exists and password is correct)
    const loginResult = await loginUser(name.trim(), password.trim());
    if (!loginResult.success) {
      return res.status(401).json({ error: loginResult.error });
    }

    // Update active class if chosen during sign-in
    if (studentClass && loginResult.user) {
      loginResult.user.class = studentClass;
    }

    return res.json({ success: true, user: loginResult.user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Please try again.' });
  }
});

// Update profile route
app.post('/api/profile/update', async (req: Request, res: Response) => {
  try {
    const { id, class: studentClass } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required.' });
    }
    const updated = await updateUserProfile(id, { class: studentClass, language: 'English' });
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Please try again.' });
  }
});

// -------------------------------------------------------------
// 2. CHAT ROUTE
// POST /api/chat -> body: { class, subject, messages }
// -------------------------------------------------------------
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { class: studentClass, subject, messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'No questions or messages provided.' });
    }

    // Filter valid messages and slice up to the last 6 messages
    const validMessages = messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(-6);

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'Please ask a valid question.' });
    }

    // Ensure the first message sent to Gemini has role: 'user'
    let startIndex = 0;
    while (startIndex < validMessages.length && validMessages[startIndex].role === 'assistant') {
      startIndex++;
    }
    const trimmed = validMessages.slice(startIndex);

    // Build properly alternating multiturn contents for Gemini
    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const msg of trimmed) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += '\n' + msg.content;
      } else {
        contents.push({ role, parts: [{ text: msg.content }] });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: validMessages[validMessages.length - 1].content }],
      });
    }

    // Build the system prompt tailored to the student's class band
    const systemInstruction = getSystemPrompt(studentClass, subject);

    // Call Gemini API with maximum 1000 tokens limit and resilient fallback
    const response = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I am ready to help you learn! Ask me any question.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error?.message || error);
    return res.status(500).json({ error: 'Please try again.' });
  }
});

// -------------------------------------------------------------
// 3. QUIZ GENERATION ROUTE
// POST /api/quiz/generate -> body: { class, subject, topic }
// -------------------------------------------------------------
interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // 0, 1, 2, or 3
  explanation: string;
}

function isValidQuiz(data: unknown): data is QuizQuestion[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  for (const q of data) {
    if (typeof q?.question !== 'string' || !q.question.trim()) return false;
    if (!Array.isArray(q?.options) || q.options.length !== 4) return false;
    for (const opt of q.options) {
      if (typeof opt !== 'string' || !opt.trim()) return false;
    }
    if (typeof q?.answer !== 'number' || q.answer < 0 || q.answer > 3) return false;
    if (typeof q?.explanation !== 'string') return false;
  }
  return true;
}

async function fetchQuizFromAI(
  studentClass: string,
  subject: string,
  topic: string
): Promise<QuizQuestion[]> {
  const prompt = `Create exactly 5 multiple choice questions for a Class ${studentClass} student studying "${subject}" on the topic "${topic}".
Language: English.
The difficulty and vocabulary must be strictly appropriate for Class ${studentClass}.
Options must be 4 distinct choices.
"answer" must be the 0-based index of the correct option (0, 1, 2, or 3).
"explanation" must clearly explain why that option is correct.
Return ONLY a valid JSON array of 5 objects matching this structure:
[
  {
    "question": "What is ...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Because..."
  }
]`;

  const response = await generateContentWithFallback({
    contents: prompt,
    config: {
      maxOutputTokens: 1000,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            answer: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ['question', 'options', 'answer', 'explanation'],
        },
      },
    },
  });

  const text = (response.text || '').trim();
  const parsed = JSON.parse(text);
  if (!isValidQuiz(parsed)) {
    throw new Error('Generated quiz does not match required structure');
  }
  return parsed.slice(0, 5);
}

app.post('/api/quiz/generate', async (req: Request, res: Response) => {
  const { class: studentClass, subject, topic } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({ error: 'Please choose both a subject and a topic.' });
  }

  // Attempt 1: Fetch and validate quiz
  try {
    const questions = await fetchQuizFromAI(studentClass || '5', subject, topic);
    return res.json({ questions });
  } catch (firstError) {
    console.warn('First quiz attempt failed, retrying once...', firstError);
    // Attempt 2: Retry once as required
    try {
      const questions = await fetchQuizFromAI(studentClass || '5', subject, topic);
      return res.json({ questions });
    } catch (secondError) {
      console.error('Quiz generation failed after retry:', secondError);
      return res.status(500).json({ error: 'Please try again.' });
    }
  }
});

// -------------------------------------------------------------
// 4. QUIZ SUBMIT ROUTE
// POST /api/quiz/submit -> body: { user_id, subject, topic, score }
// -------------------------------------------------------------
app.post('/api/quiz/submit', async (req: Request, res: Response) => {
  try {
    const { user_id, subject, topic, score } = req.body;

    if (!user_id || !subject || !topic || score === undefined) {
      return res.status(400).json({ error: 'Missing required quiz submission fields.' });
    }

    const saved = await saveQuizResult({
      user_id,
      subject,
      topic,
      score: Number(score),
    });

    return res.json({ success: true, result: saved });
  } catch (error: any) {
    console.error('Quiz submit error:', error);
    return res.status(500).json({ error: error?.message || 'Could not save, please try again.' });
  }
});

// -------------------------------------------------------------
// 5. PROGRESS ROUTE
// GET /api/progress/:user_id
// -------------------------------------------------------------
app.get('/api/progress/:user_id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.user_id;
    const results = await getResults(userId);
    const weakTopics = await getWeakTopics(userId);

    const totalQuizzes = results.length;
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = totalQuizzes > 0 ? Number((totalScore / totalQuizzes).toFixed(1)) : 0;

    return res.json({
      totalQuizzes,
      averageScore,
      recentScores: results,
      weakTopics,
    });
  } catch (error) {
    console.error('Progress error:', error);
    return res.status(500).json({ error: 'Could not retrieve progress, please try again.' });
  }
});

// -------------------------------------------------------------
// 6. DATABASE CONNECTION STATUS ROUTE
// GET /api/db-status
// -------------------------------------------------------------
app.get('/api/db-status', async (_req: Request, res: Response) => {
  try {
    const { pool, initDB } = await import('./db.js');
    const initialized = await initDB();
    const [userRows] = await pool.query<any[]>('SELECT id, name, class, language FROM users ORDER BY id ASC');
    const [quizRows] = await pool.query<any[]>('SELECT id, user_id, subject, topic, score, date FROM quiz_results ORDER BY id DESC LIMIT 10');
    return res.json({
      connected: true,
      database: process.env.DB_NAME || 'ai_tutor',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      initialized,
      totalUsers: userRows.length,
      users: userRows,
      totalQuizzes: quizRows.length,
      recentQuizzes: quizRows,
    });
  } catch (error: any) {
    return res.status(500).json({
      connected: false,
      error: error?.message || 'Database connection error',
    });
  }
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE & STATIC FILE SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Tutor Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
