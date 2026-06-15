import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LuEye, LuEyeOff, LuMail, LuLock, LuPawPrint } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import AuthLayout from './AuthLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const trialMessage = location.state?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/signin`, { email, password });
      login(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Welcome back</span>
        <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">Sign in to CalmText</h2>
        <p className="text-sm text-gray-400">Continue your conversations with Pax.</p>
      </div>

      {trialMessage && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-2">
          <LuPawPrint className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{trialMessage}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 ml-1">Email</label>
          <div className="auth-field">
            <LuMail className="auth-field-icon" />
            <input type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-semibold text-gray-500">Password</label>
            <Link to="/forgot-password"
              className="text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="auth-field">
            <LuLock className="auth-field-icon" />
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="auth-input" style={{ paddingRight: '46px' }} />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-eye"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="btn-paws btn-paws-primary py-4 text-base font-bold mt-1 disabled:opacity-50">
          {loading ? 'Please wait…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
