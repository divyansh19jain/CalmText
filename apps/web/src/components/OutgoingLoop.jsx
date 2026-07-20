import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { LuSend, LuPencil, LuTrash2, LuPawPrint, LuFeather, LuCoffee, LuBrain } from 'react-icons/lu';
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

// The three communication goals of the PAX "stuck" flow (client spec v1).
// Each goal carries its three fixed reflection questions.
const GOALS = [
  {
    key: 'understanding',
    emoji: '❤️',
    label: 'Understanding',
    line: 'I want to be understood.',
    questions: [
      'What is the one thing you most hope they understand?',
      'Is your message making that point clear?',
      'What part of your message could distract from your main point?',
    ],
  },
  {
    key: 'peace',
    emoji: '☮️',
    label: 'Peace',
    line: 'I want less conflict and more resolution.',
    questions: [
      'What would peace actually look like after this conversation?',
      'Is every point necessary today?',
      'What wording might lower defensiveness without changing your message?',
    ],
  },
  {
    key: 'respect',
    emoji: '🤝',
    label: 'Respect',
    line: 'I want to communicate my values and boundaries respectfully.',
    questions: [
      'What boundary or value are you trying to communicate?',
      'Are you describing behavior instead of attacking the person?',
      'Will you still feel proud of this message tomorrow?',
    ],
  },
];

// One-sentence grounding resets — PAX interrupts emotional looping, then
// immediately hands the message back. Never shown when a draft is high-risk.
const PAX_RESETS = [
  '“Quick mission: find three blue things. I would help, but dogs are surprisingly bad at color palettes.”',
  '“Important scientific question… what can you smell right now? I’m hoping for bacon, but I’ll accept coffee.”',
  '“We’ve read this message enough that I’m starting to memorize it… and I’m a dog.”',
  '“What’s something good to eat near you? Asking purely for research purposes.”',
  '“I had another thought… never mind, I saw an imaginary squirrel. Back to your message.”',
];

// Implements the client's "PAX Outgoing Message Loop" + "stuck" flow:
// draft -> outgoing pause (PAX 2 + Subtext) -> Send As Is | Revise | Delete
//   if Revise -> edit -> outgoing pause ONE final time -> Send | I'm stuck | Don't Send
//   if stuck  -> pick a goal (Understanding / Peace / Respect)
//             -> answer 3 reflection questions -> edit or send as is
//             -> if editing, PAX judges the new draft against the goal (no rewrites)
//             -> after 2 coached edits, PAX encourages a real pause
//                (take a break | one-line PAX reset), unless high-risk —
//                then empathy only and a nudge toward a real human.
const OutgoingLoop = ({ token, onHistoryRefresh, conversationId, onUseOwnVoice }) => {
  // stages: draft | pause | revise | pauseFinal | goalSelect | goalReflect |
  //         coachEdit | coachPause | breakOffer | takeBreak | paxReset | sent | deleted
  const [stage, setStage] = useState('draft');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stuck-flow state
  const [goal, setGoal] = useState(null); // one of GOALS
  const [answers, setAnswers] = useState(['', '', '']);
  const [coach, setCoach] = useState(null); // { feedback, high_risk }
  const [coachTries, setCoachTries] = useState(0);
  const [resetLine, setResetLine] = useState(PAX_RESETS[0]);

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

  // Ask PAX to judge the draft against the chosen goal. PAX never rewrites —
  // it returns 1-3 short sentences and a high-risk flag (pain/distress).
  const runCoach = async () => {
    if (!draft.trim() || !goal) return;
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/coach`,
        {
          text: draft,
          goal: goal.key,
          answers: answers.filter((a) => a.trim()),
        },
        { headers },
      );
      setCoach(data);
      setCoachTries((n) => n + 1);
      setStage('coachPause');
    } catch {
      setError('Pax could not pause on that. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startStuckFlow = () => {
    setGoal(null);
    setAnswers(['', '', '']);
    setCoach(null);
    setCoachTries(0);
    setStage('goalSelect');
  };

  // After 2 coached edits the loop stops: PAX encourages a real pause instead
  // of a third round of judging.
  const handleEditAgain = () => {
    if (coachTries >= 2) {
      setStage('breakOffer');
    } else {
      setStage('coachEdit');
    }
  };

  const showPaxReset = () => {
    setResetLine(PAX_RESETS[Math.floor(Math.random() * PAX_RESETS.length)]);
    setStage('paxReset');
  };

  const restart = () => {
    setStage('draft');
    setDraft('');
    setResult(null);
    setError(null);
    setGoal(null);
    setAnswers(['', '', '']);
    setCoach(null);
    setCoachTries(0);
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
      {/* Subtext underneath — NOT Pax: your own brain after the pause, so no dog mascot */}
      {result?.subtext && (
        <div className="reflection-box flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(37,99,235,0.08)' }}>
              <LuBrain className="text-blue-500" style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="flex flex-col">
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">SubText:</span>
              <span className="text-[11px] text-gray-400 font-serif italic">Your brain, back online — after the pause</span>
            </div>
          </div>
          <div className="text-sm font-serif text-gray-600 whitespace-pre-wrap leading-relaxed">
            {result.subtext.replace(/^SubText\s*\n?/, '').trim()}
          </div>
        </div>
      )}
    </div>
  );

  const DraftBox = ({ label = 'Your draft' }) => (
    <div className="draft-box rounded-lg bg-blue-50/60 border border-blue-100 p-3">
      <p className="draft-label text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1.5">{label}</p>
      <p className="text-sm font-serif text-gray-700 whitespace-pre-wrap">{draft}</p>
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
            <DraftBox />
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

        {/* STAGE: Final Pause -> Send | I'm stuck | Don't Send
            After two tries, PAX offers to help instead of a third analysis run. */}
        {stage === 'pauseFinal' && (
          <motion.div key="pauseFinal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <DraftBox label="Your revised message" />
            <PauseOutput />
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setStage('sent')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                <LuSend className="w-3.5 h-3.5" /> Send
              </button>
              <button onClick={startStuckFlow}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                <LuPawPrint className="w-3.5 h-3.5" /> I'm stuck
              </button>
              <button onClick={() => setStage('deleted')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LuTrash2 className="w-3.5 h-3.5" /> Don't Send
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE: Stuck flow — pick a communication goal */}
        {stage === 'goalSelect' && (
          <motion.div key="goalSelect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <p className="text-sm font-serif text-gray-700">
              🐾 “Okay, let's slow the paws down. What do you want from this conversation?”
            </p>
            {GOALS.map((g) => (
              <button
                key={g.key}
                onClick={() => { setGoal(g); setStage('goalReflect'); }}
                className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100 hover:bg-blue-100 transition-colors text-left"
              >
                <span className="text-xl leading-none mt-0.5">{g.emoji}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-bold text-blue-700">{g.label}</span>
                  <span className="text-xs font-serif text-gray-600">“{g.line}”</span>
                </span>
              </button>
            ))}
            <button onClick={() => setStage('pauseFinal')}
              className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              ← Back to my message
            </button>
          </motion.div>
        )}

        {/* STAGE: Stuck flow — the goal's three reflection questions.
            PAX never rewrites: after answering, the user simply chooses to
            edit their own message or send it as is. */}
        {stage === 'goalReflect' && goal && (
          <motion.div key="goalReflect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <p className="text-sm font-serif text-gray-700">
              {goal.emoji} “Take a slow sniff at these three. No rush — good decisions age well.”
            </p>
            {goal.questions.map((q, i) => (
              <div key={q} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">{q}</label>
                <textarea
                  value={answers[i]}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                  }}
                  placeholder="Just for you — Pax only peeks if you ask for a take."
                  className="w-full p-2.5 border border-blue-200 rounded-lg text-sm font-serif text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-16"
                />
              </div>
            ))}
            <DraftBox />
            <p className="text-sm font-serif text-gray-700">
              Now that you've answered these questions, would you like to edit your message?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStage('coachEdit')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                <LuPencil className="w-3.5 h-3.5" /> Edit my message
              </button>
              <button onClick={() => setStage('sent')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                <LuSend className="w-3.5 h-3.5" /> Send as is
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE: Stuck flow — edit with the goal in mind, then get Pax's take */}
        {stage === 'coachEdit' && goal && (
          <motion.div key="coachEdit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <p className="text-xs text-gray-500 font-serif">
              Edit with {goal.emoji} {goal.label.toLowerCase()} in mind. Your words — Pax will just give a read on how it serves your goal.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-lg text-sm font-serif text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-24"
            />
            <button
              onClick={runCoach}
              disabled={loading || !draft.trim()}
              className="btn-paws btn-paws-primary py-3 text-sm font-bold"
            >
              <LuPawPrint className="w-4 h-4" />
              {loading ? 'Sniffing it over...' : "Get Pax's take"}
            </button>
          </motion.div>
        )}

        {/* STAGE: Stuck flow — Pax's read of the draft against the goal.
            High-risk drafts get empathy only: no humor, and a nudge toward
            a real human. */}
        {stage === 'coachPause' && coach && (
          <motion.div key="coachPause" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <DraftBox />
            <div className="reflection-box flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <MascotAvatar />
                <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">
                  {coach.high_risk ? 'Pax, gently:' : `Pax's take on ${goal ? goal.label.toLowerCase() : 'your goal'}:`}
                </span>
              </div>
              <div className="text-base font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
                {coach.feedback}
              </div>
            </div>
            {coach.high_risk ? (
              <>
                <p className="text-sm font-serif text-gray-600 text-center">
                  This feels bigger than a text message. Please reach out to someone real who cares about you.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setStage('coachEdit')}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                    <LuPencil className="w-3.5 h-3.5" /> Edit my message
                  </button>
                  <button onClick={() => setStage('deleted')}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-blue-50 transition-colors">
                    Step away for now
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setStage('sent')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                  <LuSend className="w-3.5 h-3.5" /> Send
                </button>
                <button onClick={handleEditAgain}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                  <LuPencil className="w-3.5 h-3.5" /> Edit again
                </button>
                <button onClick={() => setStage('breakOffer')}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <LuCoffee className="w-3.5 h-3.5" /> Take a break
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* STAGE: Stuck flow — after 2 coached tries, PAX encourages a real pause */}
        {stage === 'breakOffer' && (
          <motion.div key="breakOffer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">
            <p className="text-sm font-serif text-gray-700 text-center">
              🐾 “You don't have to solve this in the next 60 seconds. Good decisions age well.”
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStage('takeBreak')}
                className="flex flex-col items-center gap-1.5 p-4 rounded-lg bg-blue-50/60 border border-blue-100 hover:bg-blue-100 transition-colors">
                <LuCoffee className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold text-blue-700">Take a break</span>
              </button>
              <button onClick={showPaxReset}
                className="flex flex-col items-center gap-1.5 p-4 rounded-lg bg-blue-50/60 border border-blue-100 hover:bg-blue-100 transition-colors">
                <LuPawPrint className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold text-blue-700">Quick Pax reset</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE: Take a break — PAX guards the draft */}
        {stage === 'takeBreak' && (
          <motion.div key="takeBreak" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4 py-2">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <LuCoffee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-serif text-gray-700 leading-relaxed text-center">
              🐾 “Go grab some water. I'll guard this draft with my life. (Admittedly, I also guard socks.)”
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStage('coachEdit')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                <LuPencil className="w-3.5 h-3.5" /> Back to my message
              </button>
              <button onClick={() => setStage('deleted')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-blue-50 transition-colors">
                I'm done for now
              </button>
            </div>
          </motion.div>
        )}

        {/* STAGE: Quick Pax reset — one-line grounding humor, then back to work */}
        {stage === 'paxReset' && (
          <motion.div key="paxReset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3">
              <MascotAvatar />
              <span className="pax-label text-blue-600 font-bold text-sm tracking-tight">Pax, briefly:</span>
            </div>
            <p className="text-sm font-serif text-gray-700 leading-relaxed text-center">
              {resetLine}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStage('coachEdit')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                <LuPencil className="w-3.5 h-3.5" /> Back to my message
              </button>
              <button onClick={() => setStage('deleted')}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200 hover:bg-blue-50 transition-colors">
                I'm done for now
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
