import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ResultSection from './components/ResultSection';
import mascotImg from './assets/mascot.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const App = () => {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setResults(null);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/pax/analyze`, {
        text: inputText,
        prompt_version: 'pax_v2'
      });
      setResults(response.data);
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
          /* Image 2: Loading State */
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <div className="glow-loader">
                {/* Paw Icon */}
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
          /* Image 3: Result View */
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <ResultSection 
              results={results} 
              originalText={inputText} 
              onNewAnalysis={reset} 
            />
          </motion.div>

        ) : (
          /* Image 1: Initial Home View */
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-lg flex flex-col items-center gap-12"
          >
            {/* Mascot Image (Image 1) */}
            <div className="w-64 h-64 rounded-[40px] overflow-hidden shadow-2xl">
              <img src={mascotImg} alt="Zen Dog" className="w-full h-full object-cover" />
            </div>

            {/* Input Box (Image 1) */}
            <div className="w-full">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste the text message you received..."
                className="paws-input h-48"
              />
            </div>

            {/* Paws Button (Image 1) */}
            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim()}
              className="btn-paws btn-paws-primary py-5 text-xl font-medium tracking-tight bg-amber-secondary/80 hover:bg-amber-primary"
            >
              {/* Paw Icon */}
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
