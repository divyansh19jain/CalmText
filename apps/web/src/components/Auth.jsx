import React, { useState } from 'react';
import axios from 'axios';
import { LuEye, LuEyeOff, LuX } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';

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
    signup: 'Create account',
    forgot: 'Reset password',
    verify: 'Enter reset code',
  };

  const inputCls = 'paws-input h-auto py-4 text-base';
  const inputWrap = 'relative';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(200,220,255,0.45)', backdropFilter: 'blur(12px)' }}>

      <div className="w-full max-w-sm mx-4 flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(255,255,255,0.90)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderRadius: '28px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(37,99,235,0.15), 0 1px 0 rgba(255,255,255,0.9) inset',
        }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-900 tracking-tight">{titles[mode]}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <LuX className="w-4 h-4" />
          </button>
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
              <input type="text" placeholder="Full name" value={name}
                onChange={(e) => setName(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Username" value={username}
                onChange={(e) => setUsername(e.target.value)} className={inputCls} />
              <input type="tel" placeholder="Mobile number" value={mobile}
                onChange={(e) => setMobile(e.target.value)} className={inputCls} />
            </>
          )}

          {mode !== 'verify' && (
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <div className={inputWrap}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-600 transition-colors">
                {showPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {mode === 'verify' && (
            <>
              <p className="text-sm text-blue-400 text-center">
                Code sent to <span className="font-semibold text-blue-700">{email}</span>
              </p>
              <input type="text" placeholder="6-digit code" value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6}
                className={`${inputCls} text-center tracking-[0.5em] font-bold text-xl`} />
              <div className={inputWrap}>
                <input type={showNewPassword ? 'text' : 'password'} placeholder="New password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                  className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShowNewPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-600">
                  {showNewPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                </button>
              </div>
              <div className={inputWrap}>
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                  className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-600">
                  {showConfirmPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}

          {mode === 'signin' && (
            <button type="button" onClick={() => switchMode('forgot')}
              className="text-xs text-blue-500 font-medium text-right hover:text-blue-700 transition-colors">
              Forgot password?
            </button>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
              {success}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-paws btn-paws-primary py-4 text-base font-bold mt-1 disabled:opacity-50">
            {loading ? 'Please wait...' :
              mode === 'signup' ? 'Create Account' :
              mode === 'forgot' ? 'Send Reset Code' :
              mode === 'verify' ? 'Reset Password' : 'Sign In'}
          </button>

          {(mode === 'forgot' || mode === 'verify') && (
            <button type="button" onClick={() => switchMode('signin')}
              className="text-xs text-blue-300 font-medium text-center hover:text-blue-600 transition-colors">
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
