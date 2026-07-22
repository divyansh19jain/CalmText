import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuZap, LuBrain } from 'react-icons/lu';
import mascotImg from '../assets/single-logo.png';
import OutgoingLoop from './OutgoingLoop';

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

// SubText is NOT Pax — it's your own brain coming back online after the pause.
// So it gets a neutral human icon, never the dog mascot.
const BrainAvatar = () => (
  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
    style={{ background: 'rgba(37,99,235,0.08)' }}>
    <LuBrain className="text-blue-500" style={{ width: '18px', height: '18px' }} />
  </div>
);

const ResultSection = ({ results, originalText, onNewAnalysis, mode, token, onHistoryRefresh, conversationId }) => {
  const isReply = mode === 'output';
  return (
    <div className="flex flex-col gap-5">

      {/* Original Message */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3 block">
          {isReply ? 'Your Reply' : 'Original Message'}
        </label>
        <p className="text-base font-semibold text-gray-900 leading-relaxed">
          {originalText}
        </p>
      </motion.div>

      {/* Pax box — for replies this is the gut check (client spec) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MascotAvatar />
          <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">
            {isReply ? "Pax's gut check:" : "Pax's Take:"}
          </span>
        </div>
        <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
          {results.pax}
        </div>
      </motion.div>

      {/* PAXism — only when a reply's gut check ran hot: de-escalation
          from emotion to calming thought */}
      {results.paxism && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MascotAvatar />
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">Pax calms:</span>
              <span className="text-[11px] text-gray-400 font-serif italic">A slow breath before the send button</span>
            </div>
          </div>
          <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
            {results.paxism}
          </div>
        </motion.div>
      )}

      {/* SubText box */}
      {results.subtext && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BrainAvatar />
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
              <span className="text-[11px] text-gray-400 font-serif italic">Your brain, back online — after the pause</span>
            </div>
          </div>
          <div className="text-sm font-serif text-gray-600 whitespace-pre-wrap leading-relaxed">
            {results.subtext.replace(/^SubText\s*\n?/, '').trim()}
          </div>
        </motion.div>
      )}

      {/* Outgoing Message Loop — draft a reply, gut check with Pax, decide */}
      <OutgoingLoop token={token} onHistoryRefresh={onHistoryRefresh} conversationId={conversationId} />

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.40 }}>
        <button onClick={onNewAnalysis} className="btn-paws btn-paws-primary py-4 text-sm font-bold">
          Analyze Another Message
        </button>
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
