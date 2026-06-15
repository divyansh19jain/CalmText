import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff, LuMail, LuLock, LuUser, LuAtSign, LuPhone } from 'react-icons/lu';
import AuthLayout from './AuthLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, { email, password, name, username, mobile });
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">Create your account</h2>
        <p className="text-sm text-gray-400">Join CalmText and communicate with clarity.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        <div className="auth-field">
          <LuMail className="auth-field-icon" />
          <input type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
        </div>
        <div className="auth-field">
          <LuLock className="auth-field-icon" />
          <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="auth-input" style={{ paddingRight: '44px' }} />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-eye">
            {showPassword ? <LuEyeOff className="w-5 h-5" /> : <LuEye className="w-5 h-5" />}
          </button>
        </div>

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
          {loading ? 'Please wait...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 pt-1">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignupPage;
