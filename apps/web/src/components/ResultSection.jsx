import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuZap, LuBrain, LuCopy, LuCheck } from 'react-icons/lu';
import mascotImg from '../assets/single-logo.png';
import OutgoingLoop from './OutgoingLoop';

// Small copy-to-clipboard button with its own "Copied" feedback.
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — user can select the text manually */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors"
    >
      {copied ? <LuCheck className="w-3 h-3" /> : <LuCopy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

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

// Fetch • Sniff • Stay — the conversation verdict (client spec v5).
const VERDICTS = [
  { key: 'fetch', dot: '🟢', label: 'Fetch', hint: 'Good ground — go ahead' },
  { key: 'sniff', dot: '🟡', label: 'Sniff', hint: 'Look closer before replying' },
  { key: 'stay', dot: '🔴', label: 'Stay', hint: 'Kindest move is to hold off' },
];

// Whole-conversation read (client spec v5), in five beats:
// 🐾 Paxism → 🦴 Secret Sauce → 👃 Subtext (You / Them) →
// 🎾 Fetch•Sniff•Stay → ✍️ Your Turn. The Paxism leads on purpose: it
// lowers the emotional stakes before any analysis.
const ConversationRead = ({ results }) => {
  const { paxism, secret_sauce: secretSauce, subtext_you: you = [],
    subtext_them: them = [], verdict, verdict_why: verdictWhy,
    questions = [] } = results;

  const Bullets = ({ title, items }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">{title}</span>
      <ul className="flex flex-col gap-1">
        {items.map((line) => (
          <li key={line} className="text-sm font-serif text-gray-600 leading-relaxed flex gap-2">
            <span className="text-blue-300 flex-shrink-0">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      {/* 🐾 Paxism — leads, and sets the mindset */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MascotAvatar />
          <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">🐾 Paxism</span>
          <CopyButton text={paxism} />
        </div>
        <div className="text-lg font-serif text-gray-800 leading-relaxed italic">
          “{paxism}”
        </div>
      </motion.div>

      {/* 👃 Subtext — the Secret Sauce (why that Paxism fits) leads, then
          what each side may be communicating. Merged per client. */}
      {(secretSauce || you.length > 0 || them.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BrainAvatar />
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">👃 Subtext</span>
              <span className="text-[11px] text-gray-400 font-serif italic">Possibilities, not certainties</span>
            </div>
            <CopyButton text={secretSauce} />
          </div>
          <div className="flex flex-col gap-4">
            {secretSauce && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                  🦴 Secret Sauce
                </span>
                <div className="text-base font-serif text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {secretSauce}
                </div>
              </div>
            )}
            {you.length > 0 && <Bullets title="You" items={you} />}
            {them.length > 0 && <Bullets title="Them" items={them} />}
          </div>
        </motion.div>
      )}

      {/* 🎾 Fetch • Sniff • Stay */}
      {verdict && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MascotAvatar />
            <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">🎾 Fetch · Sniff · Stay</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VERDICTS.map((v) => {
              const active = v.key === verdict;
              return (
                <div
                  key={v.key}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-center transition-all ${active ? '' : 'opacity-40'}`}
                  style={{
                    background: active ? 'rgba(37,99,235,0.10)' : 'var(--surface)',
                    border: `1px solid ${active ? 'rgba(37,99,235,0.35)' : 'var(--surface-border)'}`,
                  }}
                >
                  <span className="text-base leading-none">{v.dot}</span>
                  <span className="text-xs font-bold text-gray-700">{v.label}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{v.hint}</span>
                </div>
              );
            })}
          </div>
          {verdictWhy && (
            <div className="text-sm font-serif text-gray-700 leading-relaxed">{verdictWhy}</div>
          )}
        </motion.div>
      )}

      {/* ✍️ Your Turn — coaching questions; Pax never writes the reply */}
      {questions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MascotAvatar />
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">✍️ Your Turn</span>
              <span className="text-[11px] text-gray-400 font-serif italic">Your words — Pax just asks the questions</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5">
            {questions.map((q) => (
              <li key={q} className="text-sm font-serif text-gray-700 leading-relaxed flex gap-2.5">
                <span className="text-blue-400 flex-shrink-0">🐾</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </>
  );
};

const ResultSection = ({ results, originalText, onNewAnalysis, mode, token, onHistoryRefresh, conversationId }) => {
  const isReply = mode === 'output';
  // A whole-conversation read comes back in the five-beat format.
  const isConversationRead = !isReply && !!results.secret_sauce;
  return (
    <div className="flex flex-col gap-5">

      {/* Original message — skipped for a whole-conversation read: the user
          just supplied it, so repeating it is only extra text (client). */}
      {!isConversationRead && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="glass-card">
          <label className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-3 block">
            {isReply ? 'Your Reply' : 'Original Message'}
          </label>
          <p className="text-base font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
            {originalText}
          </p>
        </motion.div>
      )}

      {/* Whole-conversation read: Paxism → Secret Sauce → Subtext →
          Fetch·Sniff·Stay → Your Turn */}
      {isConversationRead && <ConversationRead results={results} />}

      {/* Pax box — for replies this is the gut check (client spec) */}
      {!isConversationRead && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}
        className="reflection-box flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <MascotAvatar />
          <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">
            {isReply ? "Pax's gut check:" : "Pax's Take:"}
          </span>
          <CopyButton text={results.pax} />
        </div>
        <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
          {results.pax}
        </div>
      </motion.div>
      )}

      {/* PAXism — only when a reply's gut check ran hot: de-escalation
          from emotion to calming thought */}
      {!isConversationRead && results.paxism && (
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
      {!isConversationRead && results.subtext && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BrainAvatar />
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
              <span className="text-[11px] text-gray-400 font-serif italic">Your brain, back online — after the pause</span>
            </div>
            <CopyButton text={results.subtext.replace(/^SubText\s*\n?/, '').trim()} />
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
