import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import mascotImg from '../assets/pax_mascot.png';

const ResultSection = ({ results, originalText, onNewAnalysis }) => {
  return (
    <div className="w-full flex flex-col gap-10 relative">
      {/* Back Button */}
      <button
        onClick={onNewAnalysis}
        className="absolute -top-12 left-0 flex items-center gap-2 text-gray-500 hover:text-pax-blue-secondary transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Image 3: Original Message Label Box */}
      <div className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4 block">
          Original Message
        </label>
        <p className="text-xl font-semibold text-gray-900 tracking-tight">
          {originalText}
        </p>
      </div>

      {/* Image 3: Pax says... Avatar & Header */}
      <div className="flex items-center gap-4">
        <div className="w-24 h-10 rounded-lg overflow-hidden border border-pax-blue-secondary/30 bg-white p-1 flex items-center justify-center">
          <img src={mascotImg} alt="Pax" className="w-full h-full object-contain" />
        </div>
        <span className="text-pax-blue-secondary font-bold text-lg tracking-tight">
          Pax says...
        </span>
      </div>

      {/* Image 3: Focused Reflection Box */}
      <div className="reflection-box">
        <div className="text-lg md:text-xl font-serif text-gray-800 whitespace-pre-wrap leading-relaxed tracking-tight">
          {results.pax}
        </div>
      </div>

      {/* Image 3: Dual Action Buttons */}
      <div className="flex flex-col gap-4 mt-4">
        <button
          onClick={onNewAnalysis}
          className="btn-paws btn-paws-primary py-5 text-xl font-bold"
        >
          Analyze Another Message
        </button>
      </div>

      {/* Footer Info */}
      <div className="text-center opacity-40 text-[10px] tracking-widest uppercase text-gray-400 mt-4">
        {results.latency_ms}ms | Pax Architecture v4
      </div>
    </div>
  );
};

export default ResultSection;
