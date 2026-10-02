/**
 * LoginModal.tsx - Professional Student Authentication & Profile Portal
 *
 * High-end, modern EdTech design featuring:
 * - Dual-panel branded layout with feature highlights
 * - Grade band categorization (Kindergarten with Visual Learning, Primary, Middle, High School)
 * - Sign In vs New Registration tabs
 * - Quick 1-click Demo Student profiles for fast testing
 */

import React, { useState } from 'react';
import { User } from '../types.ts';
import {
  GraduationCap,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';

interface LoginModalProps {
  currentUser?: User | null;
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
}

type GradeCategory = 'kindergarten' | 'primary' | 'middle' | 'senior';

const GRADE_CATEGORIES: { id: GradeCategory; title: string; subtitle: string; grades: string[] }[] = [
  {
    id: 'kindergarten',
    title: 'Early Years',
    subtitle: 'LKG & UKG • Visual Image Learning',
    grades: ['LKG', 'UKG'],
  },
  {
    id: 'primary',
    title: 'Primary',
    subtitle: 'Class 1 to 5 • Foundations',
    grades: ['1', '2', '3', '4', '5'],
  },
  {
    id: 'middle',
    title: 'Middle School',
    subtitle: 'Class 6 to 8 • Concepts',
    grades: ['6', '7', '8'],
  },
  {
    id: 'senior',
    title: 'High School',
    subtitle: 'Class 9 to 12 • Step-by-Step STEM',
    grades: ['9', '10', '11', '12'],
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  onLoginSuccess,
  onClose,
}) => {
  const isEditing = Boolean(currentUser);
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState(currentUser?.name || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedClass, setSelectedClass] = useState(currentUser?.class || 'UKG');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine active grade category from selected class
  const activeCategory: GradeCategory =
    selectedClass === 'LKG' || selectedClass === 'UKG'
      ? 'kindergarten'
      : ['1', '2', '3', '4', '5'].includes(selectedClass)
      ? 'primary'
      : ['6', '7', '8'].includes(selectedClass)
      ? 'middle'
      : 'senior';

  const [selectedCategory, setSelectedCategory] = useState<GradeCategory>(activeCategory);

  const handleSelectGrade = (cls: string) => {
    setSelectedClass(cls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your student name.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter a password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isEditing && currentUser) {
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentUser.id,
            class: selectedClass,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Please try again.');
        }

        onLoginSuccess(data.user);
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            password: password.trim(),
            class: selectedClass,
            action: activeTab,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed. Please check your credentials.');
        }

        onLoginSuccess(data.user);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const isKindergarten = selectedClass === 'LKG' || selectedClass === 'UKG';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left Feature & Branding Panel */}
        <div className="md:w-5/12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                  <span>AI Tutor</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-300">
                    Pro
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Intelligent K-12 Learning Suite</p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>LKG & UKG Visual Explanations</span>
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">New</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Answers automatically generate colorful picture illustrations for early visual learners.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Adaptive Grade Syllabus</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Tailored explanations across 14 grade levels from foundational phonics to Class 12 calculus.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">5-Question Practice Quizzes</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Instant answer verification with rationale, score tracking, and automated weak topic diagnosis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Database & Account Status */}
          {!isEditing && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to MySQL Database
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Enter your student name and grade to record quizzes, progress, and personalized recommendations.
              </p>
            </div>
          )}
        </div>

        {/* Right Form Panel */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header Tabs */}
            {!isEditing ? (
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {activeTab === 'signin' ? 'Welcome Back' : 'Create Student Profile'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'signin'
                      ? 'Log in to continue your personalized study sessions.'
                      : 'Set up your grade level to activate customized tutoring.'}
                  </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('signin'); setErrorMsg(''); }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activeTab === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activeTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Update Student Grade
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modify your class to adjust the tutor's difficulty level and curriculum.
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <span className="font-bold">⚠️</span> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isEditing}
                    placeholder="Enter student name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-medium placeholder:text-slate-400 bg-slate-50/50 transition ${
                      isEditing ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''
                    }`}
                    required
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              {!isEditing && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {activeTab === 'signin' ? 'Password' : 'Set Password'}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {activeTab === 'register' ? 'Protects your quiz history' : ''}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter student password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-medium placeholder:text-slate-400 bg-slate-50/50 transition"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Grade Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Class Grade
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isKindergarten
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    Selected: Class {selectedClass} {isKindergarten ? '• 🎨 Visual Mode' : ''}
                  </span>
                </div>

                {/* Segmented Category Buttons */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl mb-2.5">
                  {GRADE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (!cat.grades.includes(selectedClass)) {
                          setSelectedClass(cat.grades[0]);
                        }
                      }}
                      className={`py-1.5 px-1 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-white text-indigo-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>

                {/* Grade Pills for Active Category */}
                <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  {GRADE_CATEGORIES.find((c) => c.id === selectedCategory)?.grades.map((cls) => {
                    const isSelected = selectedClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleSelectGrade(cls)}
                        className={`flex-1 min-w-[50px] py-2 px-3 rounded-xl font-bold text-sm transition-all border cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-102'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{cls}</span>
                        {(cls === 'LKG' || cls === 'UKG') && (
                          <span className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>
                            🎨 Visual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 mt-2">
                  {isKindergarten
                    ? '⭐ Kindergarten Mode: Generates cheerful SVG picture illustrations with every explanation.'
                    : ['9', '10', '11', '12'].includes(selectedClass)
                    ? '🔬 High School Mode: Step-by-step mathematical working, formulas, and STEM depth.'
                    : '💡 School Mode: Real-life intuitive analogies with understanding check questions.'}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEditing ? 'Updating Profile...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEditing ? 'Save Changes' : activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {isEditing && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full mt-2 py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
