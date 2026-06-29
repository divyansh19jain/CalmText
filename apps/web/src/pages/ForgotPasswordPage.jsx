import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff, LuMail, LuLock, LuShieldCheck, LuArrowLeft } from 'react-icons/lu';
import AuthLayout from './AuthLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (step === 'request') {
        await axios.post(`${API_BASE_URL}/auth/send-reset-code`, { email });
        setSuccess('A 6-digit code has been sent to your email.');
        setStep('verify');
      } else {
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
        await axios.post(`${API_BASE_URL}/auth/verify-reset-code`, { email, code: otpCode, new_password: newPassword });
        setSuccess('Password reset successfully! Redirecting...');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : typeof detail === 'string'
          ? detail
          : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login"
        className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold hover:text-blue-700 transition-colors w-fit">
        <LuArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">
          {step === 'request' ? 'Reset password' : 'Enter reset code'}
        </h2>
        <p className="text-sm text-gray-400">
          {step === 'request'
            ? "Enter your email and we'll send you a reset code."
            : 'Check your inbox for the 6-digit code.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {step === 'request' ? (
          <div className="auth-field">
            <LuMail className="auth-field-icon" />
            <input type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
          </div>
        ) : (
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
              <input type={showNew ? 'text' : 'password'} placeholder="New password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                className="auth-input" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowNew(v => !v)} className="auth-eye">
                {showNew ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
              </button>
            </div>
            <div className="auth-field">
              <LuLock className="auth-field-icon" />
              <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className="auth-input" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="auth-eye">
                {showConfirm ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
              </button>
            </div>
          </>
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

        <button type="submit" disabled={loading}
          className="btn-paws btn-paws-primary py-4 text-base font-bold mt-1 disabled:opacity-50">
          {loading ? 'Please wait...' : step === 'request' ? 'Send Reset Code' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
