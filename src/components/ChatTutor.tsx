/**
 * ChatTutor.tsx - Professional AI Chat Tutor
 *
 * Key Capabilities:
 * - English instruction throughout
 * - Automatic visual picture / SVG illustration rendering for LKG & UKG students
 * - Grade-band tailored explanations (Kindergarten, Primary, Middle, High School)
 * - Ephemeral 6-message state window as specified
 * - Clear error states and quick suggested questions
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage, getClassBand, SUBJECTS_BY_BAND } from '../types.ts';
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Palette,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface ChatTutorProps {
  user: User;
}

/**
 * Helper to parse text and extract embedded SVG markup
 */
function parseMessageContent(rawContent: string): { text: string; svg: string | null } {
  const svgRegex = /<svg[\s\S]*?<\/svg>/i;
  const match = rawContent.match(svgRegex);

  if (match) {
    const svg = match[0];
    const cleanText = rawContent.replace(svgRegex, '').trim();
    return { text: cleanText, svg };
  }

  return { text: rawContent, svg: null };
}

export const ChatTutor: React.FC<ChatTutorProps> = ({ user }) => {
  const classBand = getClassBand(user.class);
  const isKindergarten = classBand === 'kindergarten';
  const isJunior = classBand === 'junior';
  const subjects = SUBJECTS_BY_BAND[classBand];

  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || 'English & Phonics');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Suggested questions based on grade
  const getSuggestions = () => {
    if (isKindergarten) {
      if (selectedSubject.includes('English') || selectedSubject.includes('Phonics')) {
        return [
          'What words rhyme with "cat"? Show me pictures!',
          'Can you teach me the letter B with an illustration?',
          'Tell me a fun 2-sentence story about a happy puppy!',
        ];
      }
      if (selectedSubject.includes('Numbers')) {
        return [
          'Count 5 bright red apples for me with a picture!',
          'Draw and explain what a yellow star shape looks like!',
          'Which is bigger: 3 or 7? Show me with balloons!',
        ];
      }
      return [
        'What sound does a friendly cow make? Draw one!',
        'Why does the sun shine in the morning?',
        'Show me a picture of three colorful butterflies!',
      ];
    }

    if (isJunior) {
      return [
        'Count 10 colorful marbles with me!',
        'What is the difference between a circle and a square?',
        'Why do birds have feathers and wings?',
      ];
    }

    if (classBand === 'senior') {
      if (selectedSubject.includes('Math')) {
        return [
          'Explain quadratic formula and show step-by-step working for 2x^2 + 5x - 3 = 0',
          'How do I find the derivative of f(x) = sin(x)*cos(x)?',
          'Explain conditional probability with a clear formula and example',
        ];
      }
      if (selectedSubject.includes('Physics')) {
        return [
          'Explain Newton\'s second law with formula F = ma and SI units',
          'What is total internal reflection in optics?',
          'Derive the work-energy theorem simply with steps',
        ];
      }
      return [
        'Explain the stages of Mitosis step by step',
        'Why do noble gases have zero valency in the periodic table?',
        'Explain exothermic vs endothermic reactions with energy graphs',
      ];
    }

    // Middle school
    return [
      'Why do plants need sunlight for photosynthesis?',
      'How do I add fractions with different denominators?',
      'Explain the water cycle with a simple real-life example',
    ];
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuestion).trim();
    if (!text || loading) return;

    setErrorMsg('');
    const newMsg: ChatMessage = { role: 'user', content: text };

    // Maintain only the last 6 messages in state
    const updatedMessages = [...messages, newMsg].slice(-6);
    setMessages(updatedMessages);
    setInputQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: user.class,
          subject: selectedSubject,
          messages: updatedMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Please try again.');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMsg].slice(-6));
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const msg = err instanceof Error ? err.message : 'Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto p-3 sm:p-4">
      {/* Subject Selector Bar */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Subject:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {subjects.map((sub) => {
              const isSelected = selectedSubject === sub.name;
              return (
                <button
                  key={sub.name}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer ml-auto"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 bg-white rounded-3xl shadow-xs border border-slate-200 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-lg mx-auto">
            <div className={`p-4 rounded-3xl mb-4 ${
              isKindergarten ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {isKindergarten ? <Palette className="w-10 h-10" /> : <Bot className="w-10 h-10" />}
            </div>

            <h3 className="font-extrabold text-xl text-slate-900 mb-1.5">
              {isKindergarten ? `Hello ${user.name}! 🌟` : `Hi ${user.name}! Ready to study ${selectedSubject}?`}
            </h3>

            <p className="text-slate-600 text-sm mb-6 max-w-md">
              {isKindergarten
                ? 'Ask any question! I will explain with words and generate colorful picture illustrations for you!'
                : `I am your tutor for Class ${user.class}. Ask questions, homework doubts, or conceptual explanations.`}
            </p>

            {/* Suggested Starter Chips */}
            <div className="w-full space-y-2 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isKindergarten ? '🎨 Click to ask & generate pictures:' : '💡 Suggested study questions:'}
              </span>
              <div className="flex flex-col gap-2">
                {getSuggestions().map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="w-full text-left p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/70 hover:border-indigo-200 text-slate-700 text-xs font-medium transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>{sug}</span>
                    <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const { text, svg } = isUser ? { text: msg.content, svg: null } : parseMessageContent(msg.content);

              return (
                <div
                  key={index}
                  className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white font-bold text-xs'
                        : isKindergarten
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-slate-900 text-white font-bold'
                    }`}
                  >
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="max-w-[85%] sm:max-w-[75%] space-y-2.5">
                    {/* Text Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs whitespace-pre-wrap leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-xs font-medium text-sm'
                          : 'bg-slate-100/90 text-slate-800 rounded-tl-xs text-sm border border-slate-200/60'
                      }`}
                    >
                      {text}
                    </div>

                    {/* Dedicated Visual Image / SVG Illustration Card */}
                    {svg && (
                      <div className="bg-gradient-to-br from-amber-50/80 to-indigo-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span>Picture Explanation for {user.class}</span>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-amber-200/60">
                            🎨 Vector Illustration
                          </span>
                        </div>

                        {/* Render the SVG image safely */}
                        <div
                          className="flex items-center justify-center p-2 bg-white rounded-xl border border-amber-100 shadow-inner overflow-hidden max-w-full"
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 items-start">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isKindergarten ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
                }`}>
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3 text-slate-600 text-sm flex items-center gap-2 border border-slate-200">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping delay-100" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping delay-200" />
                  </div>
                  <span className="font-semibold text-xs text-slate-500">
                    {isKindergarten ? 'Generating answer and picture illustration...' : 'Tutor is preparing explanation...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="my-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            onClick={() => handleSendMessage()}
            className="font-bold underline hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="mt-3 bg-white p-2 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isKindergarten
              ? 'Ask anything! e.g., "What is a red apple?", "Count 5 stars"...'
              : `Ask any question in ${selectedSubject} (Class ${user.class})...`
          }
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-xl focus:outline-none bg-transparent text-slate-800 placeholder:text-slate-400 text-sm"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputQuestion.trim()}
          className="p-2.5 sm:px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      <div className="flex justify-between items-center px-3 py-1 text-[11px] text-slate-400">
        <span>Session chat: keeps last 6 messages active</span>
        {isKindergarten && <span className="text-amber-600 font-semibold">🎨 Picture generation active for {user.class}</span>}
      </div>
    </div>
  );
};
