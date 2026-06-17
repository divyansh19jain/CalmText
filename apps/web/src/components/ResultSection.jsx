import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LuZap } from 'react-icons/lu';
import mascotImg from '../assets/single-logo.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const MascotAvatar = () => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
      {failed ? (
        <span className="text-blue-600 font-bold text-xs select-none">PAX</span>
      ) : (
        <img src={mascotImg} alt="Pax" className="w-full h-full object-contain"
          onError={() => setFailed(true)} />
      )}
    </div>
  );
};

const ResultSection = ({ results, originalText, onNewAnalysis, token, onHistoryRefresh }) => {
  const [ctText, setCtText] = useState('');
  const [ctResult, setCtResult] = useState(null);
  const [ctLoading, setCtLoading] = useState(false);

  const handleClearText = async () => {
    if (!ctText.trim()) return;
    setCtLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/cleartext`,
        { text: ctText },
        { headers }
      );
      setCtResult(data);
      setCtText('');
      // Refresh history if callback provided
      if (onHistoryRefresh) {
        onHistoryRefresh();
      }
    } catch {
      alert('Failed to analyze. Please try again.');
    } finally {
      setCtLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Original Message */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3 block">
          Original Message
        </label>
        <p className="text-base font-semibold text-gray-900 leading-relaxed">
          {originalText}
        </p>
      </motion.div>

      {/* Pax box */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MascotAvatar />
          <span className="text-blue-600 font-bold text-sm tracking-tight">Pax's Take:</span>
        </div>
        <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
          {results.pax}
        </div>
      </motion.div>

      {/* SubText box */}
      {results.subtext && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MascotAvatar />
            <span className="text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
          </div>
          <div className="text-sm font-serif text-gray-600 whitespace-pre-wrap leading-relaxed">
            {results.subtext.replace(/^SubText\s*\n?/, '').trim()}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
        <button onClick={onNewAnalysis} className="btn-paws btn-paws-primary py-4 text-sm font-bold">
          Analyze Another Message
        </button>
      </motion.div>

      {/* ClearText Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MascotAvatar />
          <span className="text-blue-600 font-bold text-sm tracking-tight">ClearText:</span>
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            value={ctText}
            onChange={(e) => setCtText(e.target.value)}
            placeholder="Enter a message to analyze its tone and clarity..."
            className="w-full p-3 border border-blue-200 rounded-lg text-sm font-serif text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24"
          />
          <button
            onClick={handleClearText}
            disabled={ctLoading || !ctText.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {ctLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {ctResult && (
          <div className="text-sm font-serif text-gray-700 whitespace-pre-wrap leading-relaxed border-t border-blue-100 pt-3">
            {ctResult.feedback}
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-blue-300 tracking-widest uppercase">
        <LuZap className="w-3 h-3" />
        {results.latency_ms}ms · Pax Architecture v4
      </div>
    </div>
  );
};

export default ResultSection;
