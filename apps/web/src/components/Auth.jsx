import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const Auth = ({ onClose }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot' | 'verify'
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
        // Step 1: Send OTP to email
        await axios.post(`${API_BASE_URL}/auth/send-reset-code`, { email });
        setSuccess('A 6-digit code has been sent to your email.');
        switchMode('verify');

      } else if (mode === 'verify') {
        // Step 2: Verify OTP and reset password
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.'); setLoading(false); return;
        }
        await axios.post(`${API_BASE_URL}/auth/verify-reset-code`, {
          email, code: otpCode, new_password: newPassword,
        });
        setSuccess('Password reset successfully!');
        setOtpCode(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => switchMode('signin'), 1500);

      } else if (mode === 'signup') {
        await axios.post(`${API_BASE_URL}/auth/signup`, {
          email, password, name, username, mobile,
        });
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
    forgot: 'Forgot password',
    verify: 'Enter reset code',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{titles[mode]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
        </div>

        {/* Toggle — only for signin/signup */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-pax-blue-secondary text-white shadow' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-pax-blue-secondary text-white shadow' : 'text-gray-500'}`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Sign Up extra fields */}
          {mode === 'signup' && (
            <>
              <input type="text" placeholder="Full name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="paws-input h-auto py-4 text-base" />
              <input type="text" placeholder="Username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="paws-input h-auto py-4 text-base" />
              <input type="tel" placeholder="Mobile number" value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="paws-input h-auto py-4 text-base" />
            </>
          )}

          {/* Email — shown in signin, signup, forgot */}
          {mode !== 'verify' && (
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required className="paws-input h-auto py-4 text-base" />
          )}

          {/* Password — signin/signup only */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                required minLength={6}
                className="paws-input h-auto py-4 text-base pr-12" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* OTP verify step */}
          {mode === 'verify' && (
            <>
              <p className="text-sm text-gray-500 text-center">
                Code sent to <span className="font-semibold text-gray-700">{email}</span>
              </p>
              <input
                type="text"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="paws-input h-auto py-4 text-base text-center tracking-[0.5em] font-bold text-xl"
              />
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} placeholder="New password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required minLength={6}
                  className="paws-input h-auto py-4 text-base pr-12" />
                <button type="button" onClick={() => setShowNewPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required minLength={6}
                  className="paws-input h-auto py-4 text-base pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}

          {/* Forgot password link */}
          {mode === 'signin' && (
            <button type="button" onClick={() => switchMode('forgot')}
              className="text-xs text-pax-blue-secondary font-medium text-right hover:underline">
              Forgot password?
            </button>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center">{success}</p>}

          <button type="submit" disabled={loading}
            className="btn-paws btn-paws-primary py-4 text-base font-bold mt-1">
            {loading ? 'Please wait...' :
              mode === 'signup' ? 'Create Account' :
              mode === 'forgot' ? 'Send Reset Code' :
              mode === 'verify' ? 'Reset Password' :
              'Sign In'}
          </button>

          {(mode === 'forgot' || mode === 'verify') && (
            <button type="button"
              onClick={() => switchMode('signin')}
              className="text-xs text-gray-400 font-medium text-center hover:underline">
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
