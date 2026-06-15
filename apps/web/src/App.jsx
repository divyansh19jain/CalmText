import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuLogOut,
  LuLogIn,
  LuCircleUserRound,
  LuClock,
  LuRotateCcw,
  LuMessageSquare,
  LuFileText,
  LuAlignLeft,
  LuSparkles,
  LuSearch,
  LuFeather,
  LuLock,
  LuPawPrint,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import ResultSection from "./components/ResultSection";
import ClearTextResult from "./components/ClearTextResult";
import OwnVoiceResult from "./components/OwnVoiceResult";
import { useAuth } from "./context/AuthContext";
import mascotImg from "./assets/pax_mascot-update-01-copy.png";
import mascotSingleImg from "./assets/single-logo.png";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

// Free trials for anonymous users before login is required
const FREE_TRIAL_LIMIT = 3;
const TRIAL_KEY = "ct_free_trials";

const MODES = [
  { value: "input", label: "I Received This", Icon: LuMessageSquare },
  { value: "output", label: "I Want To Say", Icon: LuFileText },
  { value: "cleartext", label: "ClearText", Icon: LuAlignLeft },
  { value: "voice", label: "Own Voice", Icon: LuFeather, pro: true },
];

const App = () => {
  const { token, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("input");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [ctText, setCtText] = useState("");
  const [ctResult, setCtResult] = useState(null);

  // Own Voice (pro): voice sample + intent → message in your voice
  const [voiceSample, setVoiceSample] = useState(
    () => localStorage.getItem("ct_voice_sample") || "",
  );
  const [intent, setIntent] = useState("");
  const [voiceResult, setVoiceResult] = useState(null);

  // Inline history for right sidebar
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Free-trial tracking for anonymous users
  const [trialsUsed, setTrialsUsed] = useState(
    () => Number(localStorage.getItem(TRIAL_KEY)) || 0,
  );
  const trialsLeft = Math.max(0, FREE_TRIAL_LIMIT - trialsUsed);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistoryItems([]);
      return;
    }
    const load = async () => {
      setHistoryLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistoryItems(data.items || []);
      } catch {
        /* silent */
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [isAuthenticated, token]);

  // Returns false (and redirects to login) if the anonymous user is out of free trials
  const checkTrialAllowance = () => {
    if (isAuthenticated) return true;
    if (trialsUsed >= FREE_TRIAL_LIMIT) {
      navigate("/login", {
        state: { from: "trial", message: "You've used your 3 free Pax takes. Sign in to keep going — it's free." },
      });
      return false;
    }
    return true;
  };

  // Count one free trial for anonymous users
  const consumeTrial = () => {
    if (isAuthenticated) return;
    const next = trialsUsed + 1;
    setTrialsUsed(next);
    localStorage.setItem(TRIAL_KEY, String(next));
  };

  const handleAnalyze = async () => {
    // Own Voice is a signed-in (pro) feature
    if (mode === "voice") {
      if (!isAuthenticated) {
        navigate("/login", {
          state: { from: "voice", message: "Own Voice is a pro feature. Sign in to have Pax write in your voice." },
        });
        return;
      }
      if (!voiceSample.trim() || !intent.trim()) return;
      setLoading(true);
      setVoiceResult(null);
      setError(null);
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/pax/voice`,
          { voice_sample: voiceSample, intent },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setVoiceResult(data);
        localStorage.setItem("ct_voice_sample", voiceSample); // remember their voice
      } catch {
        setError("Couldn't write that. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!checkTrialAllowance()) return;

    if (mode === "cleartext") {
      if (!ctText.trim()) return;
      setLoading(true);
      setCtResult(null);
      setError(null);
      try {
        const { data } = await axios.post(`${API_BASE_URL}/pax/cleartext`, {
          text: ctText,
        });
        setCtResult(data);
        consumeTrial();
      } catch {
        setError("Analysis failed. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!inputText.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/analyze`,
        { text: inputText, mode },
        { headers },
      );
      setResults(data);
      setAnalyzedText(inputText);
      consumeTrial();
      // Refresh history after analysis
      if (isAuthenticated) {
        const h = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistoryItems(h.data.items || []);
      }
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setCtResult(null);
    setVoiceResult(null);
    setInputText("");
    setCtText("");
    setIntent("");
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleReplay = (item) => {
    setResults({ pax: item.pax, subtext: item.subtext, latency_ms: 0 });
    setAnalyzedText(item.text);
    setMode(item.mode);
    setCtResult(null);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const activeText =
    mode === "cleartext" ? ctText : mode === "voice" ? intent : inputText;
  const isResultVisible = results || ctResult || voiceResult;
  const voiceReady = voiceSample.trim() && intent.trim();

  return (
    <div className="app-shell">
      {/* ── Mobile top bar (hidden on md+) ── */}
      <div className="mobile-topbar">
        <div className="flex items-center gap-1.5">
          <img
            src={mascotSingleImg}
            alt="Pax"
            className="w-8 h-8 object-contain"
          />
          <span className="text-sm font-bold text-gray-800">CalmText</span>
        </div>
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl text-blue-500 hover:bg-blue-50 transition-all"
              >
                <LuCircleUserRound className="w-4 h-4" />
                <span className="truncate max-w-[70px]">
                  {user?.username || user?.name || user?.email}
                </span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all"
              >
                <LuLogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-all"
              style={{
                background: "linear-gradient(135deg,#2563EB,#3b82f6)",
                boxShadow: "0 2px 10px rgba(37,99,235,0.3)",
              }}
            >
              <LuLogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* ── 3-column layout (shown on md+) ── */}
      <div className="app-layout">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="sidebar-left">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0">
            <img
              src={mascotSingleImg}
              alt="Pax"
              className="w-30 h-30 object-contain mb-4"
            />
          </div>
          {/* <div className="flex items-center gap-2 px-1 mb-6">
            <span className="text-base font-bold text-gray-800 tracking-tight">CalmText</span>
          </div> */}

          {/* Mode nav */}
          <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-3 mb-1">
              Mode
            </p>
            {MODES.map(({ value, label, Icon, pro }) => (
              <button
                key={value}
                onClick={() => {
                  setMode(value);
                  reset();
                }}
                className={`sidebar-nav-item ${mode === value && !isResultVisible ? "sidebar-nav-active" : ""}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {pro && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom auth section */}
          <div
            className="flex flex-col gap-1 pt-4"
            style={{ borderTop: "1px solid rgba(37,99,235,0.08)" }}
          >
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="sidebar-nav-item"
                >
                  <LuCircleUserRound className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="truncate text-sm">
                    {user?.username || user?.name || user?.email}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="sidebar-nav-item hover:!text-red-400"
                  style={{}}
                >
                  <LuLogOut className="w-4 h-4 flex-shrink-0" />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg,#2563EB,#3b82f6)",
                  boxShadow: "0 3px 14px rgba(37,99,235,0.28)",
                }}
              >
                <LuLogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </aside>

        {/* ─── MAIN PANEL ─── */}
        <main className="main-panel">
          {/* Main panel inner header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(37,99,235,0.07)" }}
          >
            <div className="flex items-center gap-2">
              {isResultVisible && (
                <button
                  onClick={reset}
                  className="text-xs text-blue-400 hover:text-blue-600 font-semibold flex items-center gap-1.5 mr-2 transition-colors"
                >
                  ← Back
                </button>
              )}
              <span className="text-sm font-semibold text-gray-700">
                {isResultVisible
                  ? results
                    ? "Analysis Result"
                    : "ClearText Result"
                  : MODES.find((m) => m.value === mode)?.label}
              </span>
            </div>
            {/* Mobile-only mode switcher in header */}
            {!isResultVisible && (
              <div className="flex md:hidden gap-1">
                {MODES.map(({ value, Icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setMode(value);
                      reset();
                    }}
                    className={`p-1.5 rounded-lg transition-all ${mode === value ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main panel content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AnimatePresence mode="wait">
              {/* Loading */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-6 h-full min-h-[300px]"
                >
                  <div className="glow-loader">
                    <svg
                      className="w-10 h-10 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="7" r="3" />
                      <circle cx="7" cy="11" r="2.5" />
                      <circle cx="17" cy="11" r="2.5" />
                      <circle cx="12" cy="14" r="1.5" />
                      <path d="M12 21c-3.5 0-6.5-2.5-6.5-5.5s2-4.5 4-4.5h5c2 0 4 1.5 4 4.5S15.5 21 12 21z" />
                    </svg>
                  </div>
                  <p className="text-sm text-blue-400 font-medium">
                    Taking a moment to pause...
                  </p>
                </motion.div>
              )}

              {/* Results */}
              {!loading && results && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <ResultSection
                    results={results}
                    originalText={analyzedText}
                    onNewAnalysis={reset}
                    mode={mode}
                  />
                </motion.div>
              )}

              {/* ClearText result */}
              {!loading && ctResult && (
                <motion.div
                  key="ctresult"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <ClearTextResult
                    result={ctResult}
                    originalText={ctText}
                    onNewAnalysis={reset}
                  />
                </motion.div>
              )}

              {/* Own Voice result */}
              {!loading && voiceResult && (
                <motion.div
                  key="voiceresult"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <OwnVoiceResult
                    result={voiceResult}
                    intent={intent}
                    onNewAnalysis={reset}
                  />
                </motion.div>
              )}

              {/* Home */}
              {!loading && !results && !ctResult && !voiceResult && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-5 w-full max-w-xl mx-auto"
                >
                  {/* Hero: mascot + tagline */}
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="relative">
                      <div className="w-[300px] rounded-3xl overflow-hidden relative z-10">
                        <img
                          src={mascotImg}
                          alt="Pax"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight leading-tight">
                        Hi, I'm Pax
                      </h1>
                      <p className="text-sm text-blue-400 font-medium mt-1">
                        Your emotional clarity companion
                      </p>
                    </div>
                  </div>

                  {/* Mobile mode tabs */}
                  <div className="mode-switcher md:hidden">
                    {MODES.map(({ value, label, Icon, pro }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setMode(value);
                          reset();
                        }}
                        className={`mode-tab ${mode === value ? "mode-tab-active" : ""}`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                        {pro && <LuLock className="w-3 h-3 flex-shrink-0 opacity-60" />}
                      </button>
                    ))}
                  </div>

                  {/* Mode context pill */}
                  <div className="flex items-center justify-center">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        background: "rgba(37,99,235,0.08)",
                        color: "#2563EB",
                        border: "1px solid rgba(37,99,235,0.14)",
                      }}
                    >
                      {mode === "input" ? (
                        <>
                          <LuMessageSquare className="w-3.5 h-3.5" /> Decode
                          messages you received
                        </>
                      ) : mode === "output" ? (
                        <>
                          <LuSparkles className="w-3.5 h-3.5" /> Refine what you
                          want to say
                        </>
                      ) : mode === "voice" ? (
                        <>
                          <LuFeather className="w-3.5 h-3.5" /> Write it in your
                          own voice
                        </>
                      ) : (
                        <>
                          <LuSearch className="w-3.5 h-3.5" /> Get clarity on
                          any message
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inputs */}
                  {mode === "voice" ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1 flex items-center gap-1.5">
                          <LuFeather className="w-3.5 h-3.5 text-blue-500" />
                          Your voice — paste a few things you've written
                        </label>
                        <textarea
                          value={voiceSample}
                          onChange={(e) => setVoiceSample(e.target.value)}
                          placeholder="Paste 2–3 past emails or messages so Pax learns how you naturally sound…"
                          className="paws-input h-28"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 ml-1">
                          What do you want to say?
                        </label>
                        <textarea
                          value={intent}
                          onChange={(e) => setIntent(e.target.value)}
                          placeholder="e.g. Tell my client the deadline moves to Friday and apologize for the delay…"
                          className="paws-input h-24"
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={mode === "cleartext" ? ctText : inputText}
                      onChange={(e) =>
                        mode === "cleartext"
                          ? setCtText(e.target.value)
                          : setInputText(e.target.value)
                      }
                      placeholder={
                        mode === "input"
                          ? "Paste the message you received..."
                          : mode === "output"
                            ? "Paste the draft you're writing..."
                            : "Paste the message you want to analyze..."
                      }
                      className="paws-input h-36"
                    />
                  )}

                  {/* Action button */}
                  <button
                    onClick={handleAnalyze}
                    disabled={
                      mode === "voice"
                        ? isAuthenticated && !voiceReady
                        : !activeText.trim()
                    }
                    className="btn-paws btn-paws-primary py-4 text-base font-bold"
                  >
                    {mode === "voice" ? (
                      <>
                        {!isAuthenticated && <LuLock className="w-4 h-4" />}
                        <LuFeather className="w-4 h-4" />
                        Write in My Voice
                      </>
                    ) : (
                      <>
                        <LuPawPrint className="w-5 h-5" />
                        {mode === "cleartext"
                          ? "ClearText"
                          : "Press for the Pax Pause Take"}
                      </>
                    )}
                  </button>

                  {/* Pro hint for Own Voice when signed out */}
                  {mode === "voice" && !isAuthenticated && (
                    <p className="text-center text-xs text-blue-400 -mt-2">
                      Own Voice is a pro feature ·{" "}
                      <button
                        onClick={() => navigate("/login")}
                        className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Sign in to unlock
                      </button>
                    </p>
                  )}

                  {/* Free-trial hint for anonymous users (non-voice modes) */}
                  {mode !== "voice" && !isAuthenticated && (
                    <p className="text-center text-xs text-blue-400 -mt-2">
                      {trialsLeft > 0 ? (
                        <>
                          {trialsLeft} free{" "}
                          {trialsLeft === 1 ? "take" : "takes"} left ·{" "}
                          <button
                            onClick={() => navigate("/login")}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Sign in
                          </button>{" "}
                          for unlimited
                        </>
                      ) : (
                        <>
                          You've used your free takes ·{" "}
                          <button
                            onClick={() => navigate("/login")}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Sign in to continue
                          </button>
                        </>
                      )}
                    </p>
                  )}

                  {error && (
                    <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                      {error}
                    </p>
                  )}

                  {/* Feature hint cards */}
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    {[
                      {
                        Icon: LuMessageSquare,
                        title: "Decode",
                        desc: "Understand hidden tone & intent",
                      },
                      {
                        Icon: LuSparkles,
                        title: "Refine",
                        desc: "Say exactly what you mean",
                      },
                      {
                        Icon: LuSearch,
                        title: "Clarity",
                        desc: "Cut through emotional noise",
                      },
                    ].map(({ Icon, title, desc }) => (
                      <div
                        key={title}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center"
                        style={{
                          background: "rgba(255,255,255,0.55)",
                          border: "1px solid rgba(37,99,235,0.09)",
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(37,99,235,0.08)" }}
                        >
                          <Icon className="w-4 h-4 text-blue-500" />
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          {title}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-tight">
                          {desc}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer tagline */}
                  <p className="text-center text-[11px] text-blue-300 pb-2">
                    Pause · Reflect · Communicate with clarity
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ─── MOBILE HISTORY (shown < 1024px, only when signed in) ─── */}
        {isAuthenticated && (
          <section className="mobile-history">
            <div
              className="flex items-center gap-2.5 px-5 py-3.5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(37,99,235,0.07)" }}
            >
              <LuClock className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-bold text-gray-800">History</span>
            </div>
            <div className="px-3 py-3">
              {historyLoading ? (
                <p className="text-xs text-blue-300 text-center py-6">Loading...</p>
              ) : historyItems.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No searches yet. Analyze a message to get started.
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {historyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleReplay(item)}
                      className="history-sidebar-item group"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(37,99,235,0.07)" }}
                      >
                        <LuRotateCcw className="w-3 h-3 text-blue-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                          {item.text}
                        </p>
                        <p className="text-[11px] text-gray-400 line-clamp-1 leading-tight">
                          {item.pax}
                        </p>
                        <span className="text-[10px] text-blue-300">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── RIGHT SIDEBAR: HISTORY (desktop ≥1024px) ─── */}
        <aside className="sidebar-right">
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(37,99,235,0.07)" }}
          >
            <LuClock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-800">History</span>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(37,99,235,0.07)" }}
                >
                  <LuClock className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Sign in to see your search history
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors mt-1"
                >
                  Sign in →
                </button>
              </div>
            ) : historyLoading ? (
              <p className="text-xs text-blue-300 text-center py-10">
                Loading...
              </p>
            ) : historyItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4">
                <LuClock className="w-8 h-8 text-blue-200" />
                <p className="text-xs text-gray-400 text-center">
                  No searches yet.
                  <br />
                  Analyze a message to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleReplay(item)}
                    className="history-sidebar-item group"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(37,99,235,0.07)" }}
                    >
                      <LuRotateCcw className="w-3 h-3 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                        {item.text}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 leading-tight">
                        {item.pax}
                      </p>
                      <span className="text-[10px] text-blue-300">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
      {/* end app-layout */}
    </div>
  );
};

export default App;
