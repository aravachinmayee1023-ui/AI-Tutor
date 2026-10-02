/**
 * db.js - MySQL Database Layer for AI Tutor
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

dotenv.config();

// Create a connection pool using credentials from .env
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_tutor',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let dbInitialized = false;

/**
 * Automatically create tables on startup if they do not exist
 */
export async function initDB() {
  if (dbInitialized) return;

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
      console.log('MySQL: Database tables initialized successfully.');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.warn(
      'MySQL: Could not initialize tables. Ensure MySQL is running and ai_tutor database exists:',
      error.message
    );
  }
}

// Trigger automatic table creation on startup
initDB().catch(() => {});

/**
 * 1. findUser(name)
 * Finds a user by name (parameterized query)
 */
export async function findUser(name) {
  try {
    await initDB();
    const query = 'SELECT id, name, class, language FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1';
    const [rows] = await pool.query(query, [name.trim()]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database error in findUser:', error.message);
    throw new Error('Could not retrieve user, please try again.');
  }
}

/**
 * 2. createUser({ name, class, language })
 * Creates a new student record (parameterized query)
 */
export async function createUser({ name, class: studentClass, language = 'English' }) {
  try {
    await initDB();
    const query = 'INSERT INTO users (name, class, language) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [
      name.trim(),
      studentClass || '5',
      language || 'English',
    ]);

    return {
      id: result.insertId,
      name: name.trim(),
      class: studentClass || '5',
      language: language || 'English',
    };
  } catch (error) {
    console.error('Database error in createUser:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`Student with name "${name}" already exists.`);
    }
    throw new Error('Could not save user, please try again.');
  }
}

/**
 * 3. saveQuizResult({ user_id, subject, topic, score })
 * Validates score is 0-5 and user_id exists before saving
 */
export async function saveQuizResult({ user_id, subject, topic, score }) {
  const numScore = Number(score);

  // Validate score: must be a whole number from 0 to 5
  if (!Number.isInteger(numScore) || numScore < 0 || numScore > 5) {
    throw new Error('Invalid score: Score must be a whole number between 0 and 5.');
  }

  try {
    await initDB();

    // Validate that user_id exists
    const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userRows || userRows.length === 0) {
      throw new Error(`User with ID ${user_id} does not exist.`);
    }

    const query = `
      INSERT INTO quiz_results (user_id, subject, topic, score)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [user_id, subject, topic, numScore]);

    return {
      id: result.insertId,
      user_id,
      subject,
      topic,
      score: numScore,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database error in saveQuizResult:', error.message);
    throw new Error(error.message.startsWith('Invalid') || error.message.startsWith('User with')
      ? error.message
      : 'Could not save, please try again.'
    );
  }
}

/**
 * 4. getResults(user_id)
 * Retrieves all quiz results for a user ordered by date
 */
export async function getResults(user_id) {
  try {
    await initDB();
    const query = `
      SELECT id, user_id, subject, topic, score, date
      FROM quiz_results
      WHERE user_id = ?
      ORDER BY date ASC
    `;
    const [rows] = await pool.query(query, [user_id]);
    return rows;
  } catch (error) {
    console.error('Database error in getResults:', error.message);
    throw new Error('Could not retrieve results, please try again.');
  }
}

/**
 * 5. getWeakTopics(user_id)
 * Calculates average score per subject and topic, lowest first, limit 3
 */
export async function getWeakTopics(user_id) {
  try {
    await initDB();
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
    const [rows] = await pool.query(query, [user_id]);
    return rows.map((r) => ({
      subject: r.subject,
      topic: r.topic,
      averageScore: Number(r.averageScore),
      quizzesTaken: Number(r.quizzesTaken),
    }));
  } catch (error) {
    console.error('Database error in getWeakTopics:', error.message);
    throw new Error('Could not retrieve weak topics, please try again.');
  }
}

// ------------------------------------------------------------------------
// Application helper aliases to preserve seamless compatibility with server
// ------------------------------------------------------------------------

export async function loginUser(name, password) {
  try {
    const user = await findUser(name);
    if (!user) {
      return {
        success: false,
        error: `No student account found with the name "${name}". Please check the spelling or switch to "Register" to create a new account.`,
      };
    }
    // Note: Since users table schema strictly has id, name, class, language
    return { success: true, user };
  } catch (err) {
    return { success: false, error: err.message || 'Could not sign in, please try again.' };
  }
}

export async function registerUser(userData) {
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
  } catch (err) {
    return { success: false, error: err.message || 'Could not save, please try again.' };
  }
}

export async function updateUserProfile(id, updates) {
  try {
    if (updates.class) {
      await pool.query('UPDATE users SET class = ? WHERE id = ?', [updates.class, id]);
    }
    const [rows] = await pool.query('SELECT id, name, class, language FROM users WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database error in updateUserProfile:', error.message);
    throw new Error('Could not update profile, please try again.');
  }
}

export default {
  initDB,
  findUser,
  createUser,
  saveQuizResult,
  getResults,
  getWeakTopics,
  loginUser,
  registerUser,
  updateUserProfile,
};
