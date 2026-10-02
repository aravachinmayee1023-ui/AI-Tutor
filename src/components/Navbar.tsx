/**
 * Navbar.tsx - Professional Navigation Header & Student Profile Bar
 */

import React from 'react';
import { User, getClassBand } from '../types.ts';
import {
  GraduationCap,
  MessageSquare,
  HelpCircle,
  BarChart3,
  LogOut,
  SlidersHorizontal,
  Sparkles,
  Palette,
  Database,
} from 'lucide-react';
import { DatabaseStatusModal } from './DatabaseStatusModal.tsx';

interface NavbarProps {
  user: User;
  activeTab: 'chat' | 'quiz' | 'progress';
  onSelectTab: (tab: 'chat' | 'quiz' | 'progress') => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onSelectTab,
  onEditProfile,
  onLogout,
}) => {
  const [showDbModal, setShowDbModal] = React.useState(false);
  const classBand = getClassBand(user.class);
  const isKindergarten = classBand === 'kindergarten';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Grade Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  AI Tutor
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isKindergarten
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : classBand === 'senior'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {isKindergarten && <Palette className="w-3 h-3 text-amber-600" />}
                  <span>Class {user.class}</span>
                  {isKindergarten && <span className="hidden sm:inline">• Visual Mode</span>}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Personalized K-12 learning assistant
              </p>
            </div>
          </div>

          {/* Center Tabs (Desktop) */}
          <nav className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => onSelectTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Tutor</span>
              {isKindergarten && (
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-extrabold">
                  🎨 Picture AI
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Practice Quiz</span>
            </button>

            <button
              onClick={() => onSelectTab('progress')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Learning Analytics</span>
            </button>
          </nav>

          {/* Student Profile & Sign Out */}
          <div className="flex items-center gap-2">
            {/* Database Live Status Indicator */}
            <button
              onClick={() => setShowDbModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
              title="Click to view live MySQL connection, table data, and Workbench instructions"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">MySQL Live</span>
            </button>

            <button
              onClick={onEditProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer text-xs"
              title="Change student grade or settings"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  Grade {user.class}
                </div>
              </div>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden border-t border-slate-100 py-1.5 gap-1">
          <button
            onClick={() => onSelectTab('chat')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onSelectTab('quiz')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz</span>
          </button>

          <button
            onClick={() => onSelectTab('progress')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Database Verification Modal */}
      <DatabaseStatusModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} />
    </header>
  );
};
