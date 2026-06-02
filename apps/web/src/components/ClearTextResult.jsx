import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ClearTextResult = ({ result, originalText, onNewAnalysis }) => {
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
          The Message
        </label>
        <p className="text-xl font-semibold text-gray-900 tracking-tight">{originalText}</p>
      </div>

      {/* ClearText Feedback */}
      <div className="flex flex-col gap-6 rounded-3xl px-6 py-8 md:px-10 md:py-12"
        style={{ background: '#F0F7FF', border: '1px solid rgba(37,99,235,0.15)' }}>
        <div className="flex items-center gap-4">
          <div className="w-24 h-10 rounded-lg overflow-hidden border border-pax-blue-secondary/20 bg-white p-1 flex items-center justify-center">
            <span className="text-pax-blue-secondary font-bold text-sm tracking-tight">CT</span>
          </div>
          <span className="text-pax-blue-secondary font-bold text-lg tracking-tight">ClearText</span>
        </div>
        <div className="text-base md:text-lg font-serif text-gray-700 whitespace-pre-wrap leading-relaxed tracking-tight">
          {result.feedback}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex flex-col gap-4 mt-4">
        <button
          onClick={onNewAnalysis}
          className="w-full py-5 rounded-full bg-pax-blue-secondary text-white text-xl font-bold hover:bg-pax-blue-primary transition-colors"
        >
          Analyze Another Message
        </button>
      </div>

      <div className="text-center opacity-40 text-[10px] tracking-widest uppercase text-gray-400 mt-4">
        {result.latency_ms}ms | ClearText v1
      </div>
    </div>
  );
};

export default ClearTextResult;
