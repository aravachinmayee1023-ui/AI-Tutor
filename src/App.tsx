/**
 * App.tsx - Root Application for AI Tutor
 *
 * Coordinates:
 * 1. Student login and password authentication & profile management
 * 2. Logout support
 * 3. Chat Tutor (Class-tailored explanations, frontend 6-message window)
 * 4. 5-Question MCQ Quiz with immediate feedback and explanation
 * 5. Progress tracking (Total quizzes, average score, scores over time, weak topics)
 */

import React, { useState, useEffect } from 'react';
import { User } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { ChatTutor } from './components/ChatTutor.tsx';
import { QuizView } from './components/QuizView.tsx';
import { ProgressView } from './components/ProgressView.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'progress'>('chat');
  const [quizInitialTopic, setQuizInitialTopic] = useState<string>('');

  // Restore session user if present
  useEffect(() => {
    const saved = sessionStorage.getItem('ai_tutor_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id && parsed?.name) {
          setCurrentUser(parsed);
          setShowLoginModal(false);
          return;
        }
      } catch {
        sessionStorage.removeItem('ai_tutor_user');
      }
    }
    // If not logged in, prompt login modal
    setShowLoginModal(true);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('ai_tutor_user', JSON.stringify(user));
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ai_tutor_user');
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const handlePracticeTopicFromProgress = (subject: string, topic: string) => {
    setQuizInitialTopic(topic);
    setActiveTab('quiz');
  };

  const handleNavigateToChatFromQuiz = (_subject: string) => {
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Login / Profile Modal */}
      {(!currentUser || showLoginModal) && (
        <LoginModal
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onClose={currentUser ? () => setShowLoginModal(false) : undefined}
        />
      )}

      {/* Main App Container */}
      {currentUser && (
        <>
          <Navbar
            user={currentUser}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (tab !== 'quiz') {
                setQuizInitialTopic('');
              }
              setActiveTab(tab);
            }}
            onEditProfile={() => setShowLoginModal(true)}
            onLogout={handleLogout}
          />

          <main className="flex-1 pb-8">
            {activeTab === 'chat' && <ChatTutor user={currentUser} />}

            {activeTab === 'quiz' && (
              <QuizView
                user={currentUser}
                initialTopic={quizInitialTopic}
                onNavigateToProgress={() => setActiveTab('progress')}
                onNavigateToChat={handleNavigateToChatFromQuiz}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressView
                user={currentUser}
                onPracticeTopic={handlePracticeTopicFromProgress}
                onNavigateToQuiz={() => setActiveTab('quiz')}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
