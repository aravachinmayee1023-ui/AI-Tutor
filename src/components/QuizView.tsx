/**
 * QuizView.tsx - Feature 3: 5-Question Multiple Choice Quiz
 *
 * Requirements:
 * - Student picks a subject and topic.
 * - Backend generates 5 questions: [{"question":"", "options":["","","",""], "answer":0, "explanation":""}]
 * - Shows ONE question at a time.
 * - Checks answers immediately and displays the explanation.
 * - Displays the final score and saves result via POST /api/quiz/submit.
 * - Large buttons and big text for LKG to Class 2 band.
 * - Loading indicator with friendly error messages ("Please try again").
 */

import React, { useState } from 'react';
import { User, QuizQuestion, getClassBand, SUBJECTS_BY_BAND } from '../types.ts';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  BookOpen,
  Award,
  ChevronRight,
} from 'lucide-react';

interface QuizViewProps {
  user: User;
  initialTopic?: string;
  onNavigateToProgress?: () => void;
  onNavigateToChat?: (subject: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  user,
  initialTopic = '',
  onNavigateToProgress,
  onNavigateToChat,
}) => {
  const classBand = getClassBand(user.class);
  const isJunior = classBand === 'junior';
  const subjects = SUBJECTS_BY_BAND[classBand];

  // Selection state
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || 'Mathematics');
  const [topic, setTopic] = useState(initialTopic || subjects[0]?.topics[0] || '');

  // Quiz progression state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current question interaction
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // When subject changes, set default suggested topic
  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    const subObj = subjects.find((s) => s.name === newSubject);
    if (subObj && subObj.topics.length > 0) {
      setTopic(subObj.topics[0]);
    }
  };

  // Start quiz by calling POST /api/quiz/generate
  const handleStartQuiz = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please select or type a topic.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: user.class,
          subject: selectedSubject,
          topic: topic.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || 'Please try again');
      }

      setQuestions(data.questions);
    } catch (err: unknown) {
      console.error('Quiz start error:', err);
      const msg = err instanceof Error ? err.message : 'Please try again';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle option selection
  const handleSelectOption = (index: number) => {
    if (hasAnswered) return; // Prevent multiple clicks on the same question

    setSelectedOption(index);
    setHasAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  // Move to next question or finalize quiz
  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      // Quiz finished! Submit final score
      setIsCompleted(true);
      await submitScore(score);
    }
  };

  // Save result to backend: POST /api/quiz/submit
  const submitScore = async (finalScore: number) => {
    setSubmittingResult(true);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          subject: selectedSubject,
          topic: topic.trim(),
          score: finalScore,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to save score:', err);
    } finally {
      setSubmittingResult(false);
    }
  };

  // ----------------------------------------------------------------------
  // VIEW 1: QUIZ COMPLETED SCREEN
  // ----------------------------------------------------------------------
  if (isCompleted && questions.length > 0) {
    const percentage = Math.round((score / questions.length) * 100);
    const isGreat = score >= 4;
    const isPassing = score >= 3;

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 text-center overflow-hidden relative">
          <div className="inline-flex p-4 rounded-3xl bg-amber-100 text-amber-600 mb-4 shadow-inner">
            <Trophy className={isJunior ? 'w-16 h-16' : 'w-12 h-12'} />
          </div>

          <h2 className={`font-extrabold text-slate-900 mb-2 ${isJunior ? 'text-3xl font-child' : 'text-2xl'}`}>
            {isGreat ? '🎉 Outstanding Work!' : isPassing ? '👍 Well Done!' : '🌱 Good Practice! Keep Going!'}
          </h2>

          <p className="text-slate-600 text-sm mb-6">
            You completed the quiz on <span className="font-bold text-slate-800">{topic}</span> ({selectedSubject})
          </p>

          {/* Big Score Card */}
          <div className="max-w-xs mx-auto bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 mb-6">
            <div className="text-5xl font-black text-indigo-600 tracking-tight">
              {score} <span className="text-2xl text-slate-400 font-semibold">/ 5</span>
            </div>
            <div className="text-sm font-bold text-slate-600 mt-1">
              Score: {percentage}%
            </div>
          </div>

          {/* Saving Status */}
          <div className="text-xs text-slate-500 mb-6 flex items-center justify-center gap-1.5">
            {submittingResult ? (
              <span>Saving result to your progress record...</span>
            ) : savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Result successfully saved to your profile!
              </span>
            ) : (
              <span>Result recorded</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={handleStartQuiz}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer ${
                isJunior ? 'text-lg py-4' : 'text-sm'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>

            {onNavigateToProgress && (
              <button
                onClick={onNavigateToProgress}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer ${
                  isJunior ? 'text-lg py-4' : 'text-sm'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>View Progress & Weak Topics</span>
              </button>
            )}

            {onNavigateToChat && (
              <button
                onClick={() => onNavigateToChat(selectedSubject)}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center justify-center gap-2 cursor-pointer ${
                  isJunior ? 'text-lg py-4' : 'text-sm'
                }`}
              >
                <span>Ask Tutor About This</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 2: ACTIVE QUESTION SCREEN (ONE QUESTION AT A TIME)
  // ----------------------------------------------------------------------
  if (questions.length > 0) {
    const currentQ = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Top Quiz Meta & Progress Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-600 text-sm sm:text-base">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-500 px-2.5 py-1 bg-slate-100 rounded-lg">
                {selectedSubject}
              </span>
            </div>
            <div className="text-xs font-bold text-emerald-600 px-2.5 py-1 bg-emerald-50 rounded-lg">
              Score: {score}
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <h3 className={`font-bold text-slate-900 leading-relaxed mb-6 ${
            isJunior ? 'text-2xl font-child text-slate-800' : 'text-lg sm:text-xl'
          }`}>
            {currentQ.question}
          </h3>

          {/* 4 Option Buttons */}
          <div className="space-y-3 mb-6">
            {currentQ.options.map((optText, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const isCorrectAnswer = optIdx === currentQ.answer;

              let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
              let icon = null;

              if (hasAnswered) {
                if (isCorrectAnswer) {
                  // Always mark the correct answer in green
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                  icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                } else if (isSelected && !isCorrectAnswer) {
                  // Mark student's incorrect choice in red
                  btnStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold';
                  icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
                } else {
                  // Neutral unselected options
                  btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={hasAnswered}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${btnStyle} ${
                    isJunior ? 'py-5 text-xl font-medium' : 'text-sm sm:text-base font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      hasAnswered && isCorrectAnswer
                        ? 'bg-emerald-600 text-white'
                        : hasAnswered && isSelected
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 shadow-xs'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{optText}</span>
                  </div>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner (Revealed upon selecting an answer) */}
          {hasAnswered && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
              <div className={`p-4 rounded-2xl border ${
                selectedOption === currentQ.answer
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <span>{selectedOption === currentQ.answer ? '✅ Correct!' : '💡 Explanation:'}</span>
                </div>
                <p className={`text-sm leading-relaxed ${isJunior ? 'text-base font-medium' : ''}`}>
                  {currentQ.explanation}
                </p>
              </div>

              {/* Next Question Button */}
              <button
                onClick={handleNext}
                className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer ${
                  isJunior ? 'text-xl py-4' : 'text-base'
                }`}
              >
                <span>{isLastQuestion ? 'See Final Score' : 'Next Question'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 3: QUIZ TOPIC PICKER & SETUP SCREEN
  // ----------------------------------------------------------------------
  const currentSubjectObj = subjects.find((s) => s.name === selectedSubject) || subjects[0];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-2xl bg-indigo-50 text-indigo-600 ${isJunior ? 'p-4' : ''}`}>
            <HelpCircle className={isJunior ? 'w-8 h-8' : 'w-6 h-6'} />
          </div>
          <div>
            <h2 className={`font-extrabold text-slate-900 ${isJunior ? 'text-2xl font-child' : 'text-xl'}`}>
              5-Question Practice Quiz
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Tailored for Class {user.class} curriculum
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button
              onClick={handleStartQuiz}
              className="text-xs font-bold underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Step 1: Pick Subject */}
        <div className="mb-6">
          <label className={`block font-bold text-slate-700 mb-2 ${isJunior ? 'text-lg' : 'text-sm'}`}>
            1. Select Subject
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {subjects.map((s) => {
              const isSelected = selectedSubject === s.name;
              return (
                <button
                  key={s.name}
                  onClick={() => handleSubjectChange(s.name)}
                  className={`p-3.5 rounded-2xl border text-left font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? isJunior
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-md scale-102'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className={isJunior ? 'text-base' : 'text-sm'}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Pick Topic */}
        <div className="mb-6">
          <label className={`block font-bold text-slate-700 mb-2 ${isJunior ? 'text-lg' : 'text-sm'}`}>
            2. Choose Topic or Enter Your Own
          </label>

          {/* Quick-pick popular topic chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {currentSubjectObj?.topics.map((t) => {
              const isSelected = topic === t;
              return (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                    isSelected
                      ? isJunior
                        ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Topic custom input */}
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Type any specific chapter or topic..."
            className={`w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium ${
              isJunior ? 'text-lg' : 'text-sm'
            }`}
          />
        </div>

        {/* Start Quiz Button */}
        <button
          onClick={handleStartQuiz}
          disabled={loading || !topic.trim()}
          className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isJunior ? 'text-xl py-5' : 'text-base'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating 5 Questions for Class {user.class}...</span>
            </>
          ) : (
            <>
              <span>Start 5-Question Quiz</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
