import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuZap, LuFeather, LuCopy, LuCheck } from 'react-icons/lu';

const OwnVoiceResult = ({ result, intent, onNewAnalysis }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* What they wanted to say */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3 block">
          You wanted to say
        </label>
        <p className="text-base font-semibold text-gray-900 leading-relaxed">
          {intent}
        </p>
      </motion.div>

      {/* The message in their voice */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500">
              <LuFeather className="w-4 h-4" />
            </div>
            <span className="text-blue-600 font-bold text-sm tracking-tight">In your voice:</span>
          </div>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
            {copied ? <LuCheck className="w-3.5 h-3.5" /> : <LuCopy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
          {result.message}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.17 }}>
        <button onClick={onNewAnalysis} className="btn-paws btn-paws-primary py-4 text-sm font-bold">
          Write Another
        </button>
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-blue-300 tracking-widest uppercase">
        <LuZap className="w-3 h-3" />
        {result.latency_ms}ms · Own Voice v1
      </div>
    </div>
  );
};

export default OwnVoiceResult;
