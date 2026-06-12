import React from 'react';
import { motion } from 'framer-motion';
import { LuZap } from 'react-icons/lu';

const ClearTextResult = ({ result, originalText, onNewAnalysis }) => {
  return (
    <div className="flex flex-col gap-5">

      {/* Original Message */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3 block">
          The Message
        </label>
        <p className="text-base font-semibold text-gray-900 leading-relaxed">
          {originalText}
        </p>
      </motion.div>

      {/* ClearText Feedback */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(219,234,254,0.80)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <span className="text-blue-600 font-bold text-xs select-none">CT</span>
          </div>
          <span className="text-blue-600 font-bold text-sm tracking-tight">ClearText</span>
        </div>
        <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
          {result.feedback}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.17 }}>
        <button onClick={onNewAnalysis} className="btn-paws btn-paws-primary py-4 text-sm font-bold">
          Analyze Another Message
        </button>
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-blue-300 tracking-widest uppercase">
        <LuZap className="w-3 h-3" />
        {result.latency_ms}ms · ClearText v1
      </div>
    </div>
  );
};

export default ClearTextResult;
