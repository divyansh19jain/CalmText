import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LuPawPrint, LuRefreshCw, LuClock, LuPencil, LuMessageSquare, LuCheck, LuCopy,
} from 'react-icons/lu';
import mascotImg from '../assets/single-logo.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const PaxAvatar = () => {
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

// One of Pax's steps: the avatar, a step label, and what Pax has to say.
const PaxSays = ({ step, title, children }) => (
  <div className="glass-card flex flex-col gap-3">
    <div className="flex items-center gap-2.5">
      <PaxAvatar />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
          Step {step}
        </span>
        <span className="text-sm font-bold text-gray-800">{title}</span>
      </div>
    </div>
    <div className="text-[15px] leading-relaxed text-gray-700">{children}</div>
  </div>
);

// What the user can do at the end. Deliberately includes "don't send" as a
// first-class outcome — sometimes the right ending is not a better message.
const CHOICES = [
  {
    key: 'nothing',
    Icon: LuCheck,
    label: "Don't send anything",
    line: 'You said what you needed to say here. That can be the whole thing.',
    done: "Nothing sent. What you worked out doesn't disappear just because you kept it.",
  },
  {
    key: 'later',
    Icon: LuClock,
    label: 'Decide later',
    line: 'Step away and come back to it when it is not sitting on your chest.',
    done: 'Left for later. Come back when it feels smaller — it usually does.',
  },
  {
    key: 'short',
    Icon: LuMessageSquare,
    label: 'Send something short',
    line: 'One or two lines that hold your ground without reopening the whole thing.',
    done: 'Keep it to what needs to reach them. Short is not cold — it is clear.',
  },
  {
    key: 'write',
    Icon: LuPencil,
    label: 'Write a reply',
    line: 'You know what you want them to understand. Now put it in your words.',
    done: 'Your reply is yours to write. Pax has said its bit.',
  },
];

// The client's "understand me" loop:
//   MESSAGE -> UNDERSTAND -> REACTION -> REGULATE -> CHOOSE
// Told first, replied to later. Pax reflects before it ever weighs in on
// whether sending helps, because being corrected first is the same
// experience that brought the user here.
const UnderstandMe = ({ token }) => {
  // stages: tell | reflect | loop | pause | choose | done
  const [stage, setStage] = useState('tell');
  const [what, setWhat] = useState('');
  const [result, setResult] = useState(null);
  const [choice, setChoice] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (!what.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/understand`,
        { text: what },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      setResult(data);
      setStage('reflect');
    } catch (err) {
      if (!err?.response) {
        setError("Can't reach Pax right now. Check your connection and try again.");
      } else if (err.response.status === 402) {
        setError("You've used your free thinking-throughs. Upgrade to keep going.");
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyDraft = async () => {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy. Please select the text and copy it manually.');
    }
  };

  const restart = () => {
    setStage('tell');
    setWhat('');
    setResult(null);
    setChoice(null);
    setDraft('');
    setError(null);
  };

  const fade = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <AnimatePresence mode="wait">

        {/* 1 — UNDERSTAND ME */}
        {stage === 'tell' && (
          <motion.div key="tell" {...fade} className="flex flex-col gap-3">
            <PaxSays step="1" title="Tell Pax what happened">
              Say it however it comes out. Don't write your reply yet — that part
              comes later, and it goes better once you've been heard.
            </PaxSays>
            <textarea
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="What happened, and what it felt like…"
              className="paws-input h-40"
            />
            <button
              onClick={submit}
              disabled={!what.trim() || loading}
              className="btn-paws btn-paws-primary btn-paws-pill py-4 text-base font-bold"
            >
              <LuPawPrint className="w-5 h-5" />
              {loading ? 'Pax is listening…' : 'Tell Pax'}
            </button>
          </motion.div>
        )}

        {/* 2 — REFLECT */}
        {stage === 'reflect' && result && (
          <motion.div key="reflect" {...fade} className="flex flex-col gap-3">
            <PaxSays step="2" title="Here's what Pax heard">
              {result.reflection}
            </PaxSays>
            <button
              onClick={() => setStage('loop')}
              className="btn-paws btn-paws-primary btn-paws-pill py-4 text-base font-bold"
            >
              That's about right
            </button>
            <button onClick={restart} className="um-quiet">
              Not quite &mdash; let me say it again
            </button>
          </motion.div>
        )}

        {/* 3 — CHECK THE LOOP */}
        {stage === 'loop' && result && (
          <motion.div key="loop" {...fade} className="flex flex-col gap-3">
            <PaxSays step="3" title="What the back-and-forth is doing">
              {result.loop}
            </PaxSays>
            <button
              onClick={() => setStage('pause')}
              className="btn-paws btn-paws-primary btn-paws-pill py-4 text-base font-bold"
            >
              Go on
            </button>
          </motion.div>
        )}

        {/* 4 — PAUSE: what needs saying vs what needs sending */}
        {stage === 'pause' && result && (
          <motion.div key="pause" {...fade} className="flex flex-col gap-3">
            <PaxSays step="4" title="Two different things">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
                    Needs to be said
                  </p>
                  <p>{result.express}</p>
                </div>
                <div className="pt-3" style={{ borderTop: '1px solid var(--rule, rgba(37,99,235,0.14))' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
                    Needs to be sent
                  </p>
                  <p>{result.send}</p>
                </div>
              </div>
            </PaxSays>
            <button
              onClick={() => setStage('choose')}
              className="btn-paws btn-paws-primary btn-paws-pill py-4 text-base font-bold"
            >
              Decide what happens next
            </button>
          </motion.div>
        )}

        {/* 5 — CHOOSE */}
        {stage === 'choose' && (
          <motion.div key="choose" {...fade} className="flex flex-col gap-3">
            <PaxSays step="5" title="Your call">
              Any of these is a real answer. Not sending is one of them.
            </PaxSays>
            <div className="flex flex-col gap-2">
              {CHOICES.map(({ key, Icon, label, line }) => (
                <button
                  key={key}
                  onClick={() => {
                    setChoice(CHOICES.find((c) => c.key === key));
                    setStage('done');
                  }}
                  className="um-choice"
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-500 leading-snug">{line}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Outcome */}
        {stage === 'done' && choice && (
          <motion.div key="done" {...fade} className="flex flex-col gap-3">
            <PaxSays step="5" title={choice.label}>
              {choice.done}
            </PaxSays>

            {(choice.key === 'short' || choice.key === 'write') && (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    choice.key === 'short'
                      ? 'A line or two, in your words…'
                      : 'Your reply, in your words…'
                  }
                  className="paws-input h-32"
                />
                <button
                  onClick={copyDraft}
                  disabled={!draft.trim()}
                  className="btn-paws btn-paws-primary btn-paws-pill py-4 text-base font-bold"
                >
                  {copied ? <LuCheck className="w-4 h-4" /> : <LuCopy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy my message'}
                </button>
              </>
            )}

            <button onClick={restart} className="um-quiet">
              <LuRefreshCw className="w-4 h-4" />
              Start something new
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
};

export default UnderstandMe;
