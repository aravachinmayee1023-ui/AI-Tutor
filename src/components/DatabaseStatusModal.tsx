import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, RefreshCw, X, Table, Users, Award, Copy, Check, Download, AlertCircle, Laptop, Cloud } from 'lucide-react';

interface DBStatusData {
  connected: boolean;
  database: string;
  host: string;
  port: number;
  totalUsers: number;
  users: Array<{ id: number; name: string; class: string; language: string }>;
  totalQuizzes: number;
  recentQuizzes: Array<{
    id: number;
    user_id: number;
    subject: string;
    topic: string;
    score: number;
    date: string;
  }>;
}

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DBStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'quizzes' | 'workbench'>('workbench');
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/db-status');
      if (!res.ok) throw new Error('Failed to query database status');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Could not verify database connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  // Generate complete, executable SQL script to sync local MySQL Workbench
  const generateSyncSQL = (): string => {
    if (!data) return '';

    const userInserts = (data.users || [])
      .map(
        (u) =>
          `INSERT INTO users (id, name, class, language) VALUES (${u.id}, '${u.name.replace(/'/g, "\\'")}', '${u.class}', '${u.language || 'English'}') ON DUPLICATE KEY UPDATE name=VALUES(name), class=VALUES(class), language=VALUES(language);`
      )
      .join('\n');

    const quizInserts = (data.recentQuizzes || [])
      .map(
        (q) =>
          `INSERT INTO quiz_results (id, user_id, subject, topic, score) VALUES (${q.id}, ${q.user_id}, '${q.subject.replace(/'/g, "\\'")}', '${q.topic.replace(/'/g, "\\'")}', ${q.score}) ON DUPLICATE KEY UPDATE score=VALUES(score);`
      )
      .join('\n');

    return `-- ========================================================
-- AI TUTOR: LIVE DATABASE SYNC SCRIPT FOR MYSQL WORKBENCH
-- Generated: ${new Date().toLocaleString()}
-- ========================================================

CREATE DATABASE IF NOT EXISTS ai_tutor;
USE ai_tutor;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  class VARCHAR(10) NOT NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'English'
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  score TINYINT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1. Sync All Registered Students (${data.users?.length || 0} students)
${userInserts || '-- No students registered yet'}

-- 2. Sync All Quiz Results (${data.recentQuizzes?.length || 0} quizzes)
${quizInserts || '-- No quizzes taken yet'}

-- 3. Verify in Workbench
SELECT * FROM users;
SELECT * FROM quiz_results;
`;
  };

  const handleCopySQL = () => {
    const sql = generateSyncSQL();
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadSQL = () => {
    const sql = generateSyncSQL();
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_tutor_sync.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">MySQL Database Verification</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Connected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected to database: <code className="font-mono text-indigo-600 font-bold">{data?.database || 'ai_tutor'}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
              title="Refresh database live status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cloud vs Local Laptop Architecture Notice */}
        <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-3 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Understanding why Komal is here but not yet on your laptop:</span>
            <div className="flex flex-wrap items-center gap-2 mt-1 font-medium">
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-amber-200 text-slate-700">
                <Cloud className="w-3 h-3 text-blue-500" />
                This Web App's MySQL: <strong>{data?.users?.length || 0} students</strong> (saved instantly)
              </span>
              <span>↔</span>
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-amber-200 text-slate-700">
                <Laptop className="w-3 h-3 text-emerald-600" />
                Your Laptop's Workbench: Local offline copy
              </span>
            </div>
          </div>
        </div>

        {/* Tab selection */}
        <div className="px-5 pt-3 border-b border-slate-100 flex gap-2 text-xs font-bold bg-white">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'workbench'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Sync to Your Workbench (Instant SQL)</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Live Students ({data?.users?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quizzes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Live Quizzes ({data?.recentQuizzes?.length || 0})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/40">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs mb-4">
              {error}
            </div>
          )}

          {activeTab === 'workbench' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100">
                <div>
                  <h4 className="font-extrabold text-indigo-950 text-xs">
                    Sync All Live Records into Your Laptop's MySQL Workbench
                  </h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Click copy below, paste it into MySQL Workbench on your PC, and press ⚡.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopySQL}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL for Workbench'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSQL}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
                    title="Download .sql file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.sql</span>
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="relative">
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-[300px] leading-relaxed border border-slate-800 select-all">
                  {generateSyncSQL()}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Database Table: <code className="text-indigo-600 font-mono">users</code>
                </span>
                <span className="text-xs text-slate-400">
                  {data?.users?.length || 0} registered student(s)
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">id</th>
                      <th className="py-2.5 px-4">name</th>
                      <th className="py-2.5 px-4">class</th>
                      <th className="py-2.5 px-4">language</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.users?.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{u.id}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                            Class {u.class}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{u.language}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Database Table: <code className="text-indigo-600 font-mono">quiz_results</code>
                </span>
                <span className="text-xs text-slate-400">
                  {data?.recentQuizzes?.length || 0} saved result(s)
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">id</th>
                      <th className="py-2.5 px-3">user_id</th>
                      <th className="py-2.5 px-3">subject</th>
                      <th className="py-2.5 px-3">topic</th>
                      <th className="py-2.5 px-3">score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentQuizzes?.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{q.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{q.user_id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{q.subject}</td>
                        <td className="py-2.5 px-3 text-slate-600">{q.topic}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            q.score >= 4
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.score >= 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {q.score} / 5
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Cloud Database Active & Synced</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
