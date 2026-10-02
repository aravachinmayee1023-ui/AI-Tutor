/**
 * db.ts - MySQL Database Layer for AI Tutor
 *
 * Implements real MySQL storage using mysql2/promise connection pooling.
 *
 * Tables:
 * 1. users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) UNIQUE, class VARCHAR(10), language VARCHAR(20))
 * 2. quiz_results (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, subject VARCHAR(50), topic VARCHAR(100), score TINYINT, date TIMESTAMP)
 *
 * Core functions:
 * - findUser(name)
 * - createUser({ name, class, language })
 * - saveQuizResult({ user_id, subject, topic, score })
 * - getResults(user_id)
 * - getWeakTopics(user_id)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export interface User {
  id: number | string;
  name: string;
  class: string;
  language: string;
}

export interface QuizResult {
  id: number | string;
  user_id: number | string;
  subject: string;
  topic: string;
  score: number;
  date: string;
}

export interface WeakTopic {
  subject: string;
  topic: string;
  averageScore: number;
  quizzesTaken: number;
}

// In-memory fallback if MySQL is offline or not configured yet
const memoryUsers: User[] = [
  { id: 1, name: 'Leo', class: 'UKG', language: 'English' },
  { id: 2, name: 'Kabir', class: '10', language: 'English' },
  { id: 3, name: 'Aarav', class: '5', language: 'English' },
];
const memoryResults: QuizResult[] = [
  { id: 1, user_id: 1, subject: 'Fun Numbers', topic: 'Counting 1 to 10', score: 5, date: new Date().toISOString() },
  { id: 2, user_id: 2, subject: 'Mathematics', topic: 'Quadratic Equations', score: 4, date: new Date().toISOString() },
];

// Create connection pool using credentials from .env
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_tutor',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let isConnected = false;
let dbInitialized = false;

/**
 * Automatically create tables on startup if they do not exist
 */
export async function initDB(): Promise<boolean> {
  if (dbInitialized) return true;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      name      VARCHAR(100) NOT NULL UNIQUE,
      class     VARCHAR(10) NOT NULL,
      language  VARCHAR(20) NOT NULL DEFAULT 'English'
    );
  `;

  const createQuizResultsTable = `
    CREATE TABLE IF NOT EXISTS quiz_results (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      user_id   INT NOT NULL,
      subject   VARCHAR(50) NOT NULL,
      topic     VARCHAR(100) NOT NULL,
      score     TINYINT NOT NULL,
      date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;

  try {
    const connection = await pool.getConnection();
    try {
      await connection.query(createUsersTable);
      await connection.query(createQuizResultsTable);
      dbInitialized = true;
      isConnected = true;
      console.log('MySQL: Database tables initialized successfully.');
      return true;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    isConnected = false;
    console.warn(
      'MySQL: Notice - Could not connect to MySQL server. (Make sure MySQL is running with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env):',
      error.message
    );
    return false;
  }
}

// Trigger automatic table creation on startup
initDB().catch(() => {});

/**
 * 1. findUser(name)
 * Finds a user by name (parameterized query)
 */
export async function findUser(name: string): Promise<User | null> {
  const cleanName = (name || '').trim();
  if (!cleanName) return null;

  try {
    await initDB();
    if (isConnected) {
      const query = 'SELECT id, name, class, language FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1';
      const [rows] = await pool.query<mysql.RowDataPacket[]>(query, [cleanName]);
      if (rows && rows.length > 0) {
        const u = rows[0];
        return {
          id: u.id,
          name: u.name,
          class: u.class,
          language: u.language || 'English',
        };
      }
      return null;
    }
  } catch (error: any) {
    console.warn('MySQL findUser fallback:', error.message);
  }

  // Graceful fallback to memory store if database is offline
  const found = memoryUsers.find((u) => u.name.toLowerCase() === cleanName.toLowerCase());
  return found || null;
}

/**
 * 2. createUser({ name, class, language })
 * Creates a new student record (parameterized query)
 */
export async function createUser(userData: {
  name: string;
  class: string;
  language?: string;
}): Promise<User> {
  const cleanName = (userData.name || '').trim();
  const cleanClass = (userData.class || '5').trim();
  const cleanLang = (userData.language || 'English').trim();

  try {
    await initDB();
    if (isConnected) {
      const query = 'INSERT INTO users (name, class, language) VALUES (?, ?, ?)';
      const [result] = await pool.query<mysql.ResultSetHeader>(query, [cleanName, cleanClass, cleanLang]);

      return {
        id: result.insertId,
        name: cleanName,
        class: cleanClass,
        language: cleanLang,
      };
    }
  } catch (error: any) {
    console.error('Database error in createUser:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`Student with name "${cleanName}" already exists.`);
    }
    throw new Error('Could not save user, please try again.');
  }

  // In-memory fallback
  const existing = memoryUsers.find((u) => u.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }
  const newUser: User = {
    id: memoryUsers.length + 1,
    name: cleanName,
    class: cleanClass,
    language: cleanLang,
  };
  memoryUsers.push(newUser);
  return newUser;
}

/**
 * 3. saveQuizResult({ user_id, subject, topic, score })
 * Validates score is 0-5 and user_id exists before saving
 */
export async function saveQuizResult(result: {
  user_id: number | string;
  subject: string;
  topic: string;
  score: number;
}): Promise<QuizResult> {
  const numScore = Number(result.score);

  // Validate score: whole number from 0 to 5
  if (!Number.isInteger(numScore) || numScore < 0 || numScore > 5) {
    throw new Error('Invalid score: Score must be a whole number between 0 and 5.');
  }

  const userIdNum = Number(result.user_id) || result.user_id;

  try {
    await initDB();
    if (isConnected) {
      // Validate that user_id exists
      const [userRows] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [userIdNum]);
      if (!userRows || userRows.length === 0) {
        throw new Error(`User with ID ${result.user_id} does not exist.`);
      }

      const query = `
        INSERT INTO quiz_results (user_id, subject, topic, score)
        VALUES (?, ?, ?, ?)
      `;
      const [res] = await pool.query<mysql.ResultSetHeader>(query, [
        userIdNum,
        result.subject,
        result.topic,
        numScore,
      ]);

      return {
        id: res.insertId,
        user_id: userIdNum,
        subject: result.subject,
        topic: result.topic,
        score: numScore,
        date: new Date().toISOString(),
      };
    }
  } catch (error: any) {
    console.error('Database error in saveQuizResult:', error.message);
    throw new Error(
      error.message.startsWith('Invalid') || error.message.startsWith('User with')
        ? error.message
        : 'Could not save, please try again.'
    );
  }

  // In-memory fallback
  const newResult: QuizResult = {
    id: memoryResults.length + 1,
    user_id: userIdNum,
    subject: result.subject,
    topic: result.topic,
    score: numScore,
    date: new Date().toISOString(),
  };
  memoryResults.push(newResult);
  return newResult;
}

/**
 * 4. getResults(user_id)
 * Retrieves all quiz results for a user ordered by date
 */
export async function getResults(user_id: number | string): Promise<QuizResult[]> {
  const userIdNum = Number(user_id) || user_id;

  try {
    await initDB();
    if (isConnected) {
      const query = `
        SELECT id, user_id, subject, topic, score, date
        FROM quiz_results
        WHERE user_id = ?
        ORDER BY date ASC
      `;
      const [rows] = await pool.query<mysql.RowDataPacket[]>(query, [userIdNum]);
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        subject: r.subject,
        topic: r.topic,
        score: Number(r.score),
        date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString(),
      }));
    }
  } catch (error: any) {
    console.error('Database error in getResults:', error.message);
    throw new Error('Could not retrieve results, please try again.');
  }

  return memoryResults.filter((r) => String(r.user_id) === String(user_id));
}

/**
 * 5. getWeakTopics(user_id)
 * Calculates average score per subject and topic, lowest first, limit 3
 */
export async function getWeakTopics(user_id: number | string): Promise<WeakTopic[]> {
  const userIdNum = Number(user_id) || user_id;

  try {
    await initDB();
    if (isConnected) {
      const query = `
        SELECT
          subject,
          topic,
          ROUND(AVG(score), 1) AS averageScore,
          COUNT(*) AS quizzesTaken
        FROM quiz_results
        WHERE user_id = ?
        GROUP BY subject, topic
        ORDER BY averageScore ASC
        LIMIT 3
      `;
      const [rows] = await pool.query<mysql.RowDataPacket[]>(query, [userIdNum]);
      return rows.map((r) => ({
        subject: r.subject,
        topic: r.topic,
        averageScore: Number(r.averageScore),
        quizzesTaken: Number(r.quizzesTaken),
      }));
    }
  } catch (error: any) {
    console.error('Database error in getWeakTopics:', error.message);
    throw new Error('Could not retrieve weak topics, please try again.');
  }

  // In-memory fallback computation
  const userQuizzes = memoryResults.filter((r) => String(r.user_id) === String(user_id));
  const stats: Record<string, { subject: string; topic: string; total: number; count: number }> = {};
  for (const q of userQuizzes) {
    const k = `${q.subject}:::${q.topic}`;
    if (!stats[k]) stats[k] = { subject: q.subject, topic: q.topic, total: 0, count: 0 };
    stats[k].total += q.score;
    stats[k].count += 1;
  }
  return Object.values(stats)
    .map((s) => ({
      subject: s.subject,
      topic: s.topic,
      averageScore: Number((s.total / s.count).toFixed(1)),
      quizzesTaken: s.count,
    }))
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3);
}

// ------------------------------------------------------------------------
// Application helper aliases to preserve seamless compatibility with server
// ------------------------------------------------------------------------

export async function loginUser(name: string, _password?: string): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const user = await findUser(name);
    if (!user) {
      return {
        success: false,
        error: `No student account found with the name "${name}". Please check the spelling or switch to "Register" to create a new account.`,
      };
    }
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not sign in, please try again.' };
  }
}

export async function registerUser(userData: {
  name: string;
  password?: string;
  class: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const existing = await findUser(userData.name);
    if (existing) {
      return {
        success: false,
        error: `An account for "${userData.name}" already exists. Please switch to "Sign In" or choose a different name.`,
      };
    }
    const user = await createUser({
      name: userData.name,
      class: userData.class,
      language: 'English',
    });
    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not save, please try again.' };
  }
}

export async function updateUserProfile(id: number | string, updates: { class?: string; language?: string }): Promise<User | null> {
  try {
    await initDB();
    if (isConnected && updates.class) {
      await pool.query('UPDATE users SET class = ? WHERE id = ?', [updates.class, id]);
      const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT id, name, class, language FROM users WHERE id = ?', [id]);
      if (rows && rows.length > 0) return rows[0] as User;
    }
  } catch (err: any) {
    console.error('Database error in updateUserProfile:', err.message);
  }

  const mem = memoryUsers.find((u) => String(u.id) === String(id));
  if (mem) {
    if (updates.class) mem.class = updates.class;
    if (updates.language) mem.language = updates.language;
    return mem;
  }
  return null;
}
