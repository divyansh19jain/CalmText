import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LuZap, LuBrain, LuCopy, LuCheck } from 'react-icons/lu';
import mascotImg from '../assets/single-logo.png';
import OutgoingLoop from './OutgoingLoop';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

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
// One bullet list (You / Them) inside the Subtext beat.
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

// Whole-conversation read (client spec v5) returned as an ARRAY of beats so
// each can be revealed one at a time: 🐾 Paxism → 👃 Subtext (Secret Sauce +
// You / Them) → 🎾 Fetch·Sniff·Stay → ✍️ Your Turn. The Paxism leads on
// purpose: it lowers the emotional stakes before any analysis.
const buildConversationBeats = (results) => {
  const { paxism, secret_sauce: secretSauce, subtext_you: you = [],
    subtext_them: them = [], verdict, verdict_why: verdictWhy,
    questions = [] } = results;
  const beats = [];

  // 🐾 Paxism — leads, and sets the mindset
  beats.push(
    <motion.div key="cr-paxism" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
  );

  // 👃 Subtext — Secret Sauce leads, then what each side may be communicating
  if (secretSauce || you.length > 0 || them.length > 0) {
    beats.push(
      <motion.div key="cr-subtext" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
    );
  }

  // 🎾 Fetch · Sniff · Stay
  if (verdict) {
    beats.push(
      <motion.div key="cr-verdict" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
    );
  }

  // ✍️ Your Turn — coaching questions; Pax never writes the reply
  if (questions.length > 0) {
    beats.push(
      <motion.div key="cr-questions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
    );
  }

  return beats;
};

// --- PAX Pause (client) -------------------------------------------------
// Before any analysis, Pax notices when a message feels emotionally important
// and quietly sits beside the reader first — body language + a gentle line +
// three calm choices. Urgency is read from Pax's OWN dog reaction: guarded,
// tense body language means higher urgency; a wag or head-tilt stays calm.
const assessUrgency = (pax) => {
  const t = (pax || '').toLowerCase();
  if (/(freez|ears back|watch(es|ing)? the door|leaves the room|tail stops|backs? away|cowers)/.test(t)) return 'very_high';
  if (/(pac(e|ing)|sits up|side-?eye|stiff|stands? still|stares|growl|hackles)/.test(t)) return 'high';
  if (/(one ear up|nose|sniff|tilt|cocks head|perks?)/.test(t)) return 'medium';
  return 'low';
};

// No words — just the dog reacting, matched to the urgency (client).
const PAUSE_BODY = {
  medium: 'Head tilt.',
  high: 'Dog quietly sits.',
  very_high: 'Dog walks over and gently leans against you.',
};

const PAUSE_LINES = [
  'Mind if I sit with you on this one first?',
  'This feels a little heavier than most messages. Want to sit together for a minute?',
  "You don't have to decide in the next ten seconds. I'm here if you want company.",
  'My ears just perked up. This one might deserve another look first.',
  "Let's slow the paws down for just a moment.",
  'Nothing says you have to respond right now.',
];

// Pick a gentle line (stable per result — indexed off the text, no randomness).
const pauseLineFor = (urgency, pax) =>
  urgency === 'very_high'
    ? 'This feels important. Mind if I just sit here with you for a moment?'
    : PAUSE_LINES[(pax || '').length % PAUSE_LINES.length];

// "Help me think" — a guided reflection loop (client v1.1). One question at a
// time, a private box to write in, then Next (loops back at the end) until the
// reader is done. Pax holds the space; the words stay the reader's own.
const REFLECT_QUESTIONS = [
  { q: 'What actually happened?', hint: 'Separate the facts from your interpretation.' },
  { q: 'What are you assuming it means?', hint: 'Name the story your brain filled in.' },
  { q: 'What context might you be missing?', hint: "Not “you're wrong” — just, what don't we know?" },
  { q: 'What are you feeling right now?', hint: 'Especially anger, fear, rejection, embarrassment, urgency.' },
  { q: 'What do you want the other person to understand?', hint: 'Find the real goal.' },
  { q: 'Pause. Now write it in your own words.', hint: 'Your words, your call — Pax just held the space.' },
];

const ResultSection = ({ results, originalText, onNewAnalysis, mode, token, onHistoryRefresh, conversationId }) => {
  const isReply = mode === 'output';
  // A whole-conversation read comes back in the five-beat format.
  const isConversationRead = !isReply && !!results.secret_sauce;

  // PAX Pause: only for a single received message (not replies / conversation
  // reads). Urgency comes from Pax's dog reaction; low urgency skips the pause.
  const urgency = isReply || isConversationRead ? 'low' : assessUrgency(results.pax);
  // Only genuinely tense reactions get the Pause — calm or merely curious
  // messages ("cocks head") go straight to the analysis (client: interrupt
  // only when a message feels emotionally important).
  const needsPause = urgency === 'high' || urgency === 'very_high';
  // pauseStage: 'pause' (sit-beside screen) → 'calm' (breathe) → 'done' (analysis)
  const [pauseStage, setPauseStage] = useState(needsPause ? 'pause' : 'done');
  // "Help me think" reflection loop state
  const [reflectIndex, setReflectIndex] = useState(0);
  const [reflectAnswers, setReflectAnswers] = useState(() =>
    Array(REFLECT_QUESTIONS.length).fill(''),
  );
  const [reflectLoading, setReflectLoading] = useState(false);
  const [reflectRead, setReflectRead] = useState('');
  const [prevResults, setPrevResults] = useState(results);
  if (prevResults !== results) {
    setPrevResults(results);
    setPauseStage(needsPause ? 'pause' : 'done');
    setReflectIndex(0);
    setReflectAnswers(Array(REFLECT_QUESTIONS.length).fill(''));
    setReflectLoading(false);
    setReflectRead('');
  }

  // Finish the reflection: send the reader's own answers to Pax and get a warm
  // read built from them (Pax reflects their clarity back — never a draft).
  const finishReflection = async () => {
    setReflectLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/reflect`,
        { text: originalText, answers: reflectAnswers },
        { headers },
      );
      setReflectRead((data && data.reflection) || '');
    } catch {
      setReflectRead('');
    } finally {
      setReflectLoading(false);
      setPauseStage('reflectResult');
    }
  };

  // Everything on ONE page — Pax's take and the subtext together, no stepping
  // through (client). Built in order, then all rendered at once.
  const outputs = [];
  if (isConversationRead) {
    outputs.push(...buildConversationBeats(results));
  } else {
    outputs.push(
      <motion.div key="pax" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
    );
    if (results.paxism) {
      outputs.push(
        <motion.div key="paxism" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
      );
    }
    if (results.subtext) {
      const subtextClean = results.subtext.replace(/^SubText\s*\n?/, '').trim();
      outputs.push(
        <motion.div key="subtext" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BrainAvatar />
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
              <span className="text-[11px] text-gray-400 font-serif italic">Your brain, back online — after the pause</span>
            </div>
            <CopyButton text={subtextClean} />
          </div>
          <div className="text-sm font-serif text-gray-600 whitespace-pre-wrap leading-relaxed">
            {subtextClean}
          </div>
        </motion.div>
      );
    }
  }

  // PAX Pause — sit beside the reader before showing any analysis.
  if (pauseStage === 'pause') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-6 py-8 text-center">
        <img src={mascotImg} alt="Pax" className="w-32 h-32 object-contain" />
        <p className="text-sm text-blue-400 font-serif italic">🐾 {PAUSE_BODY[urgency]}</p>
        <p className="text-xl font-serif text-gray-800 max-w-md leading-relaxed">
          {pauseLineFor(urgency, results.pax)}
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-xs mt-1">
          <button
            onClick={() => setPauseStage('done')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}
          >
            🟢 Continue
          </button>
          <button
            onClick={() => setPauseStage('calm')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.45)', color: '#b45309' }}
          >
            🟡 Pause with PAX
          </button>
          <button
            onClick={() => setPauseStage('reflect')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.45)', color: '#2563EB' }}
          >
            🔵 Help me think
          </button>
        </div>
      </motion.div>
    );
  }

  // "Pause with PAX" — one quiet breath, then continue when ready.
  if (pauseStage === 'calm') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-5 py-10 text-center">
        <img src={mascotImg} alt="Pax" className="w-28 h-28 object-contain" />
        <p className="text-xl font-serif text-gray-800 max-w-md leading-relaxed">
          Take one slow breath. Nothing has to happen this second.
        </p>
        <p className="text-sm text-gray-400 font-serif italic">Pax is right here, not going anywhere.</p>
        <button
          onClick={() => setPauseStage('done')}
          className="btn-paws btn-paws-primary py-3 text-sm font-bold w-full max-w-xs mt-1"
        >
          I'm ready
        </button>
      </motion.div>
    );
  }

  // "Help me think" — the guided reflection loop, one question at a time.
  if (pauseStage === 'reflect') {
    const { q, hint } = REFLECT_QUESTIONS[reflectIndex];
    const isLast = reflectIndex === REFLECT_QUESTIONS.length - 1;
    // Every question must be answered before moving on (client).
    const answered = reflectAnswers[reflectIndex].trim().length > 0;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col gap-3 py-2">
        <div className="flex items-center">
          <button
            onClick={() => setPauseStage(needsPause ? 'pause' : 'done')}
            className="text-xs text-blue-400 hover:text-blue-600 font-semibold transition-colors"
          >
            ← Back
          </button>
          <span className="text-[11px] text-blue-300 ml-auto">
            {reflectIndex + 1} of {REFLECT_QUESTIONS.length}
          </span>
        </div>

        <div className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <MascotAvatar />
            <span className="pax-label text-blue-600 font-bold text-base tracking-tight">{q}</span>
          </div>
          <p className="text-sm text-gray-500 font-serif italic -mt-1">{hint}</p>
          <textarea
            value={reflectAnswers[reflectIndex]}
            onChange={(e) => {
              const next = [...reflectAnswers];
              next[reflectIndex] = e.target.value;
              setReflectAnswers(next);
            }}
            placeholder="Just for you — write whatever comes to mind…"
            className="w-full p-3 border border-blue-200 rounded-lg text-sm font-serif text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-28"
          />
          <p className="text-[11px] text-gray-400 text-center">
            {answered
              ? 'Your words stay with you — Pax just holds the space.'
              : 'Take a moment to answer before moving on.'}
          </p>
          <button
            disabled={!answered || reflectLoading}
            onClick={() =>
              isLast ? finishReflection() : setReflectIndex((i) => i + 1)
            }
            className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-colors ${
              answered && !reflectLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600/40 text-white/70 cursor-not-allowed'
            }`}
          >
            {isLast ? (reflectLoading ? 'Reading your words…' : 'Finish') : 'Next question →'}
          </button>
        </div>
      </motion.div>
    );
  }

  // Pax's read — built from the reader's own six answers (never a draft).
  if (pauseStage === 'reflectResult') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-5 py-6 text-center">
        <img src={mascotImg} alt="Pax" className="w-24 h-24 object-contain" />
        <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">
          🐾 From your own words
        </span>
        <p className="text-lg font-serif text-gray-800 max-w-md leading-relaxed whitespace-pre-wrap">
          {reflectRead || "Your words are your own — carry them forward when you're ready."}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-1">
          <button
            onClick={() => setPauseStage('done')}
            className="btn-paws btn-paws-primary py-3 text-sm font-bold"
          >
            See Pax's full read
          </button>
          <button
            onClick={onNewAnalysis}
            className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors"
          >
            Start a new message
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Original message — persistent context (skipped for a whole-conversation
          read: the user just supplied it, so repeating it is only extra text). */}
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

      {/* All outputs together on one page */}
      {outputs}

      {/* Then: draft a reply, and the CTA */}
      <OutgoingLoop token={token} onHistoryRefresh={onHistoryRefresh} conversationId={conversationId} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.40 }}>
        <button onClick={onNewAnalysis} className="btn-paws btn-paws-primary py-4 text-sm font-bold">
          Analyze Another Message
        </button>
      </motion.div>
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-blue-300 tracking-widest uppercase">
        <LuZap className="w-3 h-3" />
        {results.latency_ms}ms · Pax Architecture v4
      </div>
    </div>
  );
};

export default ResultSection;
