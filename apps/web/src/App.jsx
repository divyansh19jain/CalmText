import React, { useState, useEffect, useRef } from "react";
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
  LuReply,
  LuImage,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import ResultSection from "./components/ResultSection";
import ThreadView from "./components/ThreadView";
import ClearTextResult from "./components/ClearTextResult";
import OwnVoiceResult from "./components/OwnVoiceResult";
import QuotaExhaustedModal from "./components/QuotaExhaustedModal";
import UpgradeModal from "./components/UpgradeModal";
import PaymentResultModal from "./components/PaymentResultModal";
import ThemeToggle from "./components/ThemeToggle";
import { useAuth } from "./context/AuthContext";
import Tesseract from "tesseract.js";
import mascotImg from "./assets/pax_mascot-update-01-copy.png";
import mascotSingleImg from "./assets/single-logo.png";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

// Free analyses everyone gets before the upgrade popup appears
const FREE_TRIAL_LIMIT = 3;
// Tracked per-user so each new account gets its own 3 free analyses.
// Anonymous visitors share the "guest" bucket.
const TRIAL_KEY_PREFIX = "ct_free_trials";
const trialKeyFor = (user) => `${TRIAL_KEY_PREFIX}_${user?.id ?? "guest"}`;

const MODES = [
  { value: "input", label: "I Received This", Icon: LuMessageSquare },
  { value: "output", label: "Reply", Icon: LuReply },
  // Hidden for now per client — backend and components stay for a later release.
  // Own Voice is still reachable via Pax's hand-off after the reply loop.
  // { value: "cleartext", label: "ClearText", Icon: LuAlignLeft },
  // { value: "voice", label: "Own Voice", Icon: LuFeather, pro: true },
];

// Prepare a screenshot for OCR: upscale small images, grayscale, and
// auto-invert dark-mode screenshots (light text on dark bg) so Tesseract
// sees dark text on a light background — which it reads far more accurately.
const preprocessScreenshot = (file, region) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Crop to the selected region (if any), else use the whole image
      const sx = region ? region.x : 0;
      const sy = region ? region.y : 0;
      const sw = region ? region.w : img.width;
      const sh = region ? region.h : img.height;
      const scale = Math.min(3, Math.max(1, 1500 / sw));
      const w = Math.round(sw * scale);
      const h = Math.round(sh * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = g;
        sum += g;
      }
      const avg = sum / (d.length / 4);
      if (avg < 128) {
        for (let i = 0; i < d.length; i += 4) {
          d[i] = d[i + 1] = d[i + 2] = 255 - d[i];
        }
      }
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("blob failed"))),
        "image/png",
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });

// Reduce raw OCR to just the conversation text. Chat screenshots include a
// lot of UI: the contact header, timestamps, read-receipt ticks, date
// separators, the "type a message" bar, and garbled bits from icons. We strip
// timestamps/known UI text, then keep only lines that actually read like real
// sentences (mostly dictionary-shaped words) so noise/gibberish is dropped.
const cleanOcrText = (raw) => {
  const TIME = /\d{1,2}[:.]\d{2}\s*(?:[ap]\.?\s?m\.?|[ap])?/gi;
  const DATE_SEP =
    /^(today|yesterday|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})$/i;

  // A line "reads like a message" when most of its tokens are real-ish words
  // (letters only after trimming punctuation, and containing a vowel).
  const looksLikeMessage = (line) => {
    const tokens = line.split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    const good = tokens.filter((t) => {
      const w = t.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
      return /^[A-Za-z][a-z]{1,14}$/.test(w) && /[aeiou]/i.test(w);
    }).length;
    return good >= 1 && good / tokens.length >= 0.6;
  };

  return (raw || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(TIME, " ") // remove timestamps anywhere on the line
        .replace(/type a message/gi, " ") // WhatsApp input bar
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter((line) => {
      if (!line) return false;
      if (DATE_SEP.test(line)) return false;
      return looksLikeMessage(line);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const App = () => {
  const { token, user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState("input");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedText, setAnalyzedText] = useState("");
  // Screenshot upload (I Received This): in-browser OCR fills the message box
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  // Crop step — pick the message area before reading it
  const [ocrFile, setOcrFile] = useState(null); // selected image awaiting crop
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState(null);
  const [cropRect, setCropRect] = useState(null); // {x,y,w,h} in displayed px
  const cropImgRef = useRef(null);
  const cropStart = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [thread, setThread] = useState(null);
  const [ctText, setCtText] = useState("");
  const [ctResult, setCtResult] = useState(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Stripe checkout outcome: null | 'success' | 'pending' | 'cancel'
  const [paymentResult, setPaymentResult] = useState(null);

  // Own Voice (pro): voice sample + intent → message in your voice
  const [voiceSample, setVoiceSample] = useState(
    () => localStorage.getItem("ct_voice_sample") || "",
  );
  const [intent, setIntent] = useState("");
  const [voiceResult, setVoiceResult] = useState(null);

  // Inline history for right sidebar
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Backend search usage for the logged-in user ({ remaining, has_unlimited_search_access })
  const [usage, setUsage] = useState(null);

  // Free-trial tracking — per user (each account gets its own 3 free analyses)
  const [trialsUsed, setTrialsUsed] = useState(0);
  const trialsLeft = Math.max(0, FREE_TRIAL_LIMIT - trialsUsed);

  // Load this user's trial count whenever the logged-in user changes
  useEffect(() => {
    setTrialsUsed(Number(localStorage.getItem(trialKeyFor(user))) || 0);
  }, [user]);

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

  // Returns false (and opens the upgrade popup) once the free analyses are used up.
  // Logged-in users are governed by the backend (search limit + unlimited flag),
  // so we only enforce the local limit for anonymous visitors here.
  const checkTrialAllowance = () => {
    if (isAuthenticated) return true;
    if (trialsUsed >= FREE_TRIAL_LIMIT) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  // Count one free analysis for anonymous users (logged-in users are counted by the backend)
  const consumeTrial = () => {
    if (isAuthenticated) return;
    const next = trialsUsed + 1;
    setTrialsUsed(next);
    localStorage.setItem(trialKeyFor(user), String(next));
  };

  // Refresh the logged-in user's remaining searches from the backend
  const refreshUsage = async () => {
    if (!isAuthenticated) {
      setUsage(null);
      return;
    }
    try {
      const { data } = await axios.get(`${API_BASE_URL}/pax/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsage(data);
    } catch {
      /* silent */
    }
  };

  // Load usage whenever the logged-in user changes
  useEffect(() => {
    refreshUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  // Handle Stripe Checkout return: ?checkout=success&session_id=... unlocks
  // the account; ?checkout=cancel just clears the params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;

    const cleanUrl = () =>
      window.history.replaceState({}, "", window.location.pathname);

    if (checkout === "success" && token) {
      const sessionId = params.get("session_id");
      (async () => {
        try {
          let paid = false;
          if (sessionId) {
            const { data } = await axios.post(`${API_BASE_URL}/payments/verify`, null, {
              params: { session_id: sessionId },
              headers: { Authorization: `Bearer ${token}` },
            });
            // Backend confirms via Stripe: payment_status === 'paid' / status 'complete'
            paid = !!(data?.success || data?.has_unlimited_search_access);
          }
          setShowUpgradeModal(false);
          await refreshUsage();
          setError(null);
          // "success" only when Stripe confirms payment; otherwise it's pending.
          setPaymentResult(paid ? "success" : "pending");
        } catch {
          // Payment may still be confirmed by the Stripe webhook shortly after.
          setPaymentResult("pending");
        } finally {
          cleanUrl();
        }
      })();
    } else if (checkout === "cancel") {
      setPaymentResult("cancel");
      cleanUrl();
    } else {
      cleanUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Free searches left: backend count for logged-in users, local count for guests.
  // null = unlimited / unknown → hide the hint.
  const freeRemaining = !isAuthenticated
    ? trialsLeft
    : usage && !usage.has_unlimited_search_access
      ? usage.remaining
      : null;

  // Check if error is due to quota exhaustion
  const isQuotaExhausted = (error) => {
    return (
      error?.response?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('insufficient_quota') ||
      error?.response?.data?.error?.code === 'insufficient_quota'
    );
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
      if (!checkTrialAllowance()) return;
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
        consumeTrial();
        refreshUsage();
        localStorage.setItem("ct_voice_sample", voiceSample); // remember their voice
        // Refresh history so the new Own Voice entry shows up
        const h = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistoryItems(h.data.items || []);
      } catch (err) {
        if (err?.response?.status === 402) {
          setShowUpgradeModal(true);
          refreshUsage();
        } else if (isQuotaExhausted(err)) {
          setShowQuotaModal(true);
        } else {
          setError("Couldn't write that. Please try again.");
        }
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
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const { data } = await axios.post(
          `${API_BASE_URL}/pax/cleartext`,
          { text: ctText },
          { headers }
        );
        setCtResult(data);
        consumeTrial();
        refreshUsage();
        // Refresh history after ClearText analysis
        if (isAuthenticated) {
          const h = await axios.get(`${API_BASE_URL}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setHistoryItems(h.data.items || []);
        }
      } catch (err) {
        if (err?.response?.status === 402) {
          setShowUpgradeModal(true);
          refreshUsage();
        } else if (isQuotaExhausted(err)) {
          setShowQuotaModal(true);
        } else {
          setError("Analysis failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!inputText.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);
    // New conversation: incoming message + its outgoing drafts share this id
    const convId =
      (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `conv_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.post(
        `${API_BASE_URL}/pax/analyze`,
        { text: inputText, mode, conversation_id: convId },
        { headers },
      );
      setResults(data);
      setAnalyzedText(inputText);
      setConversationId(convId);
      consumeTrial();
      refreshUsage();
      // Refresh history after analysis
      if (isAuthenticated) {
        const h = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistoryItems(h.data.items || []);
      }
    } catch (err) {
      if (err?.response?.status === 402) {
        setShowUpgradeModal(true);
        refreshUsage();
      } else if (isQuotaExhausted(err)) {
        setShowQuotaModal(true);
      } else {
        setError("Analysis failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: pick a screenshot → open the crop preview (don't OCR yet).
  const openScreenshotCropper = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setOcrError("Please choose an image file.");
      return;
    }
    setOcrError(null);
    setCropRect(null);
    setOcrFile(file);
    setOcrPreviewUrl(URL.createObjectURL(file));
  };

  const closeScreenshotCropper = () => {
    if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
    setOcrPreviewUrl(null);
    setOcrFile(null);
    setCropRect(null);
    cropStart.current = null;
  };

  // Drag a selection box over the preview image
  const onCropPointerDown = (e) => {
    if (!cropImgRef.current) return;
    const rect = cropImgRef.current.getBoundingClientRect();
    cropStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCropRect({ x: cropStart.current.x, y: cropStart.current.y, w: 0, h: 0 });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onCropPointerMove = (e) => {
    if (!cropStart.current || !cropImgRef.current) return;
    const rect = cropImgRef.current.getBoundingClientRect();
    const cx = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const cy = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropRect({
      x: Math.min(cropStart.current.x, cx),
      y: Math.min(cropStart.current.y, cy),
      w: Math.abs(cx - cropStart.current.x),
      h: Math.abs(cy - cropStart.current.y),
    });
  };
  const onCropPointerUp = () => {
    cropStart.current = null;
  };

  // Step 2: read the selected region (or the whole image) with in-browser OCR
  // and drop the cleaned text into the message box. Backend is untouched.
  const extractFromScreenshot = async () => {
    if (!ocrFile) return;
    const file = ocrFile;
    const img = cropImgRef.current;
    let region = null;
    if (img && cropRect && cropRect.w > 8 && cropRect.h > 8) {
      const scaleX = img.naturalWidth / img.clientWidth;
      const scaleY = img.naturalHeight / img.clientHeight;
      region = {
        x: cropRect.x * scaleX,
        y: cropRect.y * scaleY,
        w: cropRect.w * scaleX,
        h: cropRect.h * scaleY,
      };
    }
    closeScreenshotCropper();
    setOcrError(null);
    setOcrLoading(true);
    try {
      // Pre-process for accuracy (falls back to the raw file if it fails)
      const image = await preprocessScreenshot(file, region).catch(() => file);
      const { data } = await Tesseract.recognize(image, "eng");
      const text = cleanOcrText(data?.text);
      if (text) {
        setInputText((prev) => (prev.trim() ? `${prev}\n${text}` : text));
      } else {
        setOcrError("Couldn't find any text in that screenshot.");
      }
    } catch {
      setOcrError("Couldn't read that screenshot. Please try another image.");
    } finally {
      setOcrLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setCtResult(null);
    setVoiceResult(null);
    setThread(null);
    setInputText("");
    setCtText("");
    setIntent("");
    setError(null);
    setOcrError(null);
  };

  // Pax's end-of-loop nudge: send the user into the existing Own Voice flow.
  // Clears the current result view and drops them on the Own Voice input screen.
  const handleUseOwnVoice = () => {
    reset();
    setMode("voice");
  };

  // Open a full conversation thread (incoming + its outgoing drafts) read-only
  const handleOpenThread = (group) => {
    setResults(null);
    setCtResult(null);
    setVoiceResult(null);
    setThread(group.items);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleReplay = (item) => {
    // Reset all result views, then restore the one matching this item's mode
    setResults(null);
    setCtResult(null);
    setVoiceResult(null);
    setMode(item.mode);

    if (item.mode === "voice") {
      setIntent(item.text);
      setVoiceResult({ message: item.pax, latency_ms: 0 });
    } else if (item.mode === "cleartext") {
      setCtText(item.text);
      setCtResult({ feedback: item.pax, latency_ms: 0 });
    } else {
      setAnalyzedText(item.text);
      setConversationId(item.conversation_id || null);
      setResults({ pax: item.pax, subtext: item.subtext, latency_ms: 0 });
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group history into conversations.
  // Items sharing a conversation_id (an incoming message + its outgoing drafts)
  // collapse into one entry. Legacy rows without a conversation_id fall back to
  // grouping by their normalized text.
  const groupedHistory = (() => {
    const grouped = new Map();
    historyItems.forEach((item) => {
      const key = item.conversation_id
        ? `conv:${item.conversation_id}`
        : `text:${item.text
            .trim()
            .toLowerCase()
            .replace(/[.,!?;:—\-()]/g, '')
            .replace(/\s+/g, ' ')}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          text: item.text,
          items: [],
          latestDate: item.created_at,
        });
      }
      const group = grouped.get(key);
      group.items.push(item);
      if (new Date(item.created_at) > new Date(group.latestDate)) {
        group.latestDate = item.created_at;
      }
    });
    // For each conversation, title it with the incoming ("input") message if present
    grouped.forEach((group) => {
      const incoming = group.items.find((i) => i.mode === "input");
      if (incoming) group.text = incoming.text;
    });
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.latestDate) - new Date(a.latestDate)
    );
  })();

  const activeText =
    mode === "cleartext" ? ctText : mode === "voice" ? intent : inputText;
  const isResultVisible = results || ctResult || voiceResult || thread;
  const voiceReady = voiceSample.trim() && intent.trim();

  return (
    <div className="app-shell">
      {/* ── Mobile top bar (hidden on md+) ── */}
      <div className="mobile-topbar">
        <div className="flex items-center">
          <img
            src={mascotImg}
            alt="CalmText"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
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
            style={{ borderTop: "1px solid var(--surface-border)" }}
          >
            {/* Theme toggle row */}
            <div className="flex items-center justify-between px-3 py-1.5 mb-1">
              <span className="text-xs font-semibold t-muted">Appearance</span>
              <ThemeToggle />
            </div>
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
                  ? thread
                    ? "Conversation"
                    : results
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
                    onUseOwnVoice={handleUseOwnVoice}
                    mode={mode}
                    token={token}
                    conversationId={conversationId}
                    onHistoryRefresh={async () => {
                      if (isAuthenticated) {
                        const h = await axios.get(`${API_BASE_URL}/history`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setHistoryItems(h.data.items || []);
                      }
                    }}
                  />
                </motion.div>
              )}

              {/* Conversation thread (read-only view from history) */}
              {!loading && thread && (
                <motion.div
                  key="thread"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <ThreadView items={thread} onNewAnalysis={reset} />
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
              {!loading && !results && !ctResult && !voiceResult && !thread && (
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
                        Hi, I am Pax.
                      </h1>
                      <p className="text-sm text-blue-400 font-medium mt-1">
                        🐾 Think before you text.
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

                  {/* Screenshot upload — only for "I Received This" */}
                  {mode === "input" && (
                    <div className="flex flex-col gap-1.5 -mt-2">
                      <label
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          ocrLoading
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer hover:bg-blue-50"
                        }`}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--surface-border)",
                          color: "#2563EB",
                        }}
                      >
                        <LuImage className="w-4 h-4 flex-shrink-0" />
                        {ocrLoading
                          ? "Reading screenshot…"
                          : "Upload a screenshot"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={openScreenshotCropper}
                          disabled={ocrLoading}
                          className="hidden"
                        />
                      </label>
                      {ocrError && (
                        <p className="text-red-500 text-xs text-center">
                          {ocrError}
                        </p>
                      )}
                    </div>
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

                  {/* Free-search hint — shown until the user has unlimited access */}
                  {mode !== "voice" && freeRemaining !== null && (
                    <p className="text-center text-xs text-blue-400 -mt-2">
                      {freeRemaining > 0 ? (
                        <>
                          {freeRemaining} free{" "}
                          {freeRemaining === 1 ? "take" : "takes"} left ·{" "}
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Upgrade
                          </button>{" "}
                          for unlimited
                        </>
                      ) : (
                        <>
                          You've used your free takes ·{" "}
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Upgrade to continue
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
                          background: "var(--surface)",
                          border: "1px solid var(--surface-border)",
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

        {/* ─── RIGHT SIDEBAR: HISTORY ─── */}
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
                {groupedHistory.map((group) => (
                  <button
                    key={group.text}
                    onClick={() => {
                      // Pax conversations (incoming/outgoing) open as a full thread;
                      // standalone ClearText / Own Voice items replay as before.
                      const hasConversation = group.items.some(
                        (i) => i.mode === "input" || i.mode === "output",
                      );
                      if (hasConversation) {
                        handleOpenThread(group);
                      } else {
                        handleReplay(group.items[0]);
                      }
                    }}
                    className="history-sidebar-item group relative"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(37,99,235,0.07)" }}
                    >
                      <LuRotateCcw className="w-3 h-3 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                        {group.text}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 leading-tight">
                        {(group.items.find((i) => i.mode === "input") || group.items[0]).pax}
                      </p>
                      <span className="text-[10px] text-blue-300">
                        {formatDate(group.latestDate)}
                        {group.items.length > 1 && ` · ${group.items.length} in thread`}
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

      {/* Screenshot crop step — drag to select just the messages, then read */}
      {ocrPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={closeScreenshotCropper}
        >
          <div
            className="flex flex-col gap-3 w-full max-w-lg rounded-2xl p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-gray-700">
              Drag to select just the messages
            </p>
            <p className="text-xs text-gray-400 -mt-1.5">
              Draw a box around the text you want. Skip it to read the whole image.
            </p>
            <div
              className="relative select-none overflow-hidden rounded-lg mx-auto"
              style={{ touchAction: "none", cursor: "crosshair", maxHeight: "60vh" }}
              onPointerDown={onCropPointerDown}
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerUp}
            >
              <img
                ref={cropImgRef}
                src={ocrPreviewUrl}
                alt="Screenshot preview"
                draggable={false}
                className="block max-w-full"
                style={{ maxHeight: "60vh", pointerEvents: "none" }}
              />
              {cropRect && cropRect.w > 0 && cropRect.h > 0 && (
                <div
                  className="absolute border-2 border-blue-500 pointer-events-none"
                  style={{
                    left: cropRect.x,
                    top: cropRect.y,
                    width: cropRect.w,
                    height: cropRect.h,
                    background: "rgba(37,99,235,0.15)",
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={closeScreenshotCropper}
                className="py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{ borderColor: "var(--surface-border)", color: "#6b7280" }}
              >
                Cancel
              </button>
              <button
                onClick={extractFromScreenshot}
                className="py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg,#2563EB,#3b82f6)",
                  boxShadow: "0 3px 14px rgba(37,99,235,0.28)",
                }}
              >
                {cropRect && cropRect.w > 8 ? "Read selection" : "Read whole image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Exhausted Modal */}
      <QuotaExhaustedModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
      />

      {/* Upgrade Modal — shown after free analyses are used up */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* Payment result — shown when returning from Stripe Checkout */}
      <PaymentResultModal
        isOpen={!!paymentResult}
        status={paymentResult}
        onClose={() => setPaymentResult(null)}
      />
    </div>
  );
};

export default App;
