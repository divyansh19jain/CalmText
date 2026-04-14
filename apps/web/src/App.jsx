import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ResultSection from './components/ResultSection';
import mascotImg from './assets/pax_mascot.png';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
const App = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('input'); // 'input' or 'output'
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedText, setAnalyzedText] = useState('');

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/pax/analyze`, {
        text: inputText,
        mode: mode
      });
      setResults(response.data);
      setAnalyzedText(inputText);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-app-bg text-gray-200 flex flex-col items-center justify-start p-6 pt-24 md:pt-32">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <div className="glow-loader">
                <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="7" r="3" />
                  <circle cx="7" cy="11" r="2.5" />
                  <circle cx="17" cy="11" r="2.5" />
                  <circle cx="12" cy="14" r="1.5" />
                  <path d="M12 21c-3.5 0-6.5-2.5-6.5-5.5s2-4.5 4-4.5h5c2 0 4 1.5 4 4.5S15.5 21 12 21z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 font-medium tracking-tight">Taking a moment to paws...</p>
          </motion.div>

        ) : results ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <ResultSection
              results={results}
              originalText={analyzedText}
              onNewAnalysis={reset}
            />
          </motion.div>

        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-lg flex flex-col items-center gap-12"
          >
            <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white p-4">
              <img src={mascotImg} alt="Zen Dog" className="w-full h-auto object-contain" />
            </div>

            {/* Mode Selector */}
            <div className="flex gap-4 w-full p-1 bg-black/20 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setMode('input')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  mode === 'input' 
                    ? 'bg-amber-secondary text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                I Received This
              </button>
              <button
                onClick={() => setMode('output')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  mode === 'output' 
                    ? 'bg-amber-secondary text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                I'm Drafting This
              </button>
            </div>

            <div className="w-full">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={mode === 'input' ? "Paste the message you received..." : "Paste the draft you're writing..."}
                className="paws-input h-48"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim()}
              className="btn-paws btn-paws-primary py-5 text-xl font-medium tracking-tight bg-amber-secondary/80 hover:bg-amber-primary"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="7" r="3" />
                <circle cx="7" cy="11" r="2.5" />
                <circle cx="17" cy="11" r="2.5" />
                <circle cx="12" cy="14" r="1.5" />
                <path d="M12 21c-3.5 0-6.5-2.5-6.5-5.5s2-4.5 4-4.5h5c2 0 4 1.5 4 4.5S15.5 21 12 21z" />
              </svg>
              Paws
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
