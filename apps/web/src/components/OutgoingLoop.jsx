import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { LuSend, LuPencil, LuTrash2, LuPawPrint, LuFeather } from 'react-icons/lu';
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

// Implements the client's "PAX Outgoing Message Loop":
// draft -> outgoing pause (PAX 2 + Subtext) -> Send As Is | Revise | Delete
//   if Revise -> edit -> outgoing pause ONE final time -> Send | Don't Send/Delete
// PAX 2 (the PAXism) always appears first, Subtext underneath. No third run.
const OutgoingLoop = ({ token, onHistoryRefresh, conversationId, onUseOwnVoice }) => {
  // stages: draft | pause | revise | pauseFinal | sent | deleted
  const [stage, setStage] = useState('draft');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runOutgoing = async (text, final) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/analyze`,
        { text, mode: 'output', conversation_id: conversationId },
        { headers },
      );
      setResult(data);
      setStage(final ? 'pauseFinal' : 'pause');
      if (onHistoryRefresh) onHistoryRefresh();
    } catch {
      setError('Pax could not pause on that. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setStage('draft');
    setDraft('');
    setResult(null);
    setError(null);
  };

  // PAX 2 + Subtext block — shown during both outgoing pauses
  const PauseOutput = () => (
    <div className="flex flex-col gap-4">
      {/* PAX 2 first (the PAXism — primary interruption) */}
      <div className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MascotAvatar />
          <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">Pax's Take:</span>
        </div>
        <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
          {result?.pax}
        </div>
      </div>
      {/* Subtext underneath */}
      {result?.subtext && (
        <div className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MascotAvatar />
            <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
          </div>
          <div className="text-sm font-serif text-gray-600 whitespace-pre-wrap leading-relaxed">
            {result.subtext.replace(/^SubText\s*\n?/, '').trim()}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.31 }}
      className="reflection-box flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <MascotAvatar />
        <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">
          Now writing back?
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* STAGE: Outgoing Draft */}
        {stage === 'draft' && (
          <motion.div key="draft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 font-serif">
              Type the reply you want to send. Pax will pause with you before it goes out.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type what you want to send..."
              className="w-full p-3 border border-blue-200 rounded-lg text-sm font-serif text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24"
            />
            <button
              onClick={() => runOutgoing(draft, false)}
              disabled={loading || !draft.trim()}
              className="btn-paws btn-paws-primary py-3 text-sm font-bold"
            >
              <LuPawPrint className="w-4 h-4" />
              {loading ? 'Pausing...' : 'Pause before sending'}
            </button>
          </motion.div>
        )}

        {/* STAGE: Outgoing Pause -> Send As Is | Revise | Delete */}
        {stage === 'pause' && (
          <motion.div key="pause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="draft-box rounded-lg bg-blue-50/60 border border-blue-100 p-3">
              <p className="draft-label text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1.5">Your draft</p>
              <p className="text-sm font-serif text-gray-700 whitespace-pre-wrap">{draft}</p>
            </div>
            <PauseOutput />
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setStage('sent')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                <LuSend className="w-3.5 h-3.5" /> Send As Is
              </button>
              <button onClick={() => setStage('revise')}
                className="revise-btn flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                <LuPencil className="w-3.5 h-3.5" /> Revise
              </button>
              <button onClick={() => setStage('deleted')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LuTrash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE: Revise -> edit -> run loop one final time */}
        {stage === 'revise' && (
          <motion.div key="revise" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 font-serif">Edit your message, then pause once more.</p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-lg text-sm font-serif text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24"
            />
            <button
              onClick={() => runOutgoing(draft, true)}
              disabled={loading || !draft.trim()}
              className="btn-paws btn-paws-primary py-3 text-sm font-bold"
            >
              <LuPawPrint className="w-4 h-4" />
              {loading ? 'Pausing...' : 'Pause one final time'}
            </button>
          </motion.div>
        )}

        {/* STAGE: Final Pause -> Send | Don't Send/Delete (no third run) */}
        {stage === 'pauseFinal' && (
          <motion.div key="pauseFinal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <div className="draft-box rounded-lg bg-blue-50/60 border border-blue-100 p-3">
              <p className="draft-label text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1.5">Your revised message</p>
              <p className="text-sm font-serif text-gray-700 whitespace-pre-wrap">{draft}</p>
            </div>
            <PauseOutput />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStage('sent')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                <LuSend className="w-3.5 h-3.5" /> Send
              </button>
              <button onClick={() => setStage('deleted')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LuTrash2 className="w-3.5 h-3.5" /> Don't Send
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE: End of loop — Pax gently encourages a pause and hands off to Own Voice */}
        {stage === 'sent' && (
          <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4 py-2">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <LuPawPrint className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="reflection-box">
              <p className="text-sm font-serif text-gray-700 leading-relaxed text-center">
                🐾 “Woof… my nose says it’s time for a pause. Leave this trail here and take
                about a 30-second sniff break. If you still want to reply when you get back,
                I’ll help you say it in your own voice.”
              </p>
            </div>
            {onUseOwnVoice && (
              <button
                onClick={onUseOwnVoice}
                className="flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <LuFeather className="w-4 h-4" /> Say it in my own voice
              </button>
            )}
            <button onClick={restart} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              Write another reply
            </button>
          </motion.div>
        )}

        {/* STAGE: Deleted / Didn't send */}
        {stage === 'deleted' && (
          <motion.div key="deleted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <LuTrash2 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-serif text-gray-600 text-center">
              Let go. Some messages are better left unsent.
            </p>
            <button onClick={restart} className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              Start a new reply
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-red-500 text-xs text-center bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </motion.div>
  );
};

export default OutgoingLoop;
