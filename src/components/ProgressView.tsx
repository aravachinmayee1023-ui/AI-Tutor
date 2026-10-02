/**
 * ProgressView.tsx - Feature 4: Student Progress & Weak Topics
 *
 * Requirements:
 * - Fetches from GET /api/progress/:user_id.
 * - Shows the number of quizzes taken.
 * - Shows scores over time (history list).
 * - Shows weak topics (lowest average score per topic).
 * - Clean, colourful, mobile-friendly UI with responsive layout.
 * - Loading indicators and friendly error handling.
 */

import React, { useState, useEffect } from 'react';
import { User, ProgressData, getClassBand } from '../types.ts';
import {
  BarChart3,
  Trophy,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Calendar,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface ProgressViewProps {
  user: User;
  onPracticeTopic?: (subject: string, topic: string) => void;
  onNavigateToQuiz?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  user,
  onPracticeTopic,
  onNavigateToQuiz,
}) => {
  const classBand = getClassBand(user.class);
  const isJunior = classBand === 'junior';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<ProgressData | null>(null);

  const fetchProgress = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/progress/${user.id}`);
      if (!response.ok) {
        throw new Error('Please try again');
      }
      const progressResult = await response.json();
      setData(progressResult);
    } catch (err: unknown) {
      console.error('Progress fetch error:', err);
      setErrorMsg('Please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 sm:p-10 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-semibold text-sm">
          Loading learning progress for {user.name}...
        </p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl mb-4">
          <p className="font-semibold text-sm">⚠️ {errorMsg || 'Please try again'}</p>
        </div>
        <button
          onClick={fetchProgress}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow hover:bg-blue-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { totalQuizzes, averageScore, recentScores, weakTopics } = data;

  // No quizzes taken yet
  if (totalQuizzes === 0) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200/80">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8" />
          </div>

          <h3 className={`font-extrabold text-slate-800 mb-2 ${isJunior ? 'text-2xl font-child' : 'text-xl'}`}>
            No Quizzes Taken Yet!
          </h3>

          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Take a 5-question quiz in any subject to start tracking your scores, progress over time, and focus topics!
          </p>

          {onNavigateToQuiz && (
            <button
              onClick={onNavigateToQuiz}
              className={`px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mx-auto cursor-pointer ${
                isJunior ? 'text-lg py-4' : 'text-sm'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Take Your First Quiz</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Quizzes Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{totalQuizzes}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quizzes Taken
            </div>
          </div>
        </div>

        {/* Average Score Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {averageScore} <span className="text-lg text-slate-400 font-semibold">/ 5</span>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Score ({Math.round((averageScore / 5) * 100)}%)
            </div>
          </div>
        </div>

        {/* Needs Focus Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">
              {weakTopics.filter((t) => t.averageScore < 3.5).length}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Topics to Improve
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics Section (Lowest Average Score per Topic) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-extrabold text-slate-900 ${isJunior ? 'text-2xl font-child' : 'text-lg'}`}>
              🎯 Focus & Weak Topics
            </h3>
            <p className="text-slate-500 text-xs">
              Topics sorted by lowest average score so you can focus and master them.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weakTopics.map((item, idx) => {
            const isLow = item.averageScore < 3.0;
            const isMedium = item.averageScore >= 3.0 && item.averageScore < 4.0;

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isLow
                    ? 'bg-rose-50/40 border-rose-200'
                    : isMedium
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {item.subject}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.quizzesTaken} quiz{item.quizzesTaken > 1 ? 'zes' : ''}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {item.topic}
                  </h4>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    Avg: <span className={`font-black ${isLow ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`}>{item.averageScore} / 5</span>
                  </div>
                </div>

                {onPracticeTopic && (
                  <button
                    onClick={() => onPracticeTopic(item.subject, item.topic)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scores Over Time (Quiz History) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
        <h3 className={`font-extrabold text-slate-900 mb-4 ${isJunior ? 'text-2xl font-child' : 'text-lg'}`}>
          📈 Quiz Scores Over Time
        </h3>

        <div className="overflow-x-auto">
          <div className="space-y-2.5">
            {recentScores
              .slice()
              .reverse()
              .map((r) => {
                const dateStr = new Date(r.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isPassing = r.score >= 3;

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-sm hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        r.score >= 4
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPassing
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {r.score}/5
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{r.topic}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-semibold text-slate-600">{r.subject}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        r.score >= 4
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPassing
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.score >= 4 ? 'Great! ⭐' : isPassing ? 'Passed' : 'Needs Practice'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
