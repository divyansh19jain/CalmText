import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowLeft, LuPencil, LuCheck, LuLogOut, LuMail, LuUser,
  LuPhone, LuAtSign, LuSparkles, LuClock, LuCalendar, LuShieldCheck,
  LuCrown,
} from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import UpgradeModal from '../components/UpgradeModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const ProfilePage = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  // New feature: usage stats pulled from history
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });
  // Upgrade / change-plan modal
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return; }

    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(data);
        setName(data.name || '');
        setUsername(data.username || '');
        setMobile(data.mobile || '');
      } catch { setError('Could not load profile.'); }
    };

    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const items = data.items || [];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = items.filter(i => new Date(i.created_at) >= weekAgo).length;
        setStats({ total: items.length, thisWeek });
      } catch { /* stats are best-effort */ }
    };

    fetchProfile();
    fetchStats();
  }, [token, navigate]);

  const handleSave = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const { data } = await axios.put(`${API_BASE_URL}/profile`,
        { name, username, mobile },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(data); setEditing(false); setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || '?';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  // Subscription plan label: paid plan name (capitalised) or "Free".
  const isSubscribed = !!profile?.has_unlimited_search_access;
  const planName = isSubscribed
    ? (profile?.subscription_plan || 'Pro').replace(/^\w/, (c) => c.toUpperCase())
    : 'Free';

  const fields = [
    { label: 'Full Name', key: 'name',     value: name,     setter: setName,     type: 'text', Icon: LuUser,   placeholder: 'Your full name' },
    { label: 'Username',  key: 'username', value: username, setter: setUsername, type: 'text', Icon: LuAtSign, placeholder: 'Username' },
    { label: 'Mobile',    key: 'mobile',   value: mobile,   setter: setMobile,   type: 'tel',  Icon: LuPhone,  placeholder: 'Mobile number' },
  ];

  const statCards = [
    { label: 'Total Analyses', value: stats.total,    Icon: LuSparkles },
    { label: 'This Week',      value: stats.thisWeek, Icon: LuClock },
    { label: 'Member Since',   value: memberSince,    Icon: LuCalendar },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl xxl:max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
            <LuArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50">
              <LuLogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>

        {/* ── Hero card ── */}
        <div className="relative overflow-hidden rounded-3xl mb-6"
          style={{
            background: 'linear-gradient(135deg,#2563EB 0%,#3b82f6 55%,#60a5fa 100%)',
            boxShadow: '0 18px 48px rgba(37,99,235,0.28)',
          }}>
          <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 p-7 sm:p-9">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-extrabold bg-white/20 ring-4 ring-white/30 backdrop-blur-md flex-shrink-0">
              {initials}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-white text-2xl font-extrabold tracking-tight">
                {profile?.name || profile?.username || 'Welcome'}
              </h1>
              <p className="text-blue-100 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <LuMail className="w-3.5 h-3.5" /> {profile?.email || '—'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                  <LuShieldCheck className="w-3.5 h-3.5" /> Verified account
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${isSubscribed ? 'bg-amber-300/90 text-amber-900' : 'bg-white/20 text-white'}`}>
                  <LuCrown className="w-3.5 h-3.5" /> {planName} plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row (new feature) ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {statCards.map(({ label, value, Icon }) => (
            <div key={label}
              className="flex flex-col items-center sm:items-start gap-2 rounded-2xl p-4 sm:p-5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                boxShadow: '0 6px 20px var(--surface-shadow)',
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-extrabold text-gray-800 leading-none">{value}</p>
                <p className="text-[11px] text-gray-400 font-medium mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Info card ── */}
        {profile && (
          <div className="rounded-3xl p-6 sm:p-7"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              boxShadow: '0 10px 32px var(--surface-shadow)',
            }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-800 tracking-tight">Account details</h2>
              {!editing && (
                <button onClick={() => { setEditing(true); setSuccess(''); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
                  <LuPencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {fields.map(({ label, key, value, setter, type, Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500 flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <label className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">{label}</label>
                    {editing ? (
                      <input type={type} value={value} onChange={e => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white border border-blue-100 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800 truncate">{profile[key] || '—'}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Email (read-only) */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400 flex-shrink-0">
                  <LuMail className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Email</label>
                  <p className="text-sm font-medium text-gray-400 truncate">{profile.email}</p>
                </div>
              </div>

              {/* Plan (read-only) + upgrade/change action */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSubscribed ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                  <LuCrown className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <label className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Plan</label>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {planName} plan
                    {isSubscribed && profile.subscription_status
                      ? ` · ${profile.subscription_status}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  <LuSparkles className="w-3.5 h-3.5" />
                  {isSubscribed ? 'Change plan' : 'Upgrade'}
                </button>
              </div>
            </div>

            {error   && <p className="text-red-500 text-xs text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-4">{error}</p>}
            {success && <p className="text-green-600 text-xs text-center bg-green-50 border border-green-100 rounded-xl px-3 py-2 mt-4">{success}</p>}

            {editing && (
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setEditing(false); setError(''); setSuccess(''); setName(profile.name || ''); setUsername(profile.username || ''); setMobile(profile.mobile || ''); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg,#2563EB,#3b82f6)', boxShadow: '0 3px 14px rgba(37,99,235,0.28)' }}>
                  <LuCheck className="w-4 h-4" /> {loading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade / change-plan modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentPlan={isSubscribed ? (profile?.subscription_plan || 'medium') : null}
        onChanged={(data) =>
          setProfile((p) => ({
            ...p,
            subscription_plan: data.subscription_plan,
            subscription_status: data.subscription_status || p.subscription_status,
            has_unlimited_search_access: true,
          }))
        }
      />
    </div>
  );
};

export default ProfilePage;
