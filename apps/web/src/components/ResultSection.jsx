import React from 'react';
import { motion } from 'framer-motion';
import mascotImg from '../assets/mascot.png';

const ResultSection = ({ results, originalText, onNewAnalysis }) => {
  return (
    <div className="w-full flex flex-col gap-10">
      
      {/* Image 3: Original Message Label Box */}
      <div className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-4 block">
          Original Message
        </label>
        <p className="text-xl font-medium text-white tracking-tight">
          {originalText}
        </p>
      </div>

      {/* Image 3: Pax says... Avatar & Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-secondary/30">
          <img src={mascotImg} alt="Pax" className="w-full h-full object-cover" />
        </div>
        <span className="text-amber-primary font-semibold text-lg tracking-tight">
          Pax says...
        </span>
      </div>

      {/* Image 3: Focused Reflection Box */}
      <div className="reflection-box">
        <div className="text-2xl md:text-3xl font-serif text-white whitespace-pre-wrap leading-relaxed tracking-tight italic">
          {results.pax}
        </div>
      </div>

      {/* Image 3: Dual Action Buttons */}
      <div className="flex flex-col gap-4 mt-4">
        <button
          onClick={onNewAnalysis}
          className="btn-paws btn-paws-ghost py-4 text-amber-primary/80 hover:text-amber-primary"
        >
          Analyze Another Message
        </button>

        <button
          className="btn-paws btn-paws-primary py-5 text-xl font-bold bg-[#D0A175]/90 hover:bg-[#D0A175]"
        >
          Continue to Full Analysis
        </button>
      </div>

      {/* Footer Info (Implicitly hidden or moved to the bottom of the card) */}
      <div className="text-center opacity-30 text-[10px] tracking-widest uppercase text-gray-500 mt-4">
        {results.latency_ms}ms | Pax v2
      </div>
    </div>
  );
};

export default ResultSection;
