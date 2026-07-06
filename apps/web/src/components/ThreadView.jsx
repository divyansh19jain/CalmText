import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuMessageSquare, LuSend } from 'react-icons/lu';
import mascotImg from '../assets/single-logo.png';

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

const cleanSubtext = (s) => (s ? s.replace(/^SubText\s*\n?/, '').trim() : '');

// Read-only view of a full conversation thread:
// the incoming message (PAX 1 + SubText) followed by each outgoing draft (PAX 2 + SubText).
const ThreadView = ({ items, onNewAnalysis }) => {
  // Oldest first so the conversation reads top-to-bottom
  const ordered = [...items].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  return (
    <div className="flex flex-col gap-5">
      {ordered.map((item, idx) => {
        const isIncoming = item.mode === 'input';
        return (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.06, 0.4) }}
            className="flex flex-col gap-3"
          >
            {/* Message bubble — who said what */}
            <div className="glass-card">
              <label className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-2 flex items-center gap-1.5">
                {isIncoming ? (
                  <><LuMessageSquare className="w-3 h-3" /> Received</>
                ) : (
                  <><LuSend className="w-3 h-3" /> Your draft</>
                )}
              </label>
              <p className="text-base font-semibold text-gray-900 leading-relaxed">
                {item.text}
              </p>
            </div>

            {/* Pax's Take (PAX 1 for incoming, PAX 2 PAXism for outgoing) */}
            {item.pax && (
              <div className="reflection-box flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <MascotAvatar />
                  <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">Pax's Take:</span>
                </div>
                <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {item.pax}
                </div>
              </div>
            )}

            {/* SubText */}
            {cleanSubtext(item.subtext) && (
              <div className="reflection-box flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <MascotAvatar />
                  <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
                </div>
                <div className="text-sm font-serif text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {cleanSubtext(item.subtext)}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
        <button onClick={onNewAnalysis} className="btn-paws btn-paws-primary py-4 text-sm font-bold">
          Analyze Another Message
        </button>
      </motion.div>
    </div>
  );
};

export default ThreadView;
