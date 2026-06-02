import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import mascotImg from '../assets/pax_mascot.png';

const MascotAvatar = ({ borderClass = 'border-pax-blue-secondary/30' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`w-24 h-10 rounded-lg overflow-hidden border ${borderClass} bg-white p-1 flex items-center justify-center`}>
      {failed ? (
        <span className="text-pax-blue-secondary font-bold text-sm tracking-tight select-none">CT</span>
      ) : (
        <img
          src={mascotImg}
          alt="Pax"
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};

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

      {/* Original Message */}
      <div className="glass-card">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4 block">
          Original Message
        </label>
        <p className="text-xl font-semibold text-gray-900 tracking-tight">
          {originalText}
        </p>
      </div>

      {/* Pax Box */}
      <div className="reflection-box flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <MascotAvatar />
          <span className="text-pax-blue-secondary font-bold text-lg tracking-tight">
            Pax says...
          </span>
        </div>
        <div className="text-lg md:text-xl font-serif text-gray-800 whitespace-pre-wrap leading-relaxed tracking-tight">
          {results.pax}
        </div>
      </div>

      {/* SubText Box */}
      {results.subtext && (
        <div className="reflection-box flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <MascotAvatar />
            <span className="text-pax-blue-secondary font-bold text-lg tracking-tight">
              SubText...
            </span>
          </div>
          <div className="text-base md:text-lg font-serif text-gray-600 whitespace-pre-wrap leading-relaxed tracking-tight">
            {results.subtext.replace(/^SubText\s*\n?/, '').trim()}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mt-4">
        <button
          onClick={onNewAnalysis}
          className="btn-paws btn-paws-primary py-5 text-xl font-bold"
        >
          Analyze Another Message
        </button>
      </div>

      {/* Footer */}
      <div className="text-center opacity-40 text-[10px] tracking-widest uppercase text-gray-400 mt-4">
        {results.latency_ms}ms | Pax Architecture v4
      </div>
    </div>
  );
};

export default ResultSection;
