# AI Tutor Pro (LKG to Class 12)

A full-stack, professional adaptive AI tutoring web application designed for students from **LKG to Class 12**. Built with React, TypeScript, Express, and Google Gemini AI.

---

## 🌟 Key Features

1. **Professional Student Portal**
   - Sleek dual-panel layout with feature previews, quick 1-click demo accounts (`Leo - UKG`, `Kabir - Class 10`), and grade band categorization.
   - Dedicated **Student Sign In** and **New Student Register** tabs with secure password protection.
   - Clean top navigation with student profile badge, active grade indicator, and instant **Sign Out**.

2. **LKG & UKG Visual Picture Generation (🎨 New)**
   - When kindergarten students (LKG and UKG) ask questions, the AI tutor explains in simple words and **automatically generates clean, vibrant vector SVG picture illustrations** (e.g. smiling animals, bright fruits, counting items, shapes, sun and stars) embedded directly in the chat view!

3. **Grade-Specific AI System Prompts (English)**
   - **Early Years (LKG & UKG)**: Cheerful kindergarten teacher with very short sentences, simple words, and automatic visual picture illustrations.
   - **Primary (Class 1 to 2)**: Encouraging early educator using simple everyday examples.
   - **Middle School (Class 3 to 8)**: Patient instructor explaining concepts through real-world analogies followed by an understanding check question.
   - **High School (Class 9 to 12)**: Rigorous academic tutor providing step-by-step mathematical working, formulas ($F = ma$, quadratic derivations), and guided problem-solving.

4. **5-Question Practice Quizzes**
   - Automatically generates 5 multiple-choice questions for any grade and topic.
   - One-question-at-a-time interactive view with instant answer validation, explanation cards, and automatic score submission.
   - Automated JSON schema validation with retry fallback.

5. **Learning Analytics & Weak Topic Tracking**
   - Tracks total quizzes taken, average performance score, and score trends over time.
   - Automatically ranks and highlights **weak topics** (lowest average score) with an instant "Practice" shortcut.

---

## 📁 Project Structure

```
├── .env.example            # Environment variables template
├── db.ts                   # In-memory storage layer (authenticateUser, createUser, saveQuizResult, getResults)
├── index.html              # HTML5 entry point
├── metadata.json           # Application metadata & capabilities
├── package.json            # Scripts & dependencies
├── server.ts               # Express backend with Gemini AI & Vite middleware
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── src/
    ├── App.tsx             # Main React application controller
    ├── index.css           # Tailwind CSS imports & global styles
    ├── main.tsx            # React DOM mounting
    ├── types.ts            # Type definitions, grade band logic, & subject catalogs
    └── components/
        ├── ChatTutor.tsx    # Interactive chat tutor with visual SVG picture renderer
        ├── LoginModal.tsx   # Professional dual-panel login & registration portal
        ├── Navbar.tsx       # Modern header with profile badge and Sign Out
        ├── ProgressView.tsx # Analytics dashboard with weak topics tracker
        └── QuizView.tsx     # 5-question step-by-step quiz engine
```

---

## 🚀 How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Ensure `.env` contains your Gemini API Key:
```bash
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.
