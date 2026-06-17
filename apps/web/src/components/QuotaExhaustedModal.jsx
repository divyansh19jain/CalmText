import React from 'react';
import { motion } from 'framer-motion';

const QuotaExhaustedModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
          </div>

          {/* Message */}
          <div className="text-center text-gray-600 space-y-2">
            <p>We encountered an error while processing your request.</p>
            <p className="text-sm">Our team has been notified and will look into this shortly.</p>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Dismiss
          </button>

          {/* Footer text */}
          <div className="text-center text-xs text-gray-400 pt-2">
            Please try again in a few moments
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuotaExhaustedModal;
