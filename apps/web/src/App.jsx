import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, LogIn, UserCircle } from 'lucide-react';
import ResultSection from './components/ResultSection';
import ClearTextResult from './components/ClearTextResult';
import Auth from './components/Auth';
import History from './components/History';
import Profile from './components/Profile';
import { useAuth } from './context/AuthContext';
import mascotImg from './assets/pax_mascot.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const App = () => {
  const { token, user, logout, isAuthenticated } = useAuth();

  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('input'); // 'input' | 'output' | 'cleartext'
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedText, setAnalyzedText] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ClearText specific state
  const [ctText, setCtText] = useState('');
  const [ctResult, setCtResult] = useState(null);

  const handleAnalyze = async () => {
    if (mode === 'cleartext') {
      if (!ctText.trim()) return;
      setLoading(true);
      setCtResult(null);
      setError(null);
      try {
        const { data } = await axios.post(`${API_BASE_URL}/pax/cleartext`, {
          text: ctText,
        });
        setCtResult(data);
      } catch {
        setError('Analysis failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!inputText.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${API_BASE_URL}/pax/analyze`,
        { text: inputText, mode },
        { headers }
      );
      setResults(response.data);
      setAnalyzedText(inputText);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setCtResult(null);
    setInputText('');
    setCtText('');
  };

  const handleReplay = (item) => {
    setShowHistory(false);
    setResults({ pax: item.pax, subtext: item.subtext, latency_ms: 0 });
    setAnalyzedText(item.text);
    setMode(item.mode);
  };

  const isResultVisible = results || ctResult;

  return (
    <div className="min-h-screen bg-app-bg text-gray-900 flex flex-col items-center justify-start p-6 pt-4 md:pt-6">

      {/* Top-right auth bar */}
      <div className="w-full max-w-lg flex justify-end gap-2 mb-2">
        {isAuthenticated ? (
          <>
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <UserCircle className="w-4 h-4 text-pax-blue-secondary" />
              <span className="truncate max-w-[100px]">{user?.name || user?.email}</span>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-xs text-pax-blue-secondary font-semibold px-3 py-2 rounded-xl hover:bg-pax-blue-dim transition-colors"
            >
              <Clock className="w-4 h-4" /> History
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-1.5 text-xs text-pax-blue-secondary font-semibold px-3 py-2 rounded-xl hover:bg-pax-blue-dim transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showProfile ? (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-app-bg overflow-y-auto">
            <Profile onClose={() => setShowProfile(false)} />
          </motion.div>

        ) : showHistory ? (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-app-bg overflow-y-auto">
            <History onClose={() => setShowHistory(false)} onReplay={handleReplay} />
          </motion.div>

        ) : loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8">
            <div className="glow-loader">
              <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="7" r="3" /><circle cx="7" cy="11" r="2.5" />
                <circle cx="17" cy="11" r="2.5" /><circle cx="12" cy="14" r="1.5" />
                <path d="M12 21c-3.5 0-6.5-2.5-6.5-5.5s2-4.5 4-4.5h5c2 0 4 1.5 4 4.5S15.5 21 12 21z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">Taking a moment to pause...</p>
          </motion.div>

        ) : results ? (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl">
            <ResultSection results={results} originalText={analyzedText} onNewAnalysis={reset} mode={mode} />
          </motion.div>

        ) : ctResult ? (
          <motion.div key="ctresult" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl">
            <ClearTextResult result={ctResult} originalText={ctText} onNewAnalysis={reset} />
          </motion.div>

        ) : (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full max-w-lg flex flex-col items-center gap-6">

            <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white">
              <img src={mascotImg} alt="Zen Dog" className="w-full h-auto object-contain -mt-0.5 scale-105" />
            </div>

            {/* Three mode buttons */}
            <div className="flex gap-2 w-full p-1.5 bg-gray-100 rounded-2xl">
              <button onClick={() => setMode('input')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${mode === 'input' ? 'bg-pax-blue-secondary text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
                I Received This
              </button>
              <button onClick={() => setMode('output')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${mode === 'output' ? 'bg-pax-blue-secondary text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
                I Want To Say This
              </button>
              <button onClick={() => setMode('cleartext')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${mode === 'cleartext' ? 'bg-pax-blue-secondary text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
                ClearText
              </button>
            </div>

            {/* ClearText mode: single input */}
            {mode === 'cleartext' ? (
              <div className="w-full">
                <textarea
                  value={ctText}
                  onChange={(e) => setCtText(e.target.value)}
                  placeholder="Paste the message you want to analyze..."
                  className="paws-input h-48"
                />
              </div>
            ) : (
              <div className="w-full">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={mode === 'input' ? "Paste the message you received..." : "Paste the draft you're writing..."}
                  className="paws-input h-48"
                />
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={mode === 'cleartext' ? !ctText.trim() : !inputText.trim()}
              className={`btn-paws py-5 text-xl font-bold tracking-tight btn-paws-primary`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="7" r="3" /><circle cx="7" cy="11" r="2.5" />
                <circle cx="17" cy="11" r="2.5" /><circle cx="12" cy="14" r="1.5" />
                <path d="M12 21c-3.5 0-6.5-2.5-6.5-5.5s2-4.5 4-4.5h5c2 0 4 1.5 4 4.5S15.5 21 12 21z" />
              </svg>
              {mode === 'cleartext' ? 'ClearText' : 'Pause'}
            </button>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default App;
