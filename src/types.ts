/**
 * types.ts - Common Data Types and Interfaces for AI Tutor
 */

export interface User {
  id: string;
  name: string;
  password?: string;
  class: string;     // 'LKG', 'UKG', '1', '2', ..., '12'
  language: string;  // Defaults to 'English'
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  svgImage?: string; // Optional extracted visual SVG illustration for kindergarten
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;      // 0-based index: 0, 1, 2, or 3
  explanation: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  score: number;       // 0 to 5
  date: string;        // ISO timestamp
}

export interface WeakTopic {
  subject: string;
  topic: string;
  averageScore: number;
  quizzesTaken: number;
}

export interface ProgressData {
  totalQuizzes: number;
  averageScore: number;
  recentScores: QuizResult[];
  weakTopics: WeakTopic[];
}

export type ClassBand = 'kindergarten' | 'junior' | 'middle' | 'senior';

/**
 * Returns which class band a student belongs to:
 * - 'kindergarten': LKG and UKG (Ages 3-5, requires image/visual SVG illustrations for every answer)
 * - 'junior': Classes 1 and 2 (Ages 6-7, large fonts, simple examples)
 * - 'middle': Classes 3 to 8 (Conceptual explanations with check questions)
 * - 'senior': Classes 9 to 12 (Step-by-step working, formulas, deep academic tutor)
 */
export function getClassBand(studentClass: string): ClassBand {
  const norm = (studentClass || '').trim().toUpperCase();
  if (norm === 'LKG' || norm === 'UKG') {
    return 'kindergarten';
  }
  if (['1', '2', 'CLASS 1', 'CLASS 2'].includes(norm)) {
    return 'junior';
  }
  if (['9', '10', '11', '12', 'CLASS 9', 'CLASS 10', 'CLASS 11', 'CLASS 12'].includes(norm)) {
    return 'senior';
  }
  return 'middle';
}

/**
 * Recommended subjects based on class band
 */
export const SUBJECTS_BY_BAND: Record<ClassBand, { name: string; icon: string; topics: string[] }[]> = {
  kindergarten: [
    {
      name: 'English & Phonics',
      icon: '🔤',
      topics: ['Letter Sounds & Phonics', 'Rhymes & Fun Words', 'Everyday Objects', 'Colors & Words'],
    },
    {
      name: 'Fun Numbers',
      icon: '🔢',
      topics: ['Counting 1 to 10', 'Shapes (Circle, Square, Triangle)', 'Counting Animals & Fruits', 'Big vs Small'],
    },
    {
      name: 'World Around Us',
      icon: '🐾',
      topics: ['Cute Animals & Birds', 'Fruits and Vegetables', 'Sun, Stars & Rainbow', 'My Family & Home'],
    },
  ],
  junior: [
    {
      name: 'English',
      icon: '🔤',
      topics: ['Alphabet & Phonics', 'Rhyming Words', 'Simple Story Words', 'Animals & Sounds'],
    },
    {
      name: 'Mathematics',
      icon: '🔢',
      topics: ['Counting 1 to 50', 'Shapes & Colors', 'Simple Addition (Apples & Stars)', 'Comparing Numbers'],
    },
    {
      name: 'General Science / EVS',
      icon: '🌱',
      topics: ['Animals & Their Babies', 'Fruits and Vegetables', 'Parts of the Body', 'Day and Night'],
    },
  ],
  middle: [
    {
      name: 'Mathematics',
      icon: '📐',
      topics: ['Fractions & Decimals', 'Simple Equations', 'Geometry & Angles', 'Perimeter and Area', 'Integers'],
    },
    {
      name: 'Science',
      icon: '🔬',
      topics: ['Plants & Photosynthesis', 'Light and Shadows', 'Force, Work and Energy', 'Water Cycle', 'Human Body Systems'],
    },
    {
      name: 'Social Studies',
      icon: '🌍',
      topics: ['Our Earth & Continents', 'The Solar System', 'Ancient Civilizations', 'Indian Constitution Basics', 'Weather & Climate'],
    },
    {
      name: 'English',
      icon: '📚',
      topics: ['Parts of Speech', 'Active & Passive Voice', 'Reading Comprehension', 'Tenses', 'Vocabulary Builder'],
    },
  ],
  senior: [
    {
      name: 'Mathematics',
      icon: '📊',
      topics: ['Quadratic Equations', 'Trigonometry', 'Coordinate Geometry', 'Calculus Basics', 'Probability & Statistics'],
    },
    {
      name: 'Physics',
      icon: '⚡',
      topics: ['Laws of Motion', 'Gravitation & Satellite Motion', 'Electricity & Ohm’s Law', 'Optics & Refraction', 'Work, Power & Energy'],
    },
    {
      name: 'Chemistry',
      icon: '🧪',
      topics: ['Periodic Classification', 'Chemical Bonding', 'Acids, Bases and Salts', 'Mole Concept & Stoichiometry', 'Organic Chemistry Basics'],
    },
    {
      name: 'Biology',
      icon: '🧬',
      topics: ['Cell Structure & Division', 'Genetics & Mendel’s Laws', 'Human Circulatory System', 'Ecology & Ecosystems', 'Evolution'],
    },
    {
      name: 'English',
      icon: '🖋️',
      topics: ['Formal Essay & Report Writing', 'Poetic Devices & Literary Terms', 'Complex Grammar & Synthesis', 'Critical Analysis'],
    },
  ],
};
