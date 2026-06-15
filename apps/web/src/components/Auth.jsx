import React, { useState } from 'react';
import axios from 'axios';
import {
  LuEye, LuEyeOff, LuX, LuMail, LuLock, LuUser, LuAtSign, LuPhone,
  LuShieldCheck, LuSparkles, LuMessageSquare, LuSearch, LuArrowLeft,
} from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import mascotImg from '../assets/pax_mascot-update-01-copy.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const Auth = ({ onClose }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await axios.post(`${API_BASE_URL}/auth/send-reset-code`, { email });
        setSuccess('A 6-digit code has been sent to your email.');
        switchMode('verify');
      } else if (mode === 'verify') {
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
        await axios.post(`${API_BASE_URL}/auth/verify-reset-code`, { email, code: otpCode, new_password: newPassword });
        setSuccess('Password reset successfully!');
        setOtpCode(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => switchMode('signin'), 1500);
      } else if (mode === 'signup') {
        await axios.post(`${API_BASE_URL}/auth/signup`, { email, password, name, username, mobile });
        setSuccess('Account created! Please sign in.');
        setPassword(''); setName(''); setUsername(''); setMobile('');
        setTimeout(() => switchMode('signin'), 1500);
      } else {
        const { data } = await axios.post(`${API_BASE_URL}/auth/signin`, { email, password });
        login(data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    signin: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Reset password',
    verify: 'Enter reset code',
  };
  const subtitles = {
    signin: 'Sign in to continue your conversations with Pax.',
    signup: 'Join CalmText and communicate with clarity.',
    forgot: "Enter your email and we'll send you a reset code.",
    verify: 'Check your inbox for the 6-digit code.',
  };

  const features = [
    { Icon: LuMessageSquare, title: 'Decode', desc: 'Understand hidden tone & intent' },
    { Icon: LuSparkles,      title: 'Refine', desc: 'Say exactly what you mean' },
    { Icon: LuSearch,        title: 'Clarity', desc: 'Cut through emotional noise' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(200,220,255,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>

      <div className="auth-card w-full max-w-3xl flex max-h-[94vh] overflow-hidden relative"
        style={{
          background: 'rgba(255,255,255,0.78)',
          border: '1px solid rgba(255,255,255,0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '28px',
          boxShadow: '0 24px 64px rgba(37,99,235,0.18), 0 1px 0 rgba(255,255,255,0.9) inset',
        }}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute right-4 top-4 z-20 w-9 h-9 flex items-center justify-center rounded-xl text-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all">
          <LuX className="w-4 h-4" />
        </button>

        {/* ─── Left brand panel (hidden on small screens) ─── */}
        <div className="hidden md:flex flex-col justify-between w-[42%] p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #2563EB 0%, #3b82f6 60%, #60a5fa 100%)',
          }}>
          {/* decorative blobs */}
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.14)', filter: 'blur(8px)' }} />
          <div style={{ position: 'absolute', bottom: '-50px', left: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)', filter: 'blur(6px)' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden">
                <img src={mascotImg} alt="Pax" className="w-9 h-9 object-contain" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">CalmText</span>
            </div>
            <h3 className="text-white text-2xl font-extrabold leading-snug tracking-tight">
              Pause. Reflect.<br />Communicate with clarity.
            </h3>
            <p className="text-blue-100 text-sm mt-3 leading-relaxed">
              Pax helps you understand what people really mean — and say what you really feel.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-3 mt-8">
            {features.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/18 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-bold leading-tight">{title}</span>
                  <span className="text-blue-100 text-[11px] leading-tight">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right form panel ─── */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-5">

          {/* Mobile mini-logo */}
          <div className="flex md:hidden items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: 'rgba(219,234,254,0.8)' }}>
              <img src={mascotImg} alt="Pax" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-extrabold text-blue-900 tracking-tight">CalmText</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1">
            {(mode === 'forgot' || mode === 'verify') && (
              <button type="button" onClick={() => switchMode('signin')}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-700 transition-colors mb-1 w-fit">
                <LuArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
            )}
            <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">{titles[mode]}</h2>
            <p className="text-sm text-gray-400">{subtitles[mode]}</p>
          </div>

          {/* Toggle */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="mode-switcher">
              <button onClick={() => switchMode('signin')} className={`mode-tab ${mode === 'signin' ? 'mode-tab-active' : ''}`}>
                Sign In
              </button>
              <button onClick={() => switchMode('signup')} className={`mode-tab ${mode === 'signup' ? 'mode-tab-active' : ''}`}>
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {mode === 'signup' && (
              <>
                <div className="auth-field">
                  <LuUser className="auth-field-icon" />
                  <input type="text" placeholder="Full name" value={name}
                    onChange={(e) => setName(e.target.value)} className="auth-input" />
                </div>
                <div className="auth-field">
                  <LuAtSign className="auth-field-icon" />
                  <input type="text" placeholder="Username" value={username}
                    onChange={(e) => setUsername(e.target.value)} className="auth-input" />
                </div>
                <div className="auth-field">
                  <LuPhone className="auth-field-icon" />
                  <input type="tel" placeholder="Mobile number" value={mobile}
                    onChange={(e) => setMobile(e.target.value)} className="auth-input" />
                </div>
              </>
            )}

            {mode !== 'verify' && (
              <div className="auth-field">
                <LuMail className="auth-field-icon" />
                <input type="email" placeholder="Email address" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div className="auth-field">
                <LuLock className="auth-field-icon" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="auth-input" style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-eye">
                  {showPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {mode === 'verify' && (
              <>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-400 mb-1">
                  <LuShieldCheck className="w-4 h-4" />
                  <span>Code sent to <span className="font-semibold text-blue-700">{email}</span></span>
                </div>
                <input type="text" placeholder="------" value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required maxLength={6}
                  className="paws-input h-auto py-4 text-center tracking-[0.5em] font-bold text-2xl" />
                <div className="auth-field">
                  <LuLock className="auth-field-icon" />
                  <input type={showNewPassword ? 'text' : 'password'} placeholder="New password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                    className="auth-input" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowNewPassword(v => !v)} className="auth-eye">
                    {showNewPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="auth-field">
                  <LuLock className="auth-field-icon" />
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                    className="auth-input" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="auth-eye">
                    {showConfirmPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}

            {mode === 'signin' && (
              <button type="button" onClick={() => switchMode('forgot')}
                className="text-xs text-blue-500 font-semibold text-right hover:text-blue-700 transition-colors -mt-1">
                Forgot password?
              </button>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 text-sm text-center bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                {success}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-paws btn-paws-primary py-4 text-base font-bold mt-1 disabled:opacity-50">
              {loading ? 'Please wait...' :
                mode === 'signup' ? 'Create Account' :
                mode === 'forgot' ? 'Send Reset Code' :
                mode === 'verify' ? 'Reset Password' : 'Sign In'}
            </button>
          </form>

          {/* Footer switch */}
          {(mode === 'signin' || mode === 'signup') && (
            <p className="text-center text-xs text-gray-400 mt-auto pt-2">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
